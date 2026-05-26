# Tutorial — Export a project to mp4

This tutorial walks the export flow — **from the timeline 저장 tap all the way down to the ffmpeg pipeline the BFF runs**. The interesting twist is the *asset-by-reference* path: vibi avoids re-uploading the source video on every export by pushing bytes directly to Cloudflare R2 once, then referencing them by SHA-256 key. By the end:

- You'll have intuition for the job-then-poll skeleton that all vibi BFF flows share.
- You'll know when `POST /assets/upload-url` saves you a 50 MB re-upload and when it doesn't.
- You'll be able to reconstruct the "upload-once-to-object-store, render-by-reference" pattern in your own code.

Prerequisite: [`getting-started.md`](./getting-started.md) is done, BFF and the mobile app are alive, and you're signed in. The asset-by-reference path requires `R2_BUCKET` to be configured on the BFF — without it the mobile client falls back to the legacy multipart `POST /render` (still supported).

---

## 0. What you need

- A 10–30 second mp4 (longer works but the demo gets slow).
- A shell where the BFF console stdout is visible. You'll trace calls there.

## 1. Build something to export (mobile)

Launch the app → InputScreen → pick a video. The app does the local prep with no BFF call:

- Metadata (duration / resolution) is extracted via `VideoMetadataExtractor` (`AndroidVideoMetadataExtractor` / `IosVideoMetadataExtractor`).
- A draft project is persisted to Room (`VibiDatabase`) under the signed-in user's id.

The app navigates to TimelineScreen. Do a couple of things so the export has something to render:

- Drag a range and tap **"이 구간 음원분리"** to add a `SeparationDirective` (this also triggers a BFF separation job — covered in detail in [`tutorial-stem-separation.md`](./tutorial-stem-separation.md)).
- Add a BGM clip from "BGM" → pick a file from device or record on the spot.
- Optionally use **BgmTrimSheet** on the BGM clip to drag a sub-range.

## 2. Tap 저장

Tap the **저장** action in the timeline header. The default export is a single mp4 — the multi-language variant picker that lived here previously was retired alongside the subtitle / auto-dub features.

## 3. Push the bytes to R2 — `POST /assets/upload-url`

`V3RenderExecutor` walks the project's segments and BGM clips and, for each one, asks the BFF for an R2 presigned PUT URL keyed by SHA-256:

```kotlin
// vibi-mobile/shared/.../data/remote/AssetUploadManager.kt
val resp = api.requestAssetUploadUrl(
    AssetUploadUrlRequest(
        sha256Hex = sha256(bytes).hex(),
        sizeBytes = bytes.size.toLong(),
        ext = "mp4",
        contentType = "video/mp4",
    )
)
```

The BFF console prints:

```
[POST] /api/v2/assets/upload-url
[assets] key=assets/ab12cd34...e9.mp4 alreadyExists=false ttl=300s
```

The response is one of two shapes:

| Field | Fresh asset | Already in R2 |
|---|---|---|
| `assetKey` | `assets/<sha>.<ext>` | same |
| `alreadyExists` | `false` | `true` |
| `uploadUrl` | `https://...r2.cloudflarestorage.com/...?X-Amz-Signature=...` | `null` |
| `expiresInSec` | `300` | `0` |

When `alreadyExists=true`, the mobile client **skips the PUT entirely** and reuses the `assetKey`. This is what makes the second export of the same source effectively free — only the per-export render config travels over the wire.

When fresh, `AssetUploadManager` PUTs the bytes directly to R2:

```kotlin
api.putAssetToR2(resp.uploadUrl!!, bytes, contentType = "video/mp4")
```

> SigV4 binds `contentType` and `Content-Length` at sign time — the PUT must use the same values or R2 returns 401. `BffApi.putAssetToR2` enforces that by passing the same `contentType` argument through to the request.

> **No R2?** `R2_BUCKET` blank → `POST /assets/upload-url` returns `503 r2_disabled` and the mobile client falls back to the legacy `POST /render` multipart path (`BffApi.submitRenderJob`), which uploads bytes inline. Same result, more bytes.

## 4. Submit the render — `POST /render/v3`

With every segment + BGM clip translated to an `assets/<sha>.<ext>` key, `V3RenderExecutor` posts the render config as JSON only — no multipart body:

```kotlin
// vibi-mobile/shared/.../data/repository/V3RenderExecutor.kt
val jobId = api.submitRenderJobV3(config).jobId
```

The body shape:

```jsonc
// RenderConfigV3
{
  "segments": [
    { "sourceAssetKey": "assets/ab12...e9.mp4", "order": 0,
      "durationMs": 30000, "trimStartMs": 0, "trimEndMs": 30000,
      "volumeScale": 1.0, "speedScale": 1.0 }
  ],
  "bgmClips": [
    { "audioAssetKey": "assets/cd34...77.mp3", "startMs": 0,
      "sourceTrimStartMs": 2000, "sourceTrimEndMs": 8000, "volume": 0.6 }
  ],
  "separationDirectives": [ /* with stem URLs from /separate */ ],
  "outputKind": "video",
  "quality": "medium"
}
```

BFF console:

```
[POST] /api/v2/render/v3       segments=1 bgmClips=1 separationDirectives=1
[render] job rnd-... started
```

The BFF resolves each `sourceAssetKey` / `audioAssetKey` by downloading the R2 object once into its local asset cache (TTL `ASSET_CACHE_TTL_HOURS`, default 24h), then runs the same ffmpeg pipeline as the legacy multipart `/render`.

