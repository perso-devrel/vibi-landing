# Tutorial — Separate stems and lay them into the timeline

This tutorial walks the flow of splitting a video's audio into per-speaker stems, remixing the ones you want, and inserting the result back into the timeline as a new audio clip — **from the mobile UI tap all the way down to the Perso audio-separation calls the BFF makes**. By the end:

- You'll have intuition for the two-step "separate, then mix" job shape (why it isn't one shot)
- You'll see exactly how the BFF stitches Perso's stems and signs the downloads
- You'll be able to reconstruct the same job pattern (upload → separate → poll → pick stems → mix → insert) in your own code

Prerequisite: [`getting-started.md`](./getting-started.md) is done, BFF and the mobile app are alive, and you're signed in.

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

## 2. Pick a range in the EditAudio step

The timeline opens at the **편집·음원** step (`TimelineStep.EditAudio`) by default. There is no separate "Separate" sheet anymore — separation is a primary action of this step.

1. Drag on the timeline bar to select a range (`isRangeSelecting=true`). The selection band shows on the bar; the panel below reads `구간 5s ~ 12s · 재생 3s`.
2. Tap **"이 구간 음원분리"**.

That tap calls `TimelineViewModel.onStartSeparation(...)`, which dispatches `StartAudioSeparationUseCase` directly with the segment's source URI and the chosen range. The mobile side does **trim + audio extract on-device** (iOS `AVAssetExportPresetAppleM4A`) and ships an already-trimmed m4a:

```
StartAudioSeparationUseCase
  → AudioSeparationRepository.startSeparation(...)
     → AudioExtractor.trimAndExtract(uri, range)        ← produces a trimmed m4a (mobile-side)
     → MediaJobUploader (platform actual: Android / iOS)
        → BffApi.startSeparation(file=<trimmed m4a>, SeparationSpec(sourceLanguageCode="auto"))
```

Two earlier ceremony layers are gone: the pre-render m4a step (`3d94e95 refactor(separation): /render 선행 호출 제거`) and the BFF-side trim path (`editedRenderJobId` / `MediaSourceResolver`) were both removed once the contract simplified to "mobile sends audio only." `SeparationSpec` is now just `{ sourceLanguageCode }` — trim windows and `mediaType` left the wire.

**numberOfSpeakers is no longer prompted** — Perso auto-detects, and the field is dead on the BFF side. The old "Long-press a segment → Sheet → Speakers: 2 → Separate" flow is gone.

> A second separation in the same project: vibi rejects ranges that overlap an existing `separationDirectives[]` entry. The manual UI blocks the start with a toast — pick a non-overlapping window, or delete the existing directive first.

> Want to separate **just a BGM clip** instead of the video's own audio? Tap a BGM clip → "음원분리" — the call routes through the same use-case with `bgmSeparationTargetId` set, and on confirm the original BGM is swapped for the resulting `SeparationDirective` instead of a new clip being inserted.

## 3. The request the BFF receives

The BFF console prints lines like:

```
[POST] /api/v2/separate
[separate] job sep-... created
```

The route lives at `vibi-bff/src/main/kotlin/com/vibi/bff/routes/SeparationRoutes.kt`. It:

1. Whitelists the upload codec — `m4a` / `mp3` / `wav` only. Anything else (e.g. `flac`, video, `ogg`) → `400 unsupported_audio_format`. Perso's separation pipeline silently fails on FLAC even though earlier upload steps succeed; the BFF blocks at the front door.
2. Charges credits (`1 credit per started 5 minutes of source`, `ceil`, minimum 1) **at submit time**. Insufficient balance → `402 insufficient_credits`. On job failure the charge is refunded (idempotent — no-op if already refunded).
3. Hands the file off to `SeparationService.start(jobId, spec)`. Returns `{ "jobId": "sep-..." }` immediately; the job runs in the background.

> Why trim on the **mobile** side? Perso bills by length, and the mobile client already has the source on disk — extracting + trimming locally saves a 50 MB+ round trip when the user only wants 10 seconds. The BFF receives a small m4a and forwards it straight to Perso.

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

Each stem URL embeds an HMAC token good for `SEPARATION_URL_TTL_SEC` (default 7 days, capped by `SEPARATION_ABANDON_TTL_MS`). On expiry, call `getSeparationStatus(jobId)` again to refresh.

## 6. Auto-confirm + multi-directive timeline

vibi auto-confirms a default mix immediately on `READY` (the user does **not** have to pick stems in a sheet — that was the old flow). The new pattern:

1. On `READY`, all stem URLs are persisted on a new `SeparationDirective` with a default selection (typically all speakers at full volume, background muted).
2. The directive appears on the timeline as a warm-amber band over the separated range.
3. The user can re-enter the range to adjust per-stem volumes; the preview is computed **entirely on the mobile side** — multiple `AVAudioPlayer` / `ExoPlayer` instances play the stems in parallel, with volume slider changes feeding into each player's `volume` property in real time.

Multiple separations in the same project produce multiple directives. The mixer keeps them all prepared in parallel — moving the playhead from one to the next is instant (no re-download).

> **There is no server-side mix endpoint.** The earlier `POST /api/v2/separate/{jobId}/mix` (and its `mixJobId` polling pair) was removed once the mobile-local preview proved sufficient. The final committed mix is performed by the **render** pipeline: when the user exports, the project's `SeparationDirective.selections[]` (each `{stemId, audioUrl, volume}`) is sent inside `RenderConfig.separationDirectives[]`, and ffmpeg `amix=normalize=0` does the combine in the same pass that produces the output mp4.

## 7. iOS audio playback note

On iOS, K/N `cinterop` makes streaming `AVPlayer` from BFF URLs silent in practice. vibi instead downloads the stem to a temp file as `NSData` (on `Dispatchers.Default`) and plays it via `AVAudioPlayer(contentsOfURL=…)`. Same pattern is used in both `AudioPreviewer` and `StemMixer`. If you're porting this to your own KMP app, follow the same shape — straight `AVPlayer` URL playback will silently fail. See [`../journal/ios-pitfalls-with-kmp.md`](../journal/ios-pitfalls-with-kmp.md).

---

## To reconstruct the same flow in your own app

The takeaway of this tutorial: **separation gives you a per-speaker fan-out, the user picks the mix locally, and the chosen combination is baked into the final render**. The BFF holds the in-between state (per-speaker stems) and only commits the mix once, at export time.

Key steps in summary:

1. Mobile: trim + audio extract → m4a
2. Mobile → BFF: `POST /api/v2/separate` (multipart `file` + minimal `spec`) → `jobId`
3. BFF → Perso: upload → `submitAudioSeparation` → poll → `/download?target=originalVoiceSpeakers` (.tar) + `originalBackgroundPath`
4. Mobile ← BFF: poll `jobId` → `stems[]` with signed URLs
5. Mobile: build a `SeparationDirective`; preview volume mixes locally with multiple players
6. Mobile → BFF (at export time): `POST /render` (or `/render/v3`) carrying `separationDirectives[*].selections[]` → final mp4

To take this pattern as-is into your own domain:

- Issue a Perso key → inject into your own BFF ([`../how-to/deploy-your-own-bff.md`](../how-to/deploy-your-own-bff.md))
- Fork the `SeparationRoutes` + `SeparationService` + `PersoClient` pieces of vibi-bff, and the `RenderConfig.separationDirectives` handling inside `RenderService`

---

## Common pitfalls

### Stem URL returns 403 after a long wait

**Symptom**: A stem URL that worked earlier now 403s.

**Causes + fixes**:
- Token expired (`SEPARATION_URL_TTL_SEC`, default 7 days) → call `getSeparationStatus(jobId)` again for a fresh URL.
- BFF restarted before the job entered Postgres job-table tracking (older transient state) → re-submit the separation.
- Storage-host 404 cached by Cloudflare for 4h — addressed by the `PERSO_STORAGE_BASE_URL` fresh-link retry; if you're running your own BFF, make sure that variable is set.

### `/render` returns `400 invalid_stem_url`

**Cause**: A `RenderConfig.separationDirectives[*].selections[].audioUrl` is not a BFF-signed `/separate/.../stem/` URL (e.g. you cached the URL across an env switch, or constructed it manually).

**Fix**: Always carry stem URLs straight through from the most recent `getSeparationStatus(jobId)` response into the render config — don't transform or re-host them.

### A `speaker_N` stem plays as silence

**Cause**: Perso's per-utterance script attributed no utterances to that speaker (typical when auto-detect over-counts, or one speaker only appears outside the trimmed window). The bundled `.tar` still contains a (silent) entry for the slot.

**Fix**: Skip that stem when picking selections for the directive. Tighten the trim if it recurs.

---

## Up next

- Why two steps (separate, then mix) instead of one: [`../explanation/pipelines.md`](../explanation/pipelines.md#stem-separation--remix)
- Per-endpoint spec: [`../reference/bff-api.md#audio-separation--remix`](../reference/bff-api.md#audio-separation--remix)
