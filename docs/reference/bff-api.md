# BFF API Reference — `/api/v2/*`

Specification for every endpoint the vibi mobile client calls. The **Swagger UI** (`http://localhost:8080/swagger`) is the authoritative single source of truth; this markdown is an offline lookup / citation copy.

- All responses are JSON. Error shape: [`error-contract.md`](./error-contract.md).
- Auth: some endpoints require `Authorization: Bearer <jwt>` (BFF-issued JWT). Issuance: `POST /api/v2/auth/google`.
- multipart upload form-field limits are noted separately (must be called out when over 50MB — see `vibi-bff/CLAUDE.md` "Known BFF bug patterns").
- Full response model definitions: `vibi-bff/src/main/kotlin/com/vibi/bff/model/BffModels.kt`.
- **Download endpoints (`/render/.../download`, `/separate/.../stem`, `/separate/mix/.../download`, `/autodub/.../{audio,video}`, `/subtitles/.../srt`) 302-redirect to a V4 signed GCS URL when `GCS_BUCKET` is set** — Cloud Run instance and egress are decoupled from the byte stream. When `GCS_BUCKET` is blank (the local-dev path) the same routes fall back to `respondFile` streaming. Clients must follow redirects.

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
```jsonc
{
  "messages": [...],
  "projectContext": {
    "segments": [...], "subtitleClips": [...], "dubClips": [...], "bgmClips": [...], "stems": [...],
    "separationDirectives": [...],   // already-separated ranges, with rangeStartMs/EndMs + numberOfSpeakers
    "currentPlayheadMs": 1234,
    "selectedClipId": "...", "selectedSegmentId": "...",
    "videoDurationMs": 60000,
    // Range selection — when the user has dragged a window in the timeline UI
    "isRangeSelecting": true,
    "pendingRangeStartMs": 5000,
    "pendingRangeEndMs": 12000
  },
  "locale": "ko"
}
```

`isRangeSelecting + pendingRange*` lets Gemini resolve deictic phrases like "이 구간 / this range" without guessing — the model is instructed to pass those values straight through as `startMs`/`endMs`. `separationDirectives` is what powers the overlap-avoidance policy (see below).

**Response** — `ChatResponseDto` with two kinds:
- `{"kind":"text","text":"..."}` — read / explanatory response, or a follow-up question when refs can't be resolved.
- `{"kind":"proposal","steps":[{"name":"...","args":{...}}]}` — up to 5 edit proposals. Applied after user confirmation in the mobile UI (`ChatToolDispatcher`).

**Registered tools** (`vibi-bff/.../service/ChatToolDefs.kt`, 15 total):

| Group | Tools |
|---|---|
| Segment edit (range) | `delete_segment_range`, `duplicate_segment_range`, `update_segment_volume`, `update_segment_speed` |
| Audio separation | `separate_audio_range`, `update_stem_volume` |
| Subtitle — two-stage | `transcribe_for_subtitles` → `apply_subtitles_with_script` *(preferred)* |
| Subtitle — direct | `update_subtitle_text`, `generate_subtitles` *(deprecated — kept for "skip review" requests)* |
| Dub | `generate_dub` |
| BGM | `move_bgm_clip`, `update_bgm_volume`, `generate_subtitles_for_bgm`, `generate_dub_for_bgm` |

The full tool spec is in [`vibi-bff/src/main/resources/chat-tools.md`](https://github.com/perso-devrel/vibi-bff/blob/main/src/main/resources/chat-tools.md) — that file is loaded verbatim as `systemInstruction`, so it is the single source of truth for tool args, the cost-disclosure rule (slow tools get `(예상 ~N분)` in rationale), and the policy below.

**Edit-invalidation policy** — When the user requests structural segment edits (`delete_segment_range`, `duplicate_segment_range`, `update_segment_speed`) AND the project already has separation / subtitles / dubs / BGM placements, the model must append an explicit warning to the proposal rationale: *"⚠ 이 편집을 적용하면 기존 음성분리/자막/더빙/음원 배치가 초기화됩니다. 진행할까요?"*. `update_segment_volume` is exempt (mix change, not structural).

**Separation overlap policy** — `separate_audio_range` cannot be applied to a range that overlaps an existing `separationDirectives[]` entry (the mobile side rejects it). On overlap the model must respond with `kind=text` and present three priced options: (A) replace existing, (B) split off the non-overlapping portion, (C) shorter multi-piece separation — cost-optimized in the order **B > C > A**.

**Tool-code fallback** — Gemini 2.5 Flash occasionally ignores `functionDeclarations` and replies with a `tool_code` markdown block instead. `GeminiClient.recoverToolCallsFromText` reconstructs the `ToolCall`s so the client still sees a `proposal`. Two formats are recognized: `print(default_api.<name>(kwargs))` with Python literal args (str/int/float/bool/list), and YAML-style pseudo-tool-code with a separate `rationale` field.

**System instruction constraints**: respond in the user's last-turn language (`locale` is fallback only) / never auto-translate subtitle text / never invent IDs or timestamps not in `projectContext` / one `kind` per response / required args must never be guessed (ask instead).

---

## Auto subtitles

Perso STT → Gemini translation → signed SRT URL.

### `POST /api/v2/subtitles`

**Request** — multipart:
| Field | Description |
|---|---|
| `file` *(optional)* | Source video/audio. Omit when reusing a prior render via `spec.editedRenderJobId`. |
| `spec` | JSON `SubtitleSpec` (form-item, not a file). Optional `editedRenderJobId` reuses an existing `/api/v2/render` output as the source — avoids re-uploading large edited videos. |

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

Perso dubbing job (a single `submitTranslate` — Perso handles translation and voice synthesis as a black box).

### `POST /api/v2/autodub`

**Request** — multipart:
| Field | Description |
|---|---|
| `file` *(optional)* | Source video/audio. Omit when reusing a prior render via `spec.editedRenderJobId`. |
| `spec` | JSON `AutoDubSpec` — `targetLanguageCodes`, voice options, trimming, optional `editedRenderJobId`. |

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
| `file` *(optional)* | mp4 or mp3 (≤ `MAX_UPLOAD_FILE_SIZE_MB`, default 500). Omit when reusing a prior render via `spec.editedRenderJobId`. |
| `spec` | JSON `SeparationSpec` (optional `editedRenderJobId` for render-output reuse) |

```jsonc
// SeparationSpec
{
  "mediaType": "VIDEO",          // "VIDEO" or "AUDIO"
  "numberOfSpeakers": 2,         // 1..10 — optional hint; Perso auto-detects when omitted
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
  "outputKind": "video",   // "video" (default, mp4) | "audio" (m4a AAC 192k, video stages skipped)
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

`outputKind="audio"` skips video concat / subtitle burn-in / sticker overlay and emits audio-only m4a — used as the source for downstream `/subtitles` or `/separate` calls via `editedRenderJobId`. Cuts those job latencies by 5–10x compared to re-rendering video and stripping audio.

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
