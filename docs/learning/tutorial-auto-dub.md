# Tutorial — Build auto dubbing from a single video

This tutorial walks the flow of adding English dubbing to a Korean video, **from the mobile UI tap all the way down to the Perso endpoints the BFF calls**. By the end:

- You'll have intuition for how an auto dubbing job flows
- You'll see exactly what the BFF proxies between Perso and Gemini
- You'll be able to reconstruct the same job pattern (upload → translate → poll → download) in your own code

Prerequisite: [`getting-started.md`](./getting-started.md) is done, BFF and the mobile app are alive.

---

## 0. What you need

- One Korean-speech video, 10–30 seconds long. mp4 preferred.
- A shell where the BFF console stdout is visible. You'll trace calls there.

## 1. Upload a video (mobile)

Launch the app → InputScreen → pick a video from the gallery.

This step finishes **without calling the BFF** — on the client side:
- Metadata (duration / resolution) is extracted via `VideoMetadataExtractor` (expect/actual: `AndroidVideoMetadataExtractor`, `IosVideoMetadataExtractor`)
- A single segment is persisted to Room (`VibiDatabase`)

The app then auto-navigates to TimelineScreen.

## 2. Open the auto dubbing sheet

Tap the "Auto dub" action at the bottom of the timeline → AutoDubSheet rises. Pick **English** as the target language → "Generate".

That tap triggers:

```
TimelineViewModel.generateAutoDub(...)
  → GenerateAutoDubUseCase
    → AutoDubRepository (commonMain interface)
       └─ Android: AndroidAutoDubRepository  ─┐
       └─ iOS:    IosAutoDubRepository       ─┴─→ MediaJobUploader
                                                   → BffApi.submitAutoDubJob(file, AutoDubSpec)
```

`AutoDubSpec` carries `targetLanguageCodes`, voice options, and an optional trim (`vibi-mobile/shared/.../dto/AutoDubSpec.kt`).

## 3. The request the BFF receives

The BFF console prints lines like:

```
[POST] /api/v2/autodub
[autodub] job dub-... created, file=upload-....mp4
```

The route lives at `vibi-bff/src/main/kotlin/com/vibi/bff/routes/AutoDubRoutes.kt`. As soon as it receives the request:

1. The multipart `file` is saved under `STORAGE_PATH/uploads/`.
2. `AutoDubService.start(jobId, spec)` is invoked.
3. `{ "jobId": "dub-..." }` is returned to the client immediately (the job runs in the background).

The canonical endpoint spec lives at [`../reference/bff-api.md#auto-dubbing`](../reference/bff-api.md#auto-dubbing).

## 4. Inside AutoDubService

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

In auto dubbing **there is only one Perso call: `submitTranslate`** — translation and voice synthesis are handled as a black box inside a single Perso job, and vibi-bff just downloads the result (mp4 or mp3). There is no separate STT or TTS call inside the vibi-bff codebase. (Don't confuse this with the auto *captions* flow — that one is different: `submitStt` + Gemini translation split it into two external calls.)

## 5. Mobile polls

The client takes the `jobId` it just received and polls.

```kotlin
// vibi-mobile/shared/.../BffApi.kt
suspend fun getAutoDubStatus(jobId: String): AutoDubStatusResponse =
    client.get("api/v2/autodub/$jobId").body()
```

The UI updates the progress bar until `status` becomes `READY` (typically 0.5–2x the video length). When `READY`, the response carries `dubbedAudioUrl` or `dubbedVideoUrl` (both include an HMAC token). For VIDEO projects, Perso returns the mp4 directly as `dubbingVideo`, so vibi-bff does not do its own ffmpeg mux — it just extracts the audio track from the mp4 as mp3 and serves it via the `/audio` companion endpoint.

## 6. Download + preview

```kotlin
// downloadDubbedAudio / downloadDubbedVideo take the token-bearing URL as-is
val bytes = bffApi.downloadDubbedAudio(status.dubbedAudioUrl!!)
```

Cache the received mp3/mp4 locally and play it back with AVPlayer (iOS) / Media3 (Android).

The token expires after `SEPARATION_URL_TTL_SEC` (default 30 minutes). On expiry, the pattern is to call `getAutoDubStatus(jobId)` again to get a fresh URL.

## 7. Verify the result

A new clip is added to the dubbing track on the timeline. On playback, the English voice mixes over the original video (lip movement stays original — lipsync is a separate `/api/v2/lipsync/*` endpoint).

---

## To reconstruct the same flow in your own app

The takeaway of this tutorial: **the flow through the single BFF layer is simple**. You only call the Perso REST surface, so there is no mobile SDK dependency, and you can keep keys confined to the BFF.

Key steps in summary:

1. Mobile → BFF: POST multipart `file` + `spec` → `jobId`
2. BFF → Perso: media upload → `submitTranslate` (one shot) → poll → download (`dubbingVideo` or `translatedAudio`)
3. Mobile ← BFF: poll `jobId` → signed download URL → bytes

To take this pattern as-is into your own domain:

- Issue a Perso key → inject into your own BFF ([`../how-to/deploy-your-own-bff.md`](../how-to/deploy-your-own-bff.md))
- Fork just the `AutoDubRoutes` + `AutoDubService` + `PersoClient` pieces of vibi-bff
- On the client side, all you need is a Ktor Client caller compatible with `submitAutoDubJob`

> For the detailed Perso API reference see [docs.perso.ai](https://docs.perso.ai).

---

## Up next

- Decision background: [`../explanation/why-bff.md`](../explanation/why-bff.md), [`../explanation/pipelines.md`](../explanation/pipelines.md)
- The stem-separation flavor of the same flow: [`../reference/bff-api.md#audio-separation--remix`](../reference/bff-api.md#audio-separation--remix)
