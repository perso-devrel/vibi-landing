# Tutorial — Export multiple variants from a single edit

This tutorial walks the flow of exporting an edited video — **from the mobile UI tap all the way down to the ffmpeg pipeline the BFF runs**. The interesting twist is the *multi-variant* path: vibi renders N output files (one per language the user picked) by uploading the source video **once** and re-using a cached `inputId` for every variant. By the end:

- You'll have intuition for the job-then-poll skeleton that all vibi BFF flows share.
- You'll know exactly when `/render/inputs` saves you a 50 MB re-upload and when it doesn't.
- You'll be able to reconstruct the "upload once, render N times in parallel" pattern in your own code.

Prerequisite: [`getting-started.md`](./getting-started.md) is done, BFF and the mobile app are alive, and you're signed in.

---

## 0. What you need

- A 10–30 second mp4 (longer works but the demo gets slow). Multiple speakers or BGM aren't required.
- A shell where the BFF console stdout is visible. You'll trace calls there.

## 1. Build something to export (mobile)

Launch the app → InputScreen → pick a video. The app does the local prep with no BFF call:

- Metadata (duration / resolution) is extracted via `VideoMetadataExtractor` (`AndroidVideoMetadataExtractor` / `IosVideoMetadataExtractor`).
- A draft project is persisted to Room (`VibiDatabase`) under the signed-in user's id.

The app navigates to TimelineScreen. Do a couple of things so the export has something to render:

- Drag a range and tap **"이 구간 음원분리"** to add a `SeparationDirective` (this also triggers a BFF separation job — covered in detail in [`tutorial-stem-separation.md`](./tutorial-stem-separation.md)).
- Add a BGM clip from "BGM" → pick a file from device or use 즉시 녹음.
- Optionally use **BgmTrimSheet** on the BGM clip to drag a sub-range.

Nothing about this step is unique to multi-variant export — segments, separation directives, BGM clips, and any locally authored subtitles all feed the same render config below.

## 2. Open the export sheet

Tap the **저장** action in the timeline header. `ExportVariantPickerSheet` opens with a checklist of variants:

| Variant key | What it means |
|---|---|
| `original` | The base edit. No language tag in the filename — saved as `VID_<hash>_0.mp4`. |
| `original_subtitle` (sentinel `""`) | Same edit, original-language subtitles burned in. Saved as `SUB_원본_<hash>_<idx>.mp4`. Only offered when there's a confirmed original-language subtitle clip. |
| `<lang>` (e.g. `en`, `ko`) | Per-language variant. Saved as `SUB_EN_...` (subtitles only), `DUB_EN_...` (dub audio only), or `DUBSUB_EN_...` (both). |

The variant list is computed by `SaveAllVariantsUseCase.computeAllVariantKeys`. `original` is always included; translation languages appear only when there's an actual artifact (subtitle clip or dub audio path).

> Auto-generated dubs / auto-subtitles aren't currently produced by the BFF — those routes were removed (`52f8d7c`). Subtitles can still be manually authored via `InsertSubtitleSheet` and burned into the export. Dub audio paths exist for manually-supplied audio but the chat / panel "generate dub" UI is dead.

Check the variants you want and tap **저장**.

## 3. Single source upload — `/render/inputs`

`SaveAllVariantsUseCase` looks at the count of variants that need an actual render (anything other than `original` when the project has no edits whatsoever). If that count is **≥ 2**, it uploads the source bytes once first:

```kotlin
// vibi-mobile/shared/.../usecase/save/SaveAllVariantsUseCase.kt
val preUploadedInputId: String? = if (renderVariantCount >= 2) {
    runCatching { uploadInputCacheOnce(segments, dubClips) }.getOrNull()
} else null
```

