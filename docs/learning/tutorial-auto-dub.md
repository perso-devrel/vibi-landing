# Tutorial — Build auto dubbing from a single video

This tutorial walks the flow of adding English dubbing to a Korean video, **from the mobile UI tap all the way down to the Perso endpoints the BFF calls**. By the end:

- You'll have intuition for how an auto dubbing job flows
- You'll see exactly what the BFF proxies between Perso and Gemini
- You'll be able to reconstruct the same job pattern (upload → translate → poll → download) in your own code

Prerequisite: [`getting-started.md`](./getting-started.md) is done, BFF and the mobile app are alive, and you're signed in.

---

## 0. What you need

- One Korean-speech video, 10–30 seconds long. mp4 preferred.
- A shell where the BFF console stdout is visible. You'll trace calls there.

## 1. Upload a video (mobile)

Launch the app → InputScreen → pick a video from the gallery.

This step finishes **without calling the BFF** — on the client side:
- Metadata (duration / resolution) is extracted via `VideoMetadataExtractor` (expect/actual: `AndroidVideoMetadataExtractor`, `IosVideoMetadataExtractor`)
- A draft project is persisted to Room (`VibiDatabase`) under the signed-in user's id

The app then auto-navigates to TimelineScreen.

## 2. The 3-step stepper — find your way to dubbing

The timeline screen is organized into three steps (`TimelineStep` enum), shown as a row of nodes at the top: **영상 편집 → 음원 → 자막/더빙**. You enter at **음원** (AudioSources) by default. Tap any node to jump — backward moves don't wipe results, so dubbing/captions/separation/BGM survive a step change. Only `commitSegmentEdit` (saving an Edit-step change) invalidates downstream results.

Tap the **자막/더빙** node to switch to the SubtitleDub step. On entry, the generation panel auto-opens — no extra tap needed.

> If you came here from the older docs that mentioned "Auto dub" or "Captions" bottom-sheet buttons: those merged into this single panel.

## 3. Pick languages and trigger

In the panel:

1. Choose the **mode** — *자막* (captions only), *더빙* (dubbing), or both.
2. For dubbing, multi-select target languages via chips. Chips for languages you already generated show ✓ and are disabled; chips for in-progress jobs are also disabled. The chip state derives from `dubbedAudioPaths` / `autoDubStatusByLang RUNNING`.
3. Tap **생성**.

That tap triggers (`vibi-mobile/shared/.../ui/timeline/TimelineViewModel.kt#onStartLocalization`):

```
EnsureLatestRenderUseCase                ← render the edited video first if dirty
  → BffApi.submitRenderJob(outputKind=video)
  → poll until COMPLETED
  → editedRenderJobId

GenerateAutoDubUseCase
  → AutoDubRepository (commonMain interface)
     └─ Android: AndroidAutoDubRepository ─┐
     └─ iOS:    IosAutoDubRepository      ─┴─→ MediaJobUploader
                                              → BffApi.submitAutoDubJob(file=null, AutoDubSpec.editedRenderJobId=…)
```

**Why the render-first step**: vibi caches the latest edited render server-side and passes only its `editedRenderJobId` to dubbing/captions/separation. The video is uploaded **once** (during the render) and re-used as the source for every downstream job — no more multipart re-upload of a 100MB edited video three times. If the project is in its default state (no edits, no BGM, no overlays, frame matches first segment), the render step is skipped and the original upload is sent directly. This is decided by `isProjectEdited` on the project entity.

## 4. The request the BFF receives

The BFF console prints lines like:

```
[POST] /api/v2/render
[POST] /api/v2/autodub
[autodub] job dub-... created, editedRenderJobId=rnd-...
```

The route lives at `vibi-bff/src/main/kotlin/com/vibi/bff/routes/AutoDubRoutes.kt`. When `spec.editedRenderJobId` is set, the multipart `file` field is omitted and the BFF resolves the input from its render cache. Then:

1. `AutoDubService.start(jobId, spec)` is invoked.
2. `{ "jobId": "dub-..." }` is returned to the client immediately (the job runs in the background).

