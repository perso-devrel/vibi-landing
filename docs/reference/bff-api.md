# BFF API Reference — `/api/v2/*`

Specification for every endpoint the vibi mobile client calls. The **Swagger UI** (`http://localhost:8080/swagger`) is the authoritative single source of truth; this markdown is an offline lookup / citation copy.

- All responses are JSON. Error shape: [`error-contract.md`](./error-contract.md).
- Auth: some endpoints require `Authorization: Bearer <jwt>` (BFF-issued JWT). Issuance: `POST /api/v2/auth/google`.
- multipart upload form-field limits are noted separately (must be called out when over 50MB — see `vibi-bff/CLAUDE.md` "Known BFF bug patterns").
- Full response model definitions: `vibi-bff/src/main/kotlin/com/vibi/bff/model/BffModels.kt`.

Table of contents:

- [Authentication](#authentication)
- [Language list](#language-list)
- [Chat (Gemini function calling)](#chat-gemini-function-calling)
- [Auto subtitles](#auto-subtitles)
- [Auto dubbing](#auto-dubbing)
- [Audio separation + remix](#audio-separation--remix)
- [Render](#render)

---

## Authentication

### `POST /api/v2/auth/google`

Exchanges a Google ID Token for a BFF JWT.

**Request** — JSON `{ "idToken": "<google_id_token>" }`. The `aud` must match the BFF's `GOOGLE_OAUTH_CLIENT_IDS` whitelist.

**Response** — `AuthResponseDto` (JWT body + expiration time).

**Errors** — Google `tokeninfo` 4xx → 401.

---

## Language list

### `GET /api/v2/languages`

Proxies the subtitle/dubbing target languages supported by Perso as-is. Also useful as a post-boot health check — verifies that the Perso key and spaceSeq are live.

**Response** — `LanguageListResponse` (array of code + display name).

---

## Chat (Gemini function calling)

### `POST /api/v2/chat`

Natural-language editing assistant. The user message is sent to Gemini, which returns either plain text or a pre-registered function call (`proposal.steps`). On the mobile side, `ChatToolDispatcher` maps function names to `TimelineViewModel.onXxx`.

**Request** — JSON `ChatRequestDto`:
```json
{
  "messages": [...],
  "projectContext": { "segments":[...], "subtitles":[...], "dubs":[...], "bgmClips":[...], "stems":[...], "playheadMs":1234, "selectionId":"..." },
  "locale": "ko"
}
```

**Response** — `ChatResponseDto` with two kinds:
- `{"kind":"text","text":"..."}` — read / explanatory response
- `{"kind":"proposal","steps":[{"name":"...","args":{...}}]}` — up to 5 edit proposals. Applied after user confirmation.

**Registered tools** (`vibi-bff/.../service/ChatToolDefs.kt`): `delete_segment_range`, `duplicate_segment_range`, `update_segment_volume`, `update_segment_speed`, `separate_audio_range`, `update_stem_volume`, `update_subtitle_text`, `generate_subtitles`, `generate_dub`, `move_bgm_clip`, `update_bgm_volume`, `generate_subtitles_for_bgm`, `generate_dub_for_bgm`.

**`tool_code` fallback** — Gemini 2.5 Flash occasionally ignores `functionDeclarations` and replies with a `tool_code` markdown block containing `print(default_api.<name>(args))`. The server-side `recoverToolCallsFromText` regex restores those into `ToolCall`s so the client still sees a `proposal`. Python literal args only (str/int/float/bool/list).

**System instruction constraints**: respond in the user's language / never invent IDs / one tool kind per response (text or proposal) / confirmation gate on the mobile side.

---

## Auto subtitles

Perso STT → Gemini translation → signed SRT URL.

### `POST /api/v2/subtitles`

**Request** — multipart:
| Field | Description |
|---|---|
| `file` *(optional)* | Source video/audio. Can be omitted when using `editedRenderJobId`. |
| `spec` | JSON `SubtitleSpec` (form-item, not a file) |

**Response** — `SubtitleJobResponse { "jobId": "sub-..." }`.

### `GET /api/v2/subtitles/{jobId}`

Status poll. When `READY`, the response includes signed `originalSrtUrl` and `translatedSrtUrlsByLang`. Token lifetime: `SEPARATION_URL_TTL_SEC`.

### `GET /api/v2/subtitles/{jobId}/srt?token=…&lang=…`

Signed SRT stream. `lang` omitted (or `lang=original`) returns the original-language SRT; an ISO code returns the translated SRT for that language. 401 if no token, 403 if expired.

### `POST /api/v2/subtitles/regenerate`

Regenerates subtitles in other languages using a user-edited SRT as the source (only calls Gemini; no video/audio re-upload).

**Request** — multipart `srtFile` + `spec`.

---

## Auto dubbing

Perso dubbing job (a single `submitTranslate` — Perso handles translation and voice synthesis as a black box). Lip-sync is a separate `/api/v2/lipsync/*` (omitted in this document).

### `POST /api/v2/autodub`

**Request** — multipart:
| Field | Description |
|---|---|
| `file` *(optional)* | Source video/audio. |
| `spec` | JSON `AutoDubSpec` — `targetLanguageCodes`, voice options, trimming, etc. |

**Response** — `AutoDubJobResponse { "jobId": "dub-..." }`.

### `GET /api/v2/autodub/{jobId}`

Status + signed `dubbedAudioUrl` / `dubbedVideoUrl` on `READY`.

### `GET /api/v2/autodub/{jobId}/video?token=…`

Signed mp4 stream of the dubbed video (VIDEO projects). 401 if no token, 403 if expired.

### `GET /api/v2/autodub/{jobId}/audio?token=…`

Signed mp3 stream of the dubbed audio. For VIDEO projects this is the audio track extracted via `ffmpeg -vn`.

---

## Audio separation + remix

Perso voice separation exposes per-speaker stems (`speaker_0..N`) + `voice_all` + `background`; only the stems the user selects are remixed back together via amix.

### `POST /api/v2/separate`

**Request** — multipart:
| Field | Description |
|---|---|
| `file` *(optional)* | mp4 or mp3 (≤ 500MB). Can be omitted when using `editedRenderJobId`. |
| `spec` | JSON `SeparationSpec` |

```jsonc
// SeparationSpec
{
  "mediaType": "VIDEO",          // "VIDEO" or "AUDIO"
  "numberOfSpeakers": 2,         // 1..10 — Perso does not auto-detect
  "sourceLanguageCode": "auto",  // "auto", or an ISO code like "ko"
  "trimStartMs": 2000,           // optional trim — both bounds required together
  "trimEndMs": 8500
}
```

**Trim validation** (`spec.trim*`):

| Condition | Response |
|---|---|
| Only one side present | `400 partial_trim_range` |
| `trimStartMs < 0` | `400 trim_start_negative` |
| `trimEndMs <= trimStartMs` | `400 trim_range_invalid` |
| Window `< 500ms` | `400 trim_range_too_short` |
| `trimEndMs` exceeds measured duration | `400 trim_end_exceeds_duration` (detail contains measured duration) |
| ffprobe / ffmpeg failure | `500 ffmpeg_error` |

**Response** — `SeparationJobResponse { "jobId": "sep-..." }`.

### `GET /api/v2/separate/{jobId}`

Status + signed URL per stem on `READY`.

| `stemId` | Label | Source |
|---|---|---|
| `voice_all` | All speakers | Perso `originalVoiceAudio` |
| `speaker_0`, `speaker_1`, … | Speaker 1, 2, … | Perso `originalVoiceSpeakers` (ZIP unzip) |
| `background` | Background audio | *(legacy separation flow only — the new audio-separation API does not provide background)* |

### `GET /api/v2/separate/{jobId}/stem/{stemId}?token=…`

Signed stem audio stream. 401 if no token, 403 if expired.

### `POST /api/v2/separate/{jobId}/mix`

**Request** — JSON `MixRequest`:
```json
{ "stems": [ { "stemId": "speaker_0", "volume": 1.0 }, { "stemId": "voice_all", "volume": 0.4 } ] }
```

**Response** — `MixJobResponse { "mixJobId": "mix-..." }`.

> **Side effect**: on success, the source separation's stems are disposed. Subsequent `/mix` calls with the same jobId return `409 Conflict`. Download any stems you need to keep before mixing.

### `GET /api/v2/separate/mix/{mixJobId}`

Status + signed `downloadUrl` on `COMPLETED`.

### `GET /api/v2/separate/mix/{mixJobId}/download?token=…`

mp3 stream. 401 if no token.

---

## Render

Local ffmpeg pipeline. multi-segment concat → subtitle burn-in → sticker overlay → dub mix.

### `POST /api/v2/render/inputs`

For multi-variant export, uploads video/audios once and caches them. The returned `inputId` is passed to `submitRenderJob` to avoid multipart re-upload cost.

**Request** — multipart `video` + `audio_0`, `audio_1`, …

**Response** — `RenderInputCacheResponse { "inputId": "..." }`.

### `POST /api/v2/render`

**Request** — multipart:
| Field | Description |
|---|---|
| `inputId` | (optional) Cache ID returned by `/render/inputs`. If present, video/audio re-upload is skipped. |
| `video` *(legacy)* / `video_0`, `video_1`, … | Source video. |
| `segment_image_0`, … | Still image for IMAGE-type segments. |
| `image_0`, `image_1`, … | Sticker overlay images (referenced from `imageClips[]`). |
| `audio_0`, `audio_1`, … | Dub audio tracks (referenced from `dubClips[]`). |
| `bgm_0`, … | BGM tracks. |
| `audio_override` | (optional) Replaces the source video's original audio entirely. |
| `subtitles` | (optional) ASS file — burned in as the final step. |
| `config` | JSON `RenderConfig` (form-item). |

**RenderConfig** — two modes:

```jsonc
// Legacy single-video
{
  "videoDurationMs": 60000,
  "dubClips":  [ { "audioFileKey": "audio_0", "startMs": 1000, "durationMs": 4000, "volume": 1.0 } ],
  "imageClips":[ { "imageFileKey": "image_0", "startMs": 2000, "endMs": 5000,
                   "xPct": 50, "yPct": 30, "widthPct": 25, "heightPct": 25 } ]
}

// Multi-segment
{
  "segments": [
    { "sourceFileKey": "video_0", "type": "VIDEO", "order": 0,
      "durationMs": 30000, "trimStartMs": 0, "trimEndMs": 30000,
      "width": 1920, "height": 1080 },
    { "sourceFileKey": "segment_image_0", "type": "IMAGE", "order": 1,
      "durationMs": 5000, "imageWidthPct": 80, "imageHeightPct": 80 }
  ],
  "imageClips": [ /* sticker overlays on the global timeline */ ],
  "dubClips":   [ /* dub clips on the global timeline */ ]
}
```

Output resolution: `segments[0].width`/`height` in multi-segment mode, ffprobe extraction in legacy mode.

**Response** — `RenderJobResponse { "jobId": "rnd-..." }`.

### `GET /api/v2/render/{jobId}/status`

`PENDING` / `PROCESSING` / `COMPLETED` / `FAILED` + `progress`.

### `GET /api/v2/render/{jobId}/download`

mp4 byte stream. **Not statically mounted** — always go through this endpoint.

---

## Code references

- Route definitions: `vibi-bff/src/main/kotlin/com/vibi/bff/routes/{Auth,AutoDub,Chat,Language,Render,Separation,Subtitle}Routes.kt`
- DTOs: `vibi-bff/.../model/BffModels.kt`, `ChatModels.kt`, `PersoModels.kt`, `AuthModels.kt`
- Client-side callers: `vibi-mobile/shared/src/commonMain/kotlin/com/vibi/shared/data/remote/api/BffApi.kt`
- OpenAPI: `vibi-bff/src/main/resources/openapi/vibi-bff.yaml`