## 5. The ffmpeg pipeline

`RenderService.runPipeline` (`vibi-bff/.../service/RenderService.kt`) does:

```
1) Per-segment normalization
   - input-side seek (-ss / -to via trimStartMs / trimEndMs)
   - speed (setpts + atempo) and volume scaling
   - emit a per-segment normalized mp4 with consistent codec / fps / resolution
2) Concat demuxer (-c copy) — all normalized clips share codec / fps / resolution
3) Final mix pass
   - separationDirectives → per-range stem amix (normalize=0) using `selections[]` URLs
   - bgmClips             → atrim (sub-range from BgmTrimSheet) + adelay + volume → amix
```

Concurrency is bounded by `RENDER_MAX_CONCURRENT` (default `availableProcessors() / 2`).

> The final pass uses `-c:v copy` since normalization already produced output-resolution H.264 (`6bcb392 perf(render): 최종 mix 패스 -c:v copy`). All the variation between exports happens in the audio mix layer — the video stream is bit-identical across re-renders.

The `quality` knob maps to:

| Profile | x264 CRF | preset | audio bitrate |
|---|---|---|---|
| `high` | 20 | slow | 192k |
| `medium` (default) | 23 | fast | 192k |
| `low` | 28 | fast | 128k |

## 6. Mobile polls

```kotlin
// vibi-mobile/shared/.../BffApi.kt
suspend fun getRenderStatus(jobId: String): RenderStatusResponse =
    client.get("api/v2/render/$jobId/status").body()
```

`V3RenderExecutor` polls the `jobId` and the `onProgress` callback feeds a `0..100` percent into the UI overlay.

When the job reaches `COMPLETED`, the executor calls `GET /api/v2/render/{jobId}/download`. With `R2_BUCKET` set, the BFF uploads the result mp4 to R2 and `302`-redirects to a SigV4 presigned URL — the byte stream comes straight from R2, decoupling the Cloud Run instance from outbound egress (and since R2 egress is free, dropping that cost component to zero). Without `R2_BUCKET` (local dev), the same route falls back to `respondFile` streaming. Either way, the Ktor Client follows the redirect transparently.

## 7. Gallery save

The downloaded mp4 is handed to `GallerySaver.saveVideo(path, displayName)` — `IosGallerySaver` uses `PHPhotoLibrary` + `NSPhotoLibraryAddUsageDescription`, `AndroidGallerySaver` uses MediaStore on API 29+ and direct file write on older versions.

## 8. Where the export lands in code

A request-to-effect map:

```
TimelineScreen 저장 tap
  → ExportUseCase.invoke(projectId)
     → V3RenderExecutor
        → AssetUploadManager.ensureUploaded(asset)
           → BffApi.requestAssetUploadUrl   → AssetUploadUrlResponse
           → if !alreadyExists: BffApi.putAssetToR2(presignedUrl, bytes, contentType)
        → BffApi.submitRenderJobV3(RenderConfigV3) → jobId
        → poll /render/{jobId}/status → COMPLETED
        → GET /render/{jobId}/download → mp4 bytes (302 → R2 in prod, direct stream in dev)
     → GallerySaver.saveVideo(path, displayName)
```

---

## To reconstruct the same flow in your own app

A "skip re-upload across repeated renders" pattern in three pieces:

1. **Content-addressed object store** in front of the BFF. R2's per-object dedup-on-key gives you "have we seen this exact byte stream before?" for free — combine it with `objectExists` on the BFF and the answer is one HEAD round trip.
2. **Per-render config carries asset keys, not bytes.** This caps the render request size at "however much JSON your timeline produces" instead of "however large your source video is" — Cloud Run's request-body limit never matters.
3. **Suspending polling on the client.** Ktor `client.get` + `delay(1.seconds)` is enough; the BFF's job state survives `respondFile` vs R2-redirect transparently.

Key BFF endpoint reference: [`../reference/bff-api.md#render-multipart--v3-asset-by-reference`](../reference/bff-api.md#render-multipart--v3-asset-by-reference).

---

## Common pitfalls

### `400 invalid_stem_url` from `/render/v3`

**Cause**: A `separationDirectives[*].selections[].audioUrl` is not a BFF-signed `/separate/.../stem/` URL — typically because the stem URL was cached across an env switch (dev → staging) or constructed manually.

**Fix**: Always carry stem URLs straight from the most recent `getSeparationStatus(jobId)` response into the render config; refresh them when they 401/403.

### `503 r2_disabled` from `/assets/upload-url`

**Cause**: `R2_BUCKET` (or one of `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`) is missing on the BFF.

**Fix**: Either configure R2 (see [`../reference/environment.md`](../reference/environment.md)) or let the mobile client fall back to the multipart path — `RemoteRenderExecutor` is wired to handle the 503 by routing through `BffApi.submitRenderJob` instead.

### Gallery save fails on iOS with "no permission"

**Cause**: `NSPhotoLibraryAddUsageDescription` was prompted but denied, or the user revoked the permission later.

**Fix**: Settings → vibi → Photos → All Photos. The iOS gallery saver (`IosGallerySaver`) surfaces the permission error message verbatim — that's the symptom.

---

## Up next

- The separation flavor of job-then-poll: [`tutorial-stem-separation.md`](./tutorial-stem-separation.md)
- The render pipeline's design decisions (concat demuxer, R2 redirect, quality profile): [`../explanation/pipelines.md`](../explanation/pipelines.md)
- Exact per-route spec: [`../reference/bff-api.md`](../reference/bff-api.md)
