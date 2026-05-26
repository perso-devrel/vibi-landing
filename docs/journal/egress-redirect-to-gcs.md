# Letting GCS send the bytes — egress + concurrency on Cloud Run

The first Cloud Run revisions of vibi-bff worked, but a single user pulling a 60-second mp4 render would tie up an entire concurrency slot for the full duration of the download. With `--concurrency 4` (the BFF's setting — ffmpeg is CPU-bound, so we keep concurrency low), four simultaneous downloads were enough to wedge the service and trigger an autoscale. The bytes weren't even being transformed in flight; the BFF was just acting as a passthrough.

This journal is about the commit that moved that passthrough off Cloud Run entirely (`f70af80`) — what the symptoms were, what shape the fix took, and what *almost worked but didn't* on the way.

## What the BFF was doing before

Every download endpoint — render, separation stems, separation mix, autodub video/audio, subtitle SRT — funneled into Ktor's `respondFile` after the HMAC token was verified. The flow per download:

1. Mobile calls `GET /api/v2/render/<jobId>/download?token=…` over the Cloud Run HTTPS frontend.
2. The request is routed to a Cloud Run instance, which takes one of its 4 concurrency slots.
3. `respondFile` streams the local mp4 (sitting under `/tmp/storage/render/`) chunk by chunk through Cloud Run's egress.
4. The slot is freed only when the client TCP connection finishes (or times out).

The result was three coupled costs that all scaled with download size:

- **Cloud Run CPU-seconds** while the streaming happens — small but non-zero, and accrues per second of download time.
- **Cloud Run egress** bytes — the same bytes that already exist as a local file.
- **Concurrency slot occupancy** — the worst of the three. A slow client on a 200 MB render holds the slot for a minute on a mobile network, and other users get queued behind it.

The first instinct was "lower concurrency further so each instance does one thing at a time, autoscale handles the rest." That trades concurrency for instance-count, which trades egress cost for cold-start latency. The actual fix is to make Cloud Run *stop being the data plane*.

## The shape of the fix

After verifying the HMAC token, *redirect the client to a V4 signed GCS URL* and stop. The instance writes ~200 bytes of `Location:` header and is done. GCS handles the byte stream from there.

```kotlin
// DownloadResponder.kt
suspend fun ApplicationCall.respondDownload(
    file: File, objectKey: String,
    contentType: ContentType, downloadFilename: String?,
    gcs: GcsObjectStore?,
) {
    if (gcs != null) {
        val url = withContext(Dispatchers.IO) {
            gcs.uploadIfAbsent(file, objectKey, contentType.toString())
            gcs.signedUrl(objectKey, downloadFilename = downloadFilename, contentType = contentType.toString())
        }
        respondRedirect(url, permanent = false)
        return
    }
    // Local dev: respondFile fallback
    response.header(HttpHeaders.ContentType, contentType.toString())
    respondFile(file)
}
```

Every download call site (`RenderRoutes`, `SeparationRoutes`, plus the now-removed `AutoDubRoutes` / `SubtitleRoutes` of the time) replaced its `respondFile` call with `respondDownload`. The local-dev path with no GCS configured falls through to the original streaming flow.

Once that landed, the per-download Cloud Run footprint dropped to roughly the cost of an `upload-if-absent` GCS metadata roundtrip (when the file is already in GCS) plus the redirect response (~one HTTP roundtrip's worth of CPU). The mp4 itself never crosses Cloud Run's egress.

## Pitfall 1 — Cloud Run ADC has no private key, so `signedUrl` fails

**Visible symptom**: first deploy of the new code. `/render/.../download` returned 500 with `Signing key not provided and could not be derived`. The same code worked locally (where the SA JSON has a private key inline).

**Cause**: Cloud Run's attached service account is *not* a JSON key — it's an identity surfaced through the metadata server. `Storage.signUrl` defaults to *local* signing (multiplies the URL bytes by the SA's private key); without a private key, it can't. The fallback path is *remote* signing via the IAM `signBlob` API, which Google's client library can use when the SA is allowed to sign on its own behalf.

**Fix**: add a self-binding so the SA can call `iam.serviceAccountTokenCreator` on itself.

```bash
# deploy/cloud-run.sh
gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
  --role=roles/iam.serviceAccountTokenCreator \
  --member="serviceAccount:${SA_EMAIL}" \
  --condition=None
```

After that the client library transparently picks the remote-signing path when no local key is available. No code change needed.

**Observation**: the symptom *only happens on Cloud Run*. It can't be reproduced locally because a developer's SA JSON has the key inline. The error message is also vague — it implies "you forgot to provide a key," but the actual missing piece is *permission to self-sign through IAM*. This is the kind of pitfall that would have been a 30-minute production incident if it hadn't been caught on the first deploy.

## Pitfall 2 — `uploadIfAbsent` was issuing a GCS metadata RPC on every hit

**Visible symptom**: not a bug — a cost smell. The same instance handed out signed URLs to ~10 stems for a single separation job, then the user came back the next day and re-downloaded them all. Each call did a GCS `GET` (to check existence) before short-circuiting.

**Cause**: the function correctly avoided *re-uploading* duplicates, but it issued a metadata RPC every time to decide. Multiply by stem count × revisit cadence and the metadata traffic dominates the actual upload traffic.

**Fix**: a process-local memo of `objectKey → fileLen` for "we already uploaded this on this instance." When the memo hits, skip the GCS RPC entirely. Cold start clears the memo; the first request after a cold start does the full RPC, after which the memo is warm.

```kotlin
private val uploadedKeys = ConcurrentHashMap<String, Long>()

fun uploadIfAbsent(file: File, objectKey: String, contentType: String) {
    val fileLen = file.length()
    if (uploadedKeys[objectKey] == fileLen) return        // hot path
    val existing = storage.get(BlobId.of(bucket, objectKey))
    if (existing != null && existing.size == fileLen) {
        uploadedKeys[objectKey] = fileLen
        return                                              // warm path
    }
    storage.createFrom(...)
    uploadedKeys[objectKey] = fileLen                       // cold path
}
```

**Observation**: this works *because* of Cloud Run's `--session-affinity`. Without affinity, the same user's repeat requests would round-robin across instances and the memo would never hit. The flag is on for a different reason (job-state continuity for the same client), but it makes the memo viable. Two unrelated config decisions reinforcing each other is worth noticing.

## Pitfall 3 — V4 signed URLs can't carry response headers in `headers:`, only in query

**Visible symptom**: clients downloaded the right file but it came down with no `Content-Disposition`, so browsers and download managers used the GCS object name (`render/rnd-abc123.mp4`) instead of the user-friendly name we wanted.

**Cause**: V4 signed URLs *can* carry response-overriding headers, but only as query parameters (`response-content-disposition=...`), not as `Storage.SignUrlOption.withHeader`. The `withHeader` path requires the client to send the header on the request, which mobile HTTP libraries on redirect don't.

**Fix**:

```kotlin
opts.add(Storage.SignUrlOption.withQueryParams(
    mapOf("response-content-disposition" to "attachment; filename=\"$downloadFilename\"")
))
```

GCS reads the query param at fetch time and emits the matching response header. The signature includes the query param, so a tampered filename invalidates the URL.

**Observation**: "header-like" things on signed URLs can be passed in any of three places (request header, signed request header, signed query param), and only one of them works when the recipient is dumb (a `<a download>` or a curl `-L`). When you can't control what the client does on redirect, push everything into the URL itself.

## Pitfall 4 — `storage.createFrom` defaults to 256 KB chunks

**Visible symptom**: a 200 MB render upload took noticeably longer in the GCS path than as a `respondFile` stream would have. Logs showed many small `PUT` requests.

**Cause**: the GCS Java client's resumable upload defaults to 256 KB per chunk. For a 200 MB file that's ~780 round-trips between the BFF and GCS. The metadata RPC roundtrip per chunk adds up.

**Fix**: bump the chunk size to 16 MB.

```kotlin
private const val UPLOAD_BUFFER_BYTES = 16 * 1024 * 1024
storage.createFrom(info, file.toPath(), UPLOAD_BUFFER_BYTES)
```

The upload now takes ~12 round-trips for the same 200 MB file. The memory cost is exactly one chunk in flight, which is acceptable on a 2 Gi Cloud Run instance.

**Observation**: defaults that are tuned for "small files, untrusted network" don't fit a server in the same region as the bucket. The same data path on a developer's laptop would be slow either way (because the bottleneck is your home upstream), so the default isn't visibly wrong until you move to a low-latency, high-throughput environment.

## Pitfall 5 — `quality=high` saved no Cloud Run CPU and cost more bytes

**Visible symptom**: the new `RenderConfig.quality` enum was added at the same time. Initial profiles were `low/medium/high = CRF 28 / 23 / 18` with preset `slow` for high to maximize visual quality.

**Cause**: x264's `preset=slow` is roughly 4x slower than `preset=fast`. Combined with `CRF 18` (which dumps a lot more bytes than 23), `high` was simultaneously a CPU-second tax and an egress tax. The original intent — "give users a clean export option" — was sound, but the parameter choice doubled both costs at once.

**Fix**: clamp the high end at `preset=medium` and `CRF=20`. The trio became:

| Profile | CRF | preset | audio |
|---|---|---|---|
| `high` | 20 | medium | 192k |
| `medium` | 23 | fast | 192k |
| `low` | 28 | fast | 128k |

`low` is ~50% smaller than `medium` for the same content, which goes straight to egress savings. `high` is capped at `preset=medium` so Cloud Run CPU-second cost stays predictable.

**Observation**: a UI-facing "high/medium/low" dial maps onto an N-dimensional parameter space (CRF, preset, audio bitrate, audio codec, …). It's tempting to push each axis to its extreme for "high" — but each axis has its own cost profile, and the cost profiles aren't proportional. CRF moves perceived quality faster than preset does *and* costs less. Picking the right axis to scale per tier is the actual design.

## What changed on the bill

Three numbers moved together after this commit:

- **Cloud Run egress** — went to zero on the bypassed endpoints. The remaining egress is the redirect response itself (~200 bytes per call) and the local-dev path.
- **Cloud Run CPU-seconds** — dropped by the duration of every download. For a 60s mp4 download on a 5 Mbps mobile network, that's 60s of slot occupancy freed per download.
- **GCS egress** — replaced the Cloud Run egress. The unit cost in the same region is the same order of magnitude, but you only pay for the egress, not the slot.

The net effect at vibi's traffic shape is a much smaller bill *and* materially better concurrency tolerance — the 4 concurrency slots are now used for the work that can't be moved (ffmpeg renders, Perso polls), not for byte passthrough.

## What generalizes

- **Pick the right *path* for the data, not just the right *code*.** The streaming code wasn't wrong; the bytes were on the wrong wire. Once that frame is on the table, the rest is wiring.
- **Whichever Cloud-Run-specific symptom you're chasing, check the auth model first.** Pitfall 1 took the longest to diagnose because the failure mode (no private key on Cloud Run) had no local analog.
- **Defaults are tuned for the median caller, not for *your* environment.** The 256 KB chunk size, the local-signing default, the V4 header placement — three independent settings whose defaults pointed away from "server-in-the-same-region-as-the-bucket signing on a Cloud Run instance." Be ready to flip each one explicitly.
- **A UI tier (high/medium/low) isn't a single knob — it's a multi-dimensional vector.** Don't pin every axis to its extreme; pick the one that moves perceived quality the most for the least cost, and clamp the rest.

## Related reading

- [`cloud-run-deploy-journey.md`](./cloud-run-deploy-journey.md) — the deploy story that this journal lives downstream of
- [`../explanation/pipelines.md`](../explanation/pipelines.md) — "Download responder — file streaming vs. GCS redirect" section
- [`../reference/environment.md`](../reference/environment.md) — `GCS_BUCKET`, `GCS_SIGNED_URL_TTL_SEC`
- [`ios-pitfalls-with-kmp.md`](./ios-pitfalls-with-kmp.md) — same shape on the iOS side (one runtime, one set of defaults that only fail at the boundary)
