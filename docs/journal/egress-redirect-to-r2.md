# Swapping the egress backend to R2 — same redirect shape, free egress

The previous journal ([`egress-redirect-to-gcs.md`](./egress-redirect-to-gcs.md)) was about moving the download data plane *off Cloud Run* by handing clients a V4 signed GCS URL. That migration worked exactly as designed — Cloud Run egress on the bypassed endpoints went to zero, the concurrency slots stopped being held open during downloads, and `DownloadResponder` ended up being the single touchpoint to add or remove a backend behind.

This journal is about the next move: GCS → Cloudflare R2 (commit `a1705a5`, follow-up `410d1ca`). Nothing about the previous design was wrong; the trigger was purely a cost projection. The redirect shape — verify HMAC token, hand back a presigned URL, stop — is unchanged.

## The cost math that triggered it

GCS' free tier gives 1 GB of egress per month. After that it's `$0.12/GB` in the multi-region us-central1 setup the BFF runs in. The shape of what vibi serves is dominated by audio:

- Separation stems average ~10 MB/min as wav (later FLAC; see below). A 60-second clip across 2 speakers + background is roughly 30 MB.
- Render mp4 outputs are smaller per second of content but get fetched in full whenever a user resumes a project.

Hand-rolled projection from internal telemetry for the next 100-user beta cohort came out around 50 GB egress/month — call it `$5.88/mo`. Fine *alone*. The shape that mattered was the linear scaling: every additional user adds their slice, and the slice doesn't shrink with scale. A hobby SaaS bill that grows linearly with users is the kind of thing you want to bend down before it has any inertia.

R2 charges nothing for egress. That flips the projection from "linear in users" to "flat at zero for the egress line item." Storage and Class A operations (PUT/POST) cost the same order of magnitude as GCS, but the dominant cost vector — bytes leaving the bucket toward clients — is gone.

R2 was chosen *specifically* for egress economics. Not because GCS was deficient at anything.

## What got considered

A short list before committing to R2:

- **R2** — free egress, S3-compatible API (so `software.amazon.awssdk:s3` is a drop-in), Cloudflare account already exists for `vibi-landing`'s hosting. Win on all three axes.
- **Backblaze B2** — also cheap egress (1 GB/day free, then `$0.01/GB` outbound). New vendor relationship, new dashboard, no existing footprint.
- **Self-hosted CDN in front of GCS** — strictly more moving parts. Doesn't address the underlying GCS egress; just shifts when you pay for it.

R2 won on (a) free egress vs. capped-then-cheap egress, (b) zero new vendor surface, (c) S3-compatible swap-in.

## What was easy

The `ObjectStore` interface from the GCS journal turned out to be *exactly* the seam this migration needed. `DownloadResponder` consumes `uploadIfAbsent(file, key, contentType) + signedUrl(key, …)`. It doesn't know about a vendor; it knows about a shape.

So the bulk of the diff (`a1705a5`, 22 files, +311/-251) is:

- Rename `GcsObjectStore` → `ObjectStore` (generalize, not vendor-specific).
- Swap dependency: `com.google.cloud:google-cloud-storage:2.43.0` out, `software.amazon.awssdk:s3:2.29.40` + `url-connection-client:2.29.40` in.
- Rename config: `gcsBucket`/`gcsSignedUrlTtlSec` → `r2Bucket` + `R2Credentials(accountId, accessKeyId, secretAccessKey)` + `signedUrlTtlSec`.
- Rename env: `GCS_*` → `R2_*` / `SIGNED_URL_TTL_SEC`.
- `gcs:` parameter → `store:` across routes.

Routes, HMAC tokens, content-type derivation, the idempotent-upload memo, the `respondDownload` flow — all untouched. The `DownloadResponder` source still reads basically the same; the only line that changed is the comment from "GCS V4 signed URL" to "R2 SigV4 presigned URL."

## What was almost easy but had gotchas

If this section were empty the migration wouldn't be worth writing up. The gotchas are mostly small, but they're the kind that absorb an afternoon each if you hit them blind.

### `Region.of("auto")`

R2 has no real concept of regions — data sits in a single global namespace and Cloudflare's edge handles routing. But the AWS SDK *rejects* a blank `Region`. The S3-compatible servers behind R2 expect the literal string `"auto"` as a placeholder region.

```kotlin
private val R2_REGION = Region.of("auto")
```

Easy fix once the symptom (SDK throwing during `S3Client.builder().build()`) leads you to the docs.

### AWS SDK 2.30+ added automatic CRC32 request checksums