That call hits `POST /api/v2/render/inputs` with the multipart fields `video` (the first VIDEO segment's source) and `audios` (one part per dub-audio file). The BFF console prints:

```
[POST] /api/v2/render/inputs
[inputs] inputId=ab12cd34ef567890 (size 18234567 bytes, ttl 86400000ms)
```

The `inputId` is the SHA-256 prefix of the video bytes (16 hex chars), so re-uploading the identical file resolves to the same slot. TTL is 24h by default (`RENDER_INPUT_CACHE_TTL_HOURS`), with an hourly sweep removing expired entries.

> When `runCatching { uploadInputCacheOnce(...) }` throws (e.g. transient network glitch), `preUploadedInputId` stays `null` and each variant falls back to its own multipart re-upload — the export still completes, just less efficiently.

## 4. Parallel renders, one per variant

Each variant runs in its own coroutine inside a `coroutineScope { ... awaitAll() }`. The per-variant call is `ExportPlatformAdapter.executeExport(ExportRequest)` — Android and iOS implementations both end up calling `RemoteRenderExecutor` which posts to `/api/v2/render`:

```kotlin
val request = ExportRequest(
    projectId = "$projectId#$languageCode",
    outputLanguageCode = languageCode,
    segments = segments,
    dubClips = dubClips,
    bgmClips = bgmClips,
    separationDirectives = separationDirectives,
    frameWidth = project.frameWidth,
    frameHeight = project.frameHeight,
    backgroundColorHex = project.backgroundColorHex,
    audioOverridePath = audioOverridePath,
    preUploadedInputId = preUploadedInputId,
)
```

When `preUploadedInputId` is set, the multipart request to `/api/v2/render` drops the `video_0` / `audio_0` file parts and includes an `inputId` form field instead. The BFF resolves the bytes from its cache. Server log:

```
[POST] /api/v2/render            inputId=ab12cd34ef567890
[POST] /api/v2/render            inputId=ab12cd34ef567890
[POST] /api/v2/render            inputId=ab12cd34ef567890
[render] job rnd-...-en started
[render] job rnd-...-ko started
[render] job rnd-...-ja started
```

Three multipart bodies, only the small `config` JSON in each — the 18 MB video uploaded once.

## 5. The ffmpeg pipeline

`RenderService.runPipeline` (`vibi-bff/.../service/RenderService.kt`) does:

```
1) Per-segment normalization
   - VIDEO: input-side seek + scale/pad to output resolution + silent AAC track
   - IMAGE: -loop 1 + letterbox + silent AAC track
2) Concat demuxer (-c copy) — all normalized clips share codec / fps / resolution
3) Final mix pass
   - audio_override (if provided) replaces the original audio entirely
   - dubClips    → adelay + volume → amix
   - bgmClips    → atrim (sub-range from BgmTrimSheet) + adelay + volume → amix
   - subtitles   → burn-in via -vf "ass=..."   (only when there's a confirmed subtitle to render)
```

Concurrency is bounded by `RENDER_MAX_CONCURRENT` (default `availableProcessors() / 2`). Three parallel renders on a 4-vCPU box will hold two ffmpeg processes in flight at a time and queue the third.

> The final pass uses `-c:v copy` since normalization already produced output-resolution H.264 (`6bcb392 perf(render): 최종 mix 패스 -c:v copy`). This is what makes multi-variant cheap server-side — each variant differs only in the audio mix and optional subtitle burn-in.

## 6. Mobile polls

Same job-then-poll skeleton as separation:

```kotlin
// vibi-mobile/shared/.../BffApi.kt
suspend fun getRenderStatus(jobId: String): RenderStatusResponse =
    client.get("api/v2/render/$jobId/status").body()
```

`RemoteRenderExecutor` polls each `jobId` independently. The `onProgress` callback bubbles up to `SaveAllVariantsUseCase`, which **averages** progress across all in-flight variants and emits a single `0..100` percent to the UI overlay.

When a job reaches `COMPLETED`, the executor calls `GET /api/v2/render/{jobId}/download`. With `GCS_BUCKET` set, the BFF uploads the result to GCS and `302`-redirects to a V4 signed URL — the byte stream comes straight from GCS, decoupling the Cloud Run instance from outbound egress. Without `GCS_BUCKET` (local dev), the same route falls back to `respondFile` streaming. Either way, the Ktor Client follows the redirect transparently.

## 7. Gallery save

After all variants finish rendering, `SaveAllVariantsUseCase` saves each output to the device gallery serially via `GallerySaver.saveVideo(path, displayName)`. The display name encodes the variant type so the user can spot them in their gallery without re-opening the app:

| Prefix | When |
|---|---|
| `VID_` | `original`, or any variant without dub/subtitle |
| `SUB_원본_` | `original_subtitle` |
| `SUB_<LANG>_` | translation lang with subtitle only |
| `DUB_<LANG>_` | translation lang with dub audio only |
| `DUBSUB_<LANG>_` | translation lang with both dub and subtitle |

`saveToGallery=false` skips the gallery write — used by the share-sheet path that wants the file path directly.

## 8. Where the export lands in code

A request-to-effect map:

```
TimelineScreen 저장 tap
  → SaveAllVariantsUseCase.invoke(projectId, ...)
     → (if multi-variant) BffApi.uploadRenderInputs → inputId
     → coroutineScope {
         for each variant async {
            ExportPlatformAdapter.executeExport(request)
              → RemoteRenderExecutor → BffApi.submitRenderJob(inputId=…)
                                     → POST /api/v2/render → jobId
                                     → poll /status → COMPLETED
                                     → GET /download → mp4 bytes (or 302 → GCS)
            ← outputPath
         }
       } awaitAll
     → for each outputPath: GallerySaver.saveVideo(path, displayName)
     → onProgress(100)
     → Result.success(listOf(SavedVariant(lang, path)))
```

`ExportRequest` + `RemoteRenderExecutor` + the two `BffApi` calls (`uploadRenderInputs`, `submitRenderJob`) are the entire client-side export surface.

---

## To reconstruct the same flow in your own app

A "render once per output language, share one upload" pattern in three pieces:

1. **Content-addressed input cache** on the BFF: `inputId = sha256(video)[:16]`. The same video on retry resolves to the same slot, with a TTL sweep cleaning up after disuse.
2. **Per-variant render config**: keep the heavy bytes (video, dub audios) out of each variant's multipart body — pass them by `inputId` instead. The variant config is just the JSON spec (segments, dub clips, BGM atrim windows, subtitle ASS).
3. **Suspending parallel renders**: `coroutineScope { async { … } }` per variant, averaging progress at the use-case layer. Bound `RENDER_MAX_CONCURRENT` on the BFF side to the box's CPU budget.

Key BFF endpoint reference: [`../reference/bff-api.md#render`](../reference/bff-api.md#render).

---

## Common pitfalls

### `inputId` lookup returns 404 inside a variant render

**Cause**: 24h TTL elapsed between `/render/inputs` and the variant's `/render` call (rare unless the user paused mid-export). Or a different BFF instance handled the variant (multi-instance deploys would need shared storage — the current single-instance assumption holds in vibi).

**Fix**: `SaveAllVariantsUseCase` re-runs the variant with a fresh multipart upload on 404. Worst case the export is slower, not failed.

### Different variants take wildly different times

**Cause**: ffmpeg `-c:v copy` keeps things linear in video duration, but `amix` cost scales with input count. A variant with 5 dub clips + BGM + atrim takes longer than one with no dubs. With `RENDER_MAX_CONCURRENT=2` on a 4-vCPU box, the slowest variant determines wall time.

**Fix**: Stagger variant submission isn't currently implemented — `coroutineScope { awaitAll }` fires all at once. If wall-time matters more than parallelism, drop `RENDER_MAX_CONCURRENT` to 1.

### Gallery save fails on iOS with "no permission"

**Cause**: `NSPhotoLibraryAddUsageDescription` was prompted but denied, or the user revoked the permission later.

**Fix**: Settings → vibi → Photos → All Photos. The iOS gallery saver (`IosGallerySaver`) surfaces the permission error message verbatim — that's the symptom.

---

## Up next

- The chat way to drive the same flow ("이 구간 음원분리 후 저장해줘"): [`tutorial-chat-assistant.md`](./tutorial-chat-assistant.md)
- The separation flavor of job-then-poll: [`tutorial-stem-separation.md`](./tutorial-stem-separation.md)
- The render pipeline's design decisions (concat demuxer, GCS redirect, quality profile): [`../explanation/pipelines.md`](../explanation/pipelines.md)
- Exact per-route spec: [`../reference/bff-api.md`](../reference/bff-api.md)
