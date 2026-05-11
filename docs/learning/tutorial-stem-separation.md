# Tutorial — Separate stems and lay them into the timeline

This tutorial walks the flow of splitting a video's audio into per-speaker stems, remixing the ones you want, and inserting the result back into the timeline as a new audio clip — **from the mobile UI tap all the way down to the Perso audio-separation calls the BFF makes**. By the end:

- You'll have intuition for the two-step "separate, then mix" job shape (why it isn't one shot)
- You'll see exactly how the BFF stitches Perso's per-utterance stems and signs the downloads
- You'll be able to reconstruct the same job pattern (upload → separate → poll → pick stems → mix → insert) in your own code

Prerequisite: [`getting-started.md`](./getting-started.md) is done, BFF and the mobile app are alive. Reading [`tutorial-auto-dub.md`](./tutorial-auto-dub.md) first is helpful — the job-then-poll skeleton is shared.

---

## 0. What you need

- One video with **at least two distinct speakers**, 10–30 seconds long. mp4 preferred. (A music-only clip will still work, but the per-speaker split won't be interesting.)
- A shell where the BFF console stdout is visible. You'll trace calls there.

## 1. Upload a video (mobile)

Launch the app → InputScreen → pick a video from the gallery.

This step finishes **without calling the BFF** — identical to the auto-dubbing flow:
- Metadata (duration / resolution) is extracted via `VideoMetadataExtractor` (expect/actual: `AndroidVideoMetadataExtractor`, `IosVideoMetadataExtractor`)
- A single segment is persisted to Room (`VibiDatabase`)

The app then auto-navigates to TimelineScreen.

## 2. Open the stem separation sheet

Long-press a video segment on the timeline → "Separate" action → StemSeparationSheet rises. Perso **auto-detects the number of speakers**, so you can leave that field at its default — optionally drag the trim handles to narrow the window → "Separate".

That tap triggers:

```
TimelineViewModel.startStemSeparation(...)
  → StartSeparationUseCase
    → SeparationRepository (commonMain interface)
       └─ Android: AndroidSeparationRepository ─┐
       └─ iOS:    IosSeparationRepository      ─┴─→ MediaJobUploader
                                                    → BffApi.submitSeparationJob(file, SeparationSpec)
```

`SeparationSpec` carries `mediaType`, `numberOfSpeakers`, `sourceLanguageCode`, and optional `trimStartMs`/`trimEndMs` (`vibi-mobile/shared/.../dto/SeparationSpec.kt`).

## 3. The request the BFF receives

The BFF console prints lines like:

```
[POST] /api/v2/separate
[separate] job sep-... created, file=upload-....mp4
```

The route lives at `vibi-bff/src/main/kotlin/com/vibi/bff/routes/SeparationRoutes.kt`. As soon as it receives the request:

1. The multipart `file` is saved under `STORAGE_PATH/uploads/`.
2. If `trimStartMs` / `trimEndMs` are set, ffmpeg **stream-copies just that window** before uploading to Perso. Trim validation (`partial_trim_range`, `trim_range_invalid`, `trim_range_too_short`, `trim_end_exceeds_duration`) runs here — see [`../reference/bff-api.md#audio-separation--remix`](../reference/bff-api.md#audio-separation--remix).
3. `SeparationService.start(jobId, spec)` is invoked.
4. `{ "jobId": "sep-..." }` is returned to the client immediately (the job runs in the background).

> Why trim on the BFF side? Perso bills by the length it processes, and processing time scales with window length. The client just declares the window; validation and stream-copy stay on the BFF. See [`../explanation/pipelines.md`](../explanation/pipelines.md#stem-separation--remix).

## 4. Inside SeparationService

`vibi-bff/.../service/SeparationService.kt` runs the following sequentially:

```
1) persoClient.uploadMedia(AUDIO, file)              ← Perso media upload + register
2) persoClient.submitAudioSeparation(numberOfSpeakers)← start the Perso separation job
3) pollSeparationScript(...)                          ← paginated GET .../audio-separation/script
4) downloadStemUtterances(...)                        ← per-utterance mp3 fetch from Perso
5) ffmpeg adelay + amix per speaker                   ← assemble each speaker's full-length stem
6) cache stem files under STORAGE_PATH/stems/<jobId>/ ← keep around for the mix step
7) sign each stem URL with HMAC                       ← short-TTL download tokens
```

Unlike auto dubbing — which is a single black-box `submitTranslate` — separation is the **only Perso flow where vibi-bff does meaningful audio assembly itself**. Perso returns per-utterance fragments; the BFF lays them onto a silent timeline with `ffmpeg adelay` so each speaker becomes a continuous, full-length mp3. The `voice_all` stem is Perso's `originalVoiceAudio` as-is, no assembly required.

(The legacy v1 separation flow also produced a `background` stem; the audio-separation v2 API does not, so you'll only see `voice_all` + `speaker_0..N` here.)

## 5. Mobile polls

The client takes the `jobId` it just received and polls.

```kotlin
// vibi-mobile/shared/.../BffApi.kt
suspend fun getSeparationStatus(jobId: String): SeparationStatusResponse =
    client.get("api/v2/separate/$jobId").body()
```

The UI updates the progress bar until `status` becomes `READY` (typically 1–3x the trimmed window length). When `READY`, the response carries a `stems` array — each entry has `stemId`, a human label ("All speakers" / "Speaker 1" / …), and a signed `url` for that stem's mp3.

Each stem URL embeds an HMAC token good for `SEPARATION_URL_TTL_SEC` (default 30 minutes). On expiry, call `getSeparationStatus(jobId)` again to refresh.

## 6. Preview the stems, then pick what to mix

This is the step the auto-dub flow doesn't have. The UI fans out the stems into preview tiles — each plays its own mp3 — and the user toggles which ones to keep and sets a per-stem volume slider.

When the user confirms, the client sends:

```kotlin
// MixRequest
val req = MixRequest(stems = listOf(
    StemSelection(stemId = "speaker_0", volume = 1.0),
    StemSelection(stemId = "voice_all", volume = 0.4),
))
bffApi.requestStemMix(jobId, req)   // POST /api/v2/separate/{jobId}/mix
```

The BFF responds with `{ "mixJobId": "mix-..." }` and immediately starts:

```
1) (atomic) dispose this jobId's source stems
2) ffmpeg amix selected stems with per-stem volume weights
3) cache the mix mp3 under STORAGE_PATH/mixes/<mixJobId>.mp3
4) sign the download URL with HMAC
```

> **Heads-up — one mix per separation.** As soon as the mix call lands, the BFF discards the source stems atomically. A second `/mix` call against the same `jobId` returns `409 Conflict`. If you need multiple variants, **download every stem you might want before mixing**, or just redo the separation. See [`../explanation/pipelines.md`](../explanation/pipelines.md#stem-separation--remix) for why.

## 7. Poll the mix and download

```kotlin
suspend fun getMixStatus(mixJobId: String): MixStatusResponse =
    client.get("api/v2/separate/mix/$mixJobId").body()
```

When `status == COMPLETED`, the response carries a signed `downloadUrl`. Stream the mp3:

```kotlin
val bytes = bffApi.downloadMixed(status.downloadUrl!!)
```

Same TTL story as the stems — refresh via `getMixStatus` on expiry.

## 8. Insert the mix into the timeline

This is the "음원 삽입" half. The mixed mp3 is now a regular asset on the device, and the timeline treats it like any other imported audio source.

```
DownloadedMixAsset
  → TimelineViewModel.insertAudioClip(uri, atMs = playheadMs)
    → AudioClipRepository.create(...)
      → VibiDatabase  (persist clip row)
```

A new clip lands on the **BGM/audio track** at the current playhead. From there it's the same controls as a BGM clip imported through the picker — volume, fade, trim, move. The mp3 byte source happens to be a BFF mix, but the timeline doesn't care.

> Inserting via the audio picker or a recording follows the same `insertAudioClip` path — only the byte source differs (gallery URI / microphone capture / BFF mix). Stem separation just produces one specific kind of audio source.

## 9. Verify the result

Play back the timeline. The original video's audio still plays (the source segment is untouched), and the mixed stem track plays on top of it. To use the stems *instead of* the original audio, lower the source segment's volume to 0 in the timeline.

---

## Troubleshooting

Issues you'll most likely hit while walking this tutorial. Cross-environment / build issues (ffmpeg missing, 50MB upload cap, Perso 402, BFF unreachable) live in [`../how-to/troubleshooting.md`](../how-to/troubleshooting.md).

### Auto-detect returned a different speaker count than expected

**Symptom**: The video has 3 speakers but the `READY` response returns only `voice_all` + `speaker_0` + `speaker_1`. Or vice versa — a single-speaker monologue comes back split in two.

**Cause**: Perso auto-detects from the audio itself, and overlapping speech / similar-pitched voices / very short turns can confuse the count.

**Fix**: Pass `numberOfSpeakers` in `SeparationSpec` as an override hint (1..10). It's optional but takes precedence over auto-detection when present.

```kotlin
SeparationSpec(numberOfSpeakers = 3, /* ... */)
```

### `400 partial_trim_range` (or `trim_range_invalid` / `trim_range_too_short` / `trim_end_exceeds_duration`)

**Symptom**: `POST /api/v2/separate` returns 400 immediately, before the job is created.

**Cause**: Trim validation fails on the BFF side. Common patterns: only one of `trimStartMs` / `trimEndMs` is set, the window is under 500ms, or `trimEndMs` exceeds the measured duration.

**Fix**: Either send both bounds or neither. Window must be ≥ 500ms. For `trim_end_exceeds_duration`, the `detail` field contains the ffprobe-measured duration — clamp on the client side using it. Full rules: [`../reference/bff-api.md#audio-separation--remix`](../reference/bff-api.md#audio-separation--remix).

### `POST /separate/{jobId}/mix` returns `409 Conflict`

**Symptom**: The first mix succeeded, but a second mix call against the same `jobId` returns 409.

**Cause**: As covered in step 6, the BFF disposes the source stems atomically when the mix starts. The separation result is now gone.

**Fix**: Re-run `POST /api/v2/separate` to get a new `jobId`, then mix from there. If you anticipate needing multiple variants, **download every stem you might want before the first mix call** — stem URLs stay valid until `SEPARATION_URL_TTL_SEC`.

### Status still says `PROCESSING` after a long wait, or the stem URL returns 403

**Symptom**: The poll loop never reaches `READY`, or stem URLs that worked earlier now 403.

**Cause**:
- If the polling never resolves: the separation has been abandoned. The reaper cleans up `READY` separations that haven't been mixed within `SEPARATION_ABANDON_TTL_MS` (default 30 minutes).
- If it's just a 403 on download: HMAC token expired (`SEPARATION_URL_TTL_SEC`).

**Fix**:
- Token-only 403 → call `GET /api/v2/separate/{jobId}` again for fresh signed URLs (no re-separation needed).
- Reaped → start a new `POST /api/v2/separate`.

### A `speaker_N` stem plays as silence

**Symptom**: The mp3 downloads cleanly and has the full length of the source, but plays as silence.

**Cause**: Perso's per-utterance script attributed no utterances to that speaker (typical when auto-detect over-counts, or one speaker only appears outside the trim window). The BFF still assembles a full-length stem from the silent timeline — the file is valid, just empty.

**Fix**: Skip that stem when picking selections for `/mix`. If it happens consistently, tighten the trim or pass an explicit `numberOfSpeakers` hint.

### The mix downloaded but doesn't appear on the timeline

**Symptom**: `getMixStatus` returns `COMPLETED` and the byte stream downloads, but no new audio clip shows up.

**Cause**: `insertAudioClip(uri, atMs)` was called but the URI points to an in-memory blob the Room layer can't re-resolve later, or `atMs` is outside the project's duration.

**Fix**: Persist the mp3 to disk first (the timeline expects a stable URI it can reopen on relaunch), then call `insertAudioClip` with the on-disk path and a `playheadMs` within the project's duration.

---

## To reconstruct the same flow in your own app

The takeaway of this tutorial: **separation is dubbing with one extra round trip in the middle**. The BFF holds the in-between state (per-speaker stems) while the user decides, then collapses it into a single mp3 on confirmation.

Key steps in summary:

1. Mobile → BFF: POST multipart `file` + `SeparationSpec` → `jobId`
2. BFF → Perso: media upload → `submitAudioSeparation` → script poll → per-utterance fetch → ffmpeg adelay+amix per speaker
3. Mobile ← BFF: poll `jobId` → `stems[]` with signed URLs
4. Mobile → BFF: `POST /separate/{jobId}/mix` with selected stems + volumes → `mixJobId`
5. BFF → local: amix selected stems → cache + sign
6. Mobile ← BFF: poll `mixJobId` → signed `downloadUrl` → bytes → insert into timeline

To take this pattern as-is into your own domain:

- Issue a Perso key → inject into your own BFF ([`../how-to/deploy-your-own-bff.md`](../how-to/deploy-your-own-bff.md))
- Fork just the `SeparationRoutes` + `SeparationService` + `StemMixService` + `PersoClient` pieces of vibi-bff
- On the client side, you need a Ktor Client caller compatible with `submitSeparationJob` + `requestStemMix`, plus a timeline that accepts an arbitrary mp3 byte source as an audio clip

> For the detailed Perso API reference see [docs.perso.ai](https://docs.perso.ai).

---

## Up next

- The single-step sibling: [`tutorial-auto-dub.md`](./tutorial-auto-dub.md)
- Why two steps (separate, then mix) instead of one: [`../explanation/pipelines.md`](../explanation/pipelines.md#stem-separation--remix)
- Exact per-route spec, including trim error codes: [`../reference/bff-api.md#audio-separation--remix`](../reference/bff-api.md#audio-separation--remix)