This is the gotcha I want anyone reading this to walk away with. AWS SDK Java v2 versions `2.30.0+` started injecting a CRC32 request checksum header on every PUT by default. The S3 spec allows the server to either accept it or reject it; R2 rejects it in a way that surfaces as opaque `BadRequest` on uploads.

Pinning to `software.amazon.awssdk:s3:2.29.40` made it go away. The pin is in `build.gradle.kts` with a comment explaining *why* — left undocumented, a future bump-the-deps PR will silently break R2 again.

```kotlin
implementation("software.amazon.awssdk:s3:2.29.40")
implementation("software.amazon.awssdk:url-connection-client:2.29.40")
```

### HTTP client backend selection

AWS SDK v2 ships three sync/async HTTP backends: Apache (default), Netty (async), and `UrlConnectionHttpClient` (JDK built-in, sync, minimal deps). The default Apache backend pulls in `org.apache.httpcomponents.client5:*` transitively.

For *this* BFF, R2 traffic is:

- **1 PUT** per artifact (on first download per Cloud Run instance — the in-process memo dedupes the rest).
- **0–1 HEAD** per artifact (the warm path skips it).
- **0 GET** from the BFF (downloads go directly client→R2 via the presigned URL).

The lightest backend is overkill-proof. From `ObjectStore.kt`:

```kotlin
.httpClientBuilder(UrlConnectionHttpClient.builder())
```

Dependency tree is one item lighter. Cold-start startup is marginally faster.

### HEAD on a missing key — 403 or 404, depending on token scope

R2's response to `HeadObject` on a non-existent key depends on the API token's permission shape. With **Object Read & Write**, you get `404 NoSuchKey`. With more constrained tokens, you can get `403 Forbidden` instead — Cloudflare treats "you can't see this key" and "this key doesn't exist" the same way to avoid leaking namespace information.

The idempotent upload memo treats both as "missing":

```kotlin
private val MISSING_KEY_STATUS_CODES = setOf(403, 404)

// HEAD
} catch (e: S3Exception) {
    if (e.statusCode() in MISSING_KEY_STATUS_CODES) -1L else throw e
}
```

If permission is *genuinely* missing, the subsequent `putObject` throws — so coalescing 403 with 404 here doesn't paper over a real auth failure, it just sidesteps the ambiguity for the missing-key case.

### `S3Presigner` is a separate object from `S3Client`

In the GCS world, `Storage` does both upload and signing. AWS SDK v2 splits them: `S3Client` for data plane operations, `S3Presigner` for URL signing. Both are `AutoCloseable`. Both have to be wired into `Application.kt`'s shutdown hook, alongside the existing httpClient and service shutdowns:

```kotlin
runCatching { s3.close() }
runCatching { presigner.close() }
```

A small thing, but easy to miss until a graceful shutdown leaves a thread pool dangling.

## The IAM simplification

The previous journal's Pitfall 1 walked through `serviceAccountTokenCreator` self-binding — Cloud Run's ADC has no private key, so `Storage.signUrl` can't sign locally, so it has to delegate to IAM `signBlob`, so the runtime SA needs permission to sign on its own behalf. Three causally-linked sentences for one config line.

R2 uses static access keys (`R2_ACCESS_KEY_ID` + `R2_SECRET_ACCESS_KEY`, stored in Secret Manager). Signing happens *locally* in the BFF process because the SDK has the key material. No IAM delegation needed.

`deploy/cloud-run.sh` lost the entire block:

```bash
# (removed)
gcloud services enable storage.googleapis.com iamcredentials.googleapis.com
gcloud storage buckets create "gs://${GCS_BUCKET}" --location="$REGION" \
    --uniform-bucket-level-access --public-access-prevention
gcloud storage buckets add-iam-policy-binding "gs://${GCS_BUCKET}" \
  --member="serviceAccount:$SA_EMAIL" --role="roles/storage.objectAdmin"
gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/iam.serviceAccountTokenCreator"
# inline lifecycle.json heredoc + gcloud storage buckets update --lifecycle-file
```

…and gained two lines: `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` going through the existing `create_or_update_secret` helper. The `--set-env-vars` string trades `GCS_BUCKET` + `GCS_SIGNED_URL_TTL_SEC` for `R2_BUCKET` + `R2_ACCOUNT_ID` + `SIGNED_URL_TTL_SEC` (account ID isn't secret — it's in your dashboard URL).

The bootstrap script ended up ~30 lines shorter. Two fewer GCP APIs to enable. One fewer IAM binding to reason about during code review. The trade is that the bucket itself, plus its lifecycle rules, lives in Cloudflare's dashboard instead of in the script — there's no `gcloud storage buckets create` equivalent in the deploy flow. That's a fair trade for a dashboard you visit ~once per year.

