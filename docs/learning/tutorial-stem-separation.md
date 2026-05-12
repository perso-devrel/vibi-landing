# Tutorial — Separate stems and lay them into the timeline

This tutorial walks the flow of splitting a video's audio into per-speaker stems, remixing the ones you want, and inserting the result back into the timeline as a new audio clip — **from the mobile UI tap all the way down to the Perso audio-separation calls the BFF makes**. By the end:

- You'll have intuition for the two-step "separate, then mix" job shape (why it isn't one shot)
- You'll see exactly how the BFF stitches Perso's stems and signs the downloads
- You'll be able to reconstruct the same job pattern (upload → separate → poll → pick stems → mix → insert) in your own code

Prerequisite: [`getting-started.md`](./getting-started.md) is done, BFF and the mobile app are alive, and you're signed in. Reading [`tutorial-auto-dub.md`](./tutorial-auto-dub.md) first is helpful — the job-then-poll skeleton is shared.

---

## 0. What you need

- One video with **at least two distinct speakers**, 10–30 seconds long. mp4 preferred. (A music-only clip will still work, but the per-speaker split won't be interesting.)
- A shell where the BFF console stdout is visible. You'll trace calls there.

## 1. Upload a video (mobile)

Launch the app → InputScreen → pick a video from the gallery.

This step finishes **without calling the BFF** — identical to the auto-dubbing flow:
- Metadata (duration / resolution) is extracted via `VideoMetadataExtractor` (expect/actual: `AndroidVideoMetadataExtractor`, `IosVideoMetadataExtractor`)
- A draft project is persisted to Room (`VibiDatabase`) under the signed-in user's id

The app then auto-navigates to TimelineScreen.

## 2. Pick a range in the 음원 (AudioSources) step

The timeline opens at the **음원** step by default. There is no separate "Separate" sheet anymore — separation is a primary action of this step.

1. Drag on the timeline bar to select a range (`isRangeSelecting=true`). The selection band shows on the bar; the panel below reads `구간 5s ~ 12s · 재생 3s`.
2. Tap **"이 구간 음원분리"**.

That tap triggers (`vibi-mobile/shared/.../ui/timeline/TimelineViewModel.kt`):

```
EnsureLatestRenderUseCase                ← render the edited audio first if dirty
  → BffApi.submitRenderJob(outputKind=audio)   ← m4a AAC 192k, video stages skipped
  → poll until COMPLETED → editedRenderJobId

StartSeparationUseCase
  → SeparationRepository (commonMain interface)
     └─ Android: AndroidSeparationRepository ─┐
     └─ iOS:    IosSeparationRepository      ─┴─→ MediaJobUploader
                                                  → BffApi.submitSeparationJob(file=null,
                                                      SeparationSpec.editedRenderJobId=…,
                                                      trimStartMs, trimEndMs)
```

The render uses `outputKind="audio"` — separation only needs audio, so the BFF skips the video concat / subtitle burn / overlay stages and produces just an m4a. This cuts the prep latency 5–10× compared to re-rendering video. The render output is shared across all downstream audio-only jobs (separation, captions in STT mode) via `editedRenderJobId`.

**numberOfSpeakers is no longer prompted** — Perso auto-detects, and the field is dead on the BFF side. The old "Long-press a segment → Sheet → Speakers: 2 → Separate" flow is gone.

> A second separation in the same project: vibi rejects ranges that overlap an existing `separationDirectives[]` entry. The chat assistant explicitly negotiates this (option A/B/C — see [`tutorial-chat-assistant.md`](./tutorial-chat-assistant.md)); the manual UI just blocks the start.

> Want to separate **just a BGM clip** instead of the video's own audio? Tap a BGM clip → "음원분리" — the call routes through the same sheet/use-case with `bgmSeparationTargetId` set, and on confirm `onConfirmStemMix` swaps the original BGM for the mixed stems instead of inserting a new clip.

## 3. The request the BFF receives

The BFF console prints lines like:

```
[POST] /api/v2/render   outputKind=audio
[POST] /api/v2/separate (file omitted, editedRenderJobId=rnd-...)
[separate] job sep-... created
```

The route lives at `vibi-bff/src/main/kotlin/com/vibi/bff/routes/SeparationRoutes.kt`. With `spec.editedRenderJobId` set, the multipart `file` field is omitted and the BFF resolves the input from its render cache. Then:

1. If `trimStartMs` / `trimEndMs` are set, ffmpeg **stream-copies just that window** before uploading to Perso. Trim validation (`partial_trim_range`, `trim_range_invalid`, `trim_range_too_short`, `trim_end_exceeds_duration`) runs here — see [`../reference/bff-api.md#audio-separation--remix`](../reference/bff-api.md#audio-separation--remix).
2. `SeparationService.start(jobId, spec)` is invoked.
3. `{ "jobId": "sep-..." }` is returned to the client immediately (the job runs in the background).

> Why trim on the BFF side? Perso bills by the length it processes, and processing time scales with window length. The client just declares the window; validation and stream-copy stay on the BFF. See [`../explanation/pipelines.md`](../explanation/pipelines.md#stem-separation--remix).

## 4. Inside SeparationService

`vibi-bff/.../service/SeparationService.kt` runs the following sequentially:

```
1) persoClient.uploadMedia(AUDIO, file)                ← Perso media upload + register
2) persoClient.submitAudioSeparation()                 ← start the Perso separation job
3) pollUntilReady(...)                                 ← poll project status
4) persoClient.getSeparationDownloadLinks(target=originalVoiceSpeakers)  ← .tar speaker collection
   persoClient.streamDownloadAuthorized(originalSubBackground / originalBackgroundPath) ← BGM stem
5) Apache Commons Compress untar → per-speaker .wav      ← split the speaker bundle
6) cache stem files under STORAGE_PATH/separation/<jobId>/
7) sign each stem URL with HMAC                          ← short-TTL download tokens
```

vibi-bff doesn't do per-utterance assembly anymore — Perso ships the per-speaker stems already as a `.tar` archive (`/download?target=originalVoiceSpeakers`), and the BFF just unpacks. The background stem comes from `originalBackgroundPath` (true BGM-only) with a fallback to `originalSubBackground` (which actually contains voice+BGM for single-speaker clips — a Perso quirk; see `vibi-bff/CLAUDE.md` "Known BFF bug patterns" for the gory detail).

> Storage host gotcha: the download paths Perso returns are on `portal-media.perso.ai`, **not** the API host. The BFF detects `/perso-storage/...` prefix paths and sends them to `PERSO_STORAGE_BASE_URL` (no auth header). Cloudflare caches misses for 4h on that host, so fresh paths are fetched on each retry.

## 5. Mobile polls

The client polls the `jobId` it just received:

```kotlin
// vibi-mobile/shared/.../BffApi.kt
suspend fun getSeparationStatus(jobId: String): SeparationStatusResponse =
    client.get("api/v2/separate/$jobId").body()
```

The UI updates the progress overlay (an accent-color fill on the affected timeline range) until `status` becomes `READY` (typically 1–3× the trimmed window length). When `READY`, the response carries a `stems` array — each entry has `stemId`, a human label ("All speakers" / "Speaker 1" / …), and a signed `url` for that stem's audio.

Each stem URL embeds an HMAC token good for `SEPARATION_URL_TTL_SEC` (default 30 minutes). On expiry, call `getSeparationStatus(jobId)` again to refresh.

## 6. Auto-confirm + multi-directive timeline

vibi auto-confirms the mix immediately on `READY` (the user does **not** have to pick stems in a sheet — that was the old flow). The new pattern:

1. On `READY`, all stems are downloaded.
2. `onConfirmStemMix` runs with a default selection (typically all speakers at full volume, background muted) — the result is materialized as a `SeparationDirective` on the project.
3. The directive appears on the timeline as a warm-amber band over the separated range.

The user can then re-enter the range and switch which stem is playing — `StemMixer` keeps all stems in memory and swaps the active `groupId` for the directive. Transitions in/out of the range mute the original video segment (`VideoPlayer.volumeScale=0/1`), so the user hears only the stems while inside, and original audio while outside.

Multiple separations in the same project produce multiple directives. The mixer keeps them all prepared in parallel — moving the playhead from one to the next is instant (no re-download).

> The "one mix per separation" rule still applies on the BFF: once `/mix` is called for a `jobId`, the source stems on disk are atomically disposed. A second `/mix` against the same `jobId` returns `409 Conflict`. For external clients that want to pick stems manually, download every stem you might want before the first mix call.

For the BFF-side mix request shape (`POST /api/v2/separate/{jobId}/mix` body):

```kotlin
val req = MixRequest(stems = listOf(
    StemSelection(stemId = "speaker_0", volume = 1.0),
    StemSelection(stemId = "voice_all", volume = 0.4),
))
bffApi.requestStemMix(jobId, req)
```

The BFF responds `{ "mixJobId": "mix-..." }` and runs:

```
1) (atomic) dispose this jobId's source stems
2) ffmpeg amix selected stems with per-stem volume weights
3) cache the mix file + sign URL with HMAC
```

## 7. iOS audio playback note

On iOS, K/N `cinterop` makes streaming `AVPlayer` from BFF URLs silent in practice. vibi instead downloads the stem to a temp file as `NSData` (on `Dispatchers.Default`) and plays it via `AVAudioPlayer(contentsOfURL=…)`. Same pattern is used in both `AudioPreviewer` and `StemMixer`. If you're porting this to your own KMP app, follow the same shape — straight `AVPlayer` URL playback will silently fail. See [`../journal/ios-pitfalls-with-kmp.md`](../journal/ios-pitfalls-with-kmp.md).

---

## To reconstruct the same flow in your own app

The takeaway of this tutorial: **separation is dubbing with one extra round trip in the middle**. The BFF holds the in-between state (per-speaker stems) while the user (or the auto-confirm path) decides, then collapses it into a single mp3 on confirmation.

Key steps in summary:

1. Mobile → BFF: (optional) `POST /api/v2/render` with `outputKind=audio` → `editedRenderJobId`
2. Mobile → BFF: `POST /api/v2/separate` (multipart `file` **or** `spec.editedRenderJobId`) → `jobId`
3. BFF → Perso: upload → `submitAudioSeparation` → poll → `/download?target=originalVoiceSpeakers` (.tar) + `originalBackgroundPath`
4. Mobile ← BFF: poll `jobId` → `stems[]` with signed URLs
5. Mobile → BFF: `POST /separate/{jobId}/mix` with selected stems + volumes → `mixJobId`
6. BFF → local: amix selected stems → cache + sign
7. Mobile ← BFF: poll `mixJobId` → `downloadUrl` → bytes

To take this pattern as-is into your own domain:

- Issue a Perso key → inject into your own BFF ([`../how-to/deploy-your-own-bff.md`](../how-to/deploy-your-own-bff.md))
- Fork just the `SeparationRoutes` + `SeparationService` + `StemMixService` + `PersoClient` pieces of vibi-bff

---

## Common pitfalls

### Second `/mix` call returns `409 Conflict`

**Cause**: As covered in step 6, the BFF disposes the source stems atomically when the mix starts. The separation result is now gone.

**Fix**: Re-run `POST /api/v2/separate` to get a new `jobId`, then mix from there. If you anticipate needing multiple variants, **download every stem you might want before the first mix call** — stem URLs stay valid until `SEPARATION_URL_TTL_SEC`.

### Status still says `PROCESSING` after a long wait, or the stem URL returns 403

**Symptom**: The poll loop never reaches `READY`, or stem URLs that worked earlier now 403.

**Causes + fixes**:
- Token expired (`SEPARATION_URL_TTL_SEC` default 30 minutes) → call `getSeparationStatus(jobId)` again for a fresh URL.
- BFF restarted (the in-memory `jobId` is gone) → re-submit the separation.
- Storage-host 404 cached by Cloudflare for 4h — addressed by the `PERSO_STORAGE_BASE_URL` fresh-link retry; if you're running your own BFF, make sure that variable is set.

### A `speaker_N` stem plays as silence

**Cause**: Perso's per-utterance script attributed no utterances to that speaker (typical when auto-detect over-counts, or one speaker only appears outside the trim window). The bundled `.tar` still contains a (silent) entry for the slot.

**Fix**: Skip that stem when picking selections for `/mix`. Tighten the trim if it recurs.

---

## Up next

- The chat way to trigger the same flow — "이 구간 보컬만 남겨줘" → proposal → 적용: [`tutorial-chat-assistant.md`](./tutorial-chat-assistant.md)
- Why two steps (separate, then mix) instead of one: [`../explanation/pipelines.md`](../explanation/pipelines.md#stem-separation--remix)
- Per-endpoint spec: [`../reference/bff-api.md#audio-separation--remix`](../reference/bff-api.md#audio-separation--remix)