The canonical endpoint spec lives at [`../reference/bff-api.md#auto-dubbing`](../reference/bff-api.md#auto-dubbing).

## 5. Inside AutoDubService

`vibi-bff/.../service/AutoDubService.kt` runs the following sequentially:

```
1) persoClient.uploadMedia(mediaType, file)    ← Perso media upload + register
2) persoClient.submitTranslate(...)            ← start the Perso dubbing job
3) pollPersoUntilComplete(...)                 ← poll for progress (default 5s interval)
4) persoClient.getDownloadInfo(projectSeq)     ← artifact manifest
5) persoClient.getDownloadLinks(target=...)    ← actual mp4/mp3 URLs
6) streamDownload(...) / streamDownloadAuthorized(...) ← download the result
7) (VIDEO only) ffmpeg -vn ... → mp3            ← extract the audio track from the mp4
```

In auto dubbing **there is only one Perso call: `submitTranslate`** — translation and voice synthesis are handled as a black box inside a single Perso job, and vibi-bff just downloads the result (mp4 or mp3). There is no separate STT or TTS call inside the vibi-bff codebase. (Don't confuse this with the auto *captions* flow — captions can also run in **원본 (script-only)** mode, where `targetLanguageCodes=[]` triggers Perso STT only with no Gemini translation. For caption translation flows, two external calls are involved.)

## 6. Mobile polls

The client takes the `jobId` it just received and polls.

```kotlin
// vibi-mobile/shared/.../BffApi.kt
suspend fun getAutoDubStatus(jobId: String): AutoDubStatusResponse =
    client.get("api/v2/autodub/$jobId").body()
```

The UI updates the progress bar until `status` becomes `READY` (typically 0.5–2x the video length). When `READY`, the response carries `dubbedAudioUrl` or `dubbedVideoUrl` (both include an HMAC token). For VIDEO projects, Perso returns the mp4 directly as `dubbingVideo`, so vibi-bff does not do its own ffmpeg mux — it just extracts the audio track from the mp4 as mp3 and serves it via the `/audio` companion endpoint.

## 7. Download + preview

```kotlin
// downloadDubbedAudio / downloadDubbedVideo take the token-bearing URL as-is
val bytes = bffApi.downloadDubbedAudio(status.dubbedAudioUrl!!)
```

Cache the received mp3/mp4 locally and play it back with AVPlayer (iOS) / Media3 (Android).

The token expires after `SEPARATION_URL_TTL_SEC` (default 30 minutes). On expiry, the pattern is to call `getAutoDubStatus(jobId)` again to get a fresh URL.

## 8. Verify the result

The dub appears as a new clip on the **자막/더빙** lane of the timeline. On playback, the dubbed voice mixes over the original video. To export, switch back to 음원 / 영상 편집 if needed, then use the export action — multi-lang exports are bundled into a single share sheet (`shareVideos(paths)`).

---

## To reconstruct the same flow in your own app

The takeaway of this tutorial: **the flow through the single BFF layer is simple**. You only call the Perso REST surface, so there is no mobile SDK dependency, and you can keep keys confined to the BFF.

Key steps in summary:

1. Mobile → BFF: (optional) `POST /api/v2/render` first to cache the edited video → `editedRenderJobId`
2. Mobile → BFF: `POST /api/v2/autodub` with multipart `file` (fresh upload) **or** `spec.editedRenderJobId` (reuse the render) → `jobId`
3. BFF → Perso: media upload → `submitTranslate` (one shot) → poll → download (`dubbingVideo` or `translatedAudio`)
4. Mobile ← BFF: poll `jobId` → signed download URL → bytes

To take this pattern as-is into your own domain:

- Issue a Perso key → inject into your own BFF ([`../how-to/deploy-your-own-bff.md`](../how-to/deploy-your-own-bff.md))
- Fork just the `AutoDubRoutes` + `AutoDubService` + `PersoClient` pieces of vibi-bff
- On the client side, all you need is a Ktor Client caller compatible with `submitAutoDubJob`

> For the detailed Perso API reference see [docs.perso.ai](https://docs.perso.ai).

---

## Up next

- The chat way to trigger the same flow — "이 영상 영어로 더빙해줘" → proposal → 적용: [`tutorial-chat-assistant.md`](./tutorial-chat-assistant.md)
- Decision background: [`../explanation/why-bff.md`](../explanation/why-bff.md), [`../explanation/pipelines.md`](../explanation/pipelines.md)
- The stem-separation flavor of the same flow: [`tutorial-stem-separation.md`](./tutorial-stem-separation.md)