## Sibling decisions made in the same window

A small cluster of related commits landed alongside the R2 swap. Calling them out so the chronology is visible to future readers:

- **wav → FLAC for separation stems** (commit `61274d8`). Perso hands back uncompressed PCM wav for speaker/background stems. Transcode pass via `ffmpeg -c:a flac -compression_level 5` gives ~50% size reduction with no audible loss. On GCS this would have been a direct egress savings; on R2 the *egress* line item is already zero, so the saving is on *storage* and *PUT bandwidth into R2* (and proportionally on the user's *download* time — which is the more user-visible win). The two optimizations stack.
- **7-day lifecycle on the bucket** (`deploy/r2-lifecycle.json`). Same intent as the prior `deploy/gcs-lifecycle.json` (commit `546879b`) — render and separation outputs are immutable, age == last-modified, so delete after 7 days. The S3-compatible format (`Rules[].Expiration.Days=7`) is applied via Cloudflare dashboard rather than `gcloud storage buckets update --lifecycle-file=...`. One less thing the deploy script owns.
- **Admin login redesign + Hikari Neon cold-start timeout** (`e8adfeb`). Unrelated to the storage migration, but shipped in the same session. Worth a footnote because the admin SPA login page is the first thing you see post-deploy, and a Neon-hosted Postgres scaling from zero was making the first request after idle look like a 502.

## What the two-step proves about the abstraction

The clearest takeaway, looking back at both commits together:

The GCS migration proved the abstraction held *by creating it*. The wins were real but conflated with the cost of writing `DownloadResponder` and `GcsObjectStore` in the first place — you can't fully separate "this design is reusable" from "this design solves the problem at hand" when you only see one instance of it.

The R2 migration proved the abstraction held *by swapping the backend underneath unchanged routes*. `RenderRoutes`, `SeparationRoutes`, the HMAC token plumbing, the idempotency memo's behavior — none of them moved. The diff lived entirely in `ObjectStore.kt`, `StorageConfig`, env var names, and `deploy/cloud-run.sh`. That's the empirical demonstration that the seam was in the right place.

It's a small lesson but a sturdy one: **the first time you write an abstraction, you don't yet know if it's the right shape — you find out the second time you use it.** The cost of writing the abstraction up-front is paid against the savings the *second* time. If you only ever have one backend, the abstraction is overhead. If you have two, it's the unit of swap.

## What changed on the bill

Three numbers, post-R2:

- **GCS egress** — gone. Bucket deleted after R2 catch-up was verified.
- **R2 egress** — zero, by pricing.
- **Cloud Run egress** — unchanged from the previous journal (still zero on the bypassed endpoints).

What replaces the GCS egress line is R2 storage (orders of magnitude smaller than egress under the original projection) and R2 Class A operations (PUTs — bounded by the upload-once + memo pattern). For the 100-user beta projection, the post-migration bill on the storage line is in the cents-per-month range, not dollars.

## What generalizes

- **An abstraction is validated by its second user, not its first.** `ObjectStore` looked fine after the GCS migration. It looked *correct* after the R2 migration.
- **Egress economics dominate when bytes are the product.** For an audio app, the byte cost of the artifact is the bill. Picking a backend on that axis up-front would have skipped this migration entirely — but the GCS-first path was the right choice when "does the redirect shape work at all" was still an open question.
- **Pin around silent breakage at the edge.** The AWS SDK 2.30 CRC32 change wasn't documented as a breaking change because *S3 itself* accepts the checksum. It only breaks the S3-*compatibles* (R2, MinIO, B2). When you depend on compatibility rather than the original, version pins need an explicit reason attached to them.
- **Pick the lightest HTTP backend the call shape allows.** Defaults are tuned for "any S3 workload"; `UrlConnectionHttpClient` works fine for "one PUT and a HEAD, infrequent."

## Related reading

- [`egress-redirect-to-gcs.md`](./egress-redirect-to-gcs.md) — the prior step. The redirect shape this journal swaps the backend behind.
- [`cloud-run-deploy-journey.md`](./cloud-run-deploy-journey.md) — the deploy workflow that absorbed the env var rename + secret additions.
- [`../reference/environment.md`](../reference/environment.md) — `R2_BUCKET`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `SIGNED_URL_TTL_SEC`.
- [`../explanation/pipelines.md`](../explanation/pipelines.md) — "Download responder" section (the abstraction this migration tested by swapping under).
