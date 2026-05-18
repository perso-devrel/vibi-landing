# BFF API Reference — `/api/v2/*`

Specification for every endpoint the vibi mobile client calls. The **Swagger UI** (`http://localhost:8080/swagger`) is the authoritative single source of truth; this markdown is an offline lookup / citation copy.

- All responses are JSON. Error shape: [`error-contract.md`](./error-contract.md).
- Auth: most endpoints require `Authorization: Bearer <jwt>` (BFF-issued JWT). Issuance: `POST /api/v2/auth/google` or `POST /api/v2/auth/apple`.
- multipart upload form-field limits are noted separately (must be called out when over 50MB — see `vibi-bff/CLAUDE.md` "Known BFF bug patterns").
- Full response model definitions: `vibi-bff/src/main/kotlin/com/vibi/bff/model/BffModels.kt` (plus `AuthModels.kt`, `ChatModels.kt`, `PersoModels.kt`).
- **Download endpoints (`/render/{id}/download`, `/separate/{id}/stem/{stemId}`, `/separate/mix/{id}/download`) 302-redirect to a V4 signed GCS URL when `GCS_BUCKET` is set** — Cloud Run instance and egress are decoupled from the byte stream. When `GCS_BUCKET` is blank (the local-dev path) the same routes fall back to `respondFile` streaming. Clients must follow redirects.

> **Removed surfaces** (BFF commit `52f8d7c refactor(bff): sticker/자막/더빙 surface 절단`): `/api/v2/subtitles*`, `/api/v2/autodub*`, `/api/v2/lipsync*`, sticker overlays in `/render`, subtitle burn-in in `/render`. The mobile client still holds some historical `BffApi` methods (`submitSubtitleJob`, `submitAutoDubJob`, `requestLipSync`) — these will 404 if called.

Table of contents:

- [Authentication](#authentication)
- [Language list](#language-list)
- [Render](#render)
- [Audio separation + remix](#audio-separation--remix)
- [Chat (Gemini function calling)](#chat-gemini-function-calling)
- [Dev testdata](#dev-testdata)

---

## Authentication

### `POST /api/v2/auth/google`

Exchanges a Google ID Token for a BFF JWT.

**Request** — JSON `{ "idToken": "<google_id_token>" }`. The `aud` must match the BFF's `GOOGLE_OAUTH_CLIENT_IDS` whitelist (verified via `https://oauth2.googleapis.com/tokeninfo`).

**Response** — `AuthResponseDto` (JWT body + expiration time). The JWT `sub` is the BFF's internal UUID, not the Google subject — reusable as IAP `appAccountToken`.

**Errors** — Google `tokeninfo` 4xx → 401.

### `POST /api/v2/auth/apple`

Exchanges an Apple ID Token for a BFF JWT.

**Request** — JSON `{ "idToken": "<apple_id_token>", "fullName": "..." }`. `fullName` is Apple's first-login-only payload and is only stored on insert. `aud` must match `APPLE_OAUTH_CLIENT_IDS` (typically the iOS bundle id `com.vibi.ios`).

**Response** — `AuthResponseDto` (same shape as Google).

**Errors** — Apple JWKS verification failure → 401. `503` when `APPLE_OAUTH_CLIENT_IDS` is blank (Apple disabled).

> Both endpoints upsert a row in the `users` table keyed by `(provider, provider_sub)`. Apple public keys are RS256-verified via `https://appleid.apple.com/auth/keys` with a 24h in-memory cache.

---

## Language list

### `GET /api/v2/languages`

Proxies the target languages supported by Perso as-is. Also useful as a post-boot health check — verifies that the Perso key and `spaceSeq` are live.

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

**Registered tools** (`vibi-bff/.../service/ChatToolDefs.kt`, **9 total**):

| Group | Tools |
|---|---|
| Segment edit (range) | `delete_segment_range`, `duplicate_segment_range`, `update_segment_volume`, `update_segment_speed` |
| Audio separation | `separate_audio_range`, `update_stem_volume` |
| BGM | `move_bgm_clip`, `update_bgm_volume`, `update_bgm_range` |

The full tool spec is in [`vibi-bff/src/main/resources/chat-tools.md`](https://github.com/perso-devrel/vibi-bff/blob/main/src/main/resources/chat-tools.md) — that file is loaded verbatim as `systemInstruction`, so it is the single source of truth for tool args, the cost-disclosure rule (slow tools get `(예상 ~N분)` in rationale), and the policy below.

> Removed tools (commit `52f8d7c`, paired with the BFF surface cut): `generate_subtitles`, `transcribe_for_subtitles`, `apply_subtitles_with_script`, `update_subtitle_text`, `generate_dub`, `generate_subtitles_for_bgm`, `generate_dub_for_bgm`. The mobile dispatcher still has `when` branches for those names — they're dead defensive code since Gemini won't emit them.

**Edit-invalidation policy (WF-1)** — When the user requests structural segment edits (`delete_segment_range`, `duplicate_segment_range`, `update_segment_speed`) AND the project already has separation directives or BGM placements, the model must append an explicit warning to the proposal rationale: *"⚠ 이 편집을 적용하면 기존 음원 분리/BGM 배치가 초기화됩니다. 진행할까요?"*. `update_segment_volume` is exempt (mix change, not structural).

**Separation overlap policy** — `separate_audio_range` cannot be applied to a range that overlaps an existing `separationDirectives[]` entry (the mobile side rejects it). On overlap the model must respond with `kind=text` and present three priced options: (A) replace existing, (B) split off the non-overlapping portion, (C) shorter multi-piece separation — cost-optimized in the order **B > C > A**.

**Tool-code fallback** — Gemini 2.5 Flash occasionally ignores `functionDeclarations` and replies with a `tool_code` markdown block instead. `GeminiClient.recoverToolCallsFromText` reconstructs the `ToolCall`s so the client still sees a `proposal`. Two formats are recognized: `print(default_api.<name>(kwargs))` with Python literal args (str/int/float/bool/list), and YAML-style pseudo-tool-code with a separate `rationale` field.

**System instruction constraints**: respond in the user's last-turn language (`locale` is fallback only) / never invent IDs or timestamps not in `projectContext` / one `kind` per response / required args must never be guessed (ask instead) / use natural-language confirm gates instead of separate UI dialogs (the mobile client has no [적용/수정/취소] buttons — Gemini asks "진행할까요?" and reads the next user turn as consent).

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

Local ffmpeg pipeline. Multi-segment normalize → concat demuxer (`-c copy`) → final mix (`-c:v copy`, BGM `atrim`+`amix`, optional audio_override).

### `POST /api/v2/render/inputs`

For multi-variant export, uploads the source video once and caches it. The returned `inputId` is passed to `submitRenderJob` to avoid multipart re-upload cost. `inputId = sha256(video)[:16]`, so the same file resolves to the same slot on retry. TTL default 24h (`RENDER_INPUT_CACHE_TTL_HOURS`), hourly sweep.

**Request** — multipart `video` (one part).

**Response** — `RenderInputCacheResponse { "inputId", "expiresAt", "videoSizeBytes" }`.

### `POST /api/v2/render`

**Request** — multipart:
| Field | Description |
|---|---|
| `inputId` | (optional) Cache ID returned by `/render/inputs`. If present, the `video*` parts are skipped. |
| `video` *(legacy)* / `video_0`, `video_1`, … | Source video. |
| `segment_image_0`, … | Still image for IMAGE-type segments. |
| `audio_0`, `audio_1`, … | Dub audio tracks (referenced from `dubClips[]`). |
| `bgm_0`, … | BGM tracks (referenced from `bgmClips[]`). |
| `audio_override` | (optional) Replaces the source video's original audio entirely. |
| `config` | JSON `RenderConfig` (form-item). |

> **Removed multipart fields**: `image_0`, `image_1`, … (sticker overlays) and `subtitles` (ASS for burn-in) — both surfaces were cut in `52f8d7c` / `57025ea`.

**RenderConfig** — two modes:

```jsonc
// Legacy single-video
{
  "videoDurationMs": 60000,
  "outputKind": "video",   // "video" (default, mp4) | "audio" (m4a AAC 192k, video stages skipped)
  "quality": "medium",     // "low" | "medium" (default) | "high" — CRF + preset + audio bitrate triple
  "dubClips":  [ { "audioFileKey": "audio_0", "startMs": 1000, "durationMs": 4000, "volume": 1.0 } ],
  "bgmClips":  [ { "audioFileKey": "bgm_0",   "startMs": 0,    "endMs": 12000,
                   "sourceTrimStartMs": 2000, "sourceTrimEndMs": 8000, "volume": 0.6 } ]
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
  "bgmClips": [ /* with optional sourceTrim*Ms for sub-range mixing */ ],
  "dubClips": [ /* dub clips on the global timeline */ ]
}
```

Output resolution: `segments[0].width`/`height` in multi-segment mode, ffprobe extraction in legacy mode. BGM `sourceTrimStartMs`/`sourceTrimEndMs` are the result of the mobile `BgmTrimSheet`'s sub-range handles and are translated into ffmpeg `atrim`+`asetpts` at mix time.

`outputKind="audio"` skips video concat / final mix video pass and emits audio-only m4a — historically used as the source for downstream `/separate` calls via `editedRenderJobId`. The mobile client no longer pre-renders before separation (commit `3d94e95 refactor(separation): /render 선행 호출 제거`), so this mode is rarely exercised end-to-end now.

`quality` maps to an `(x264 CRF, preset, audio bitrate)` triple:

| Profile | CRF | preset | audio |
|---|---|---|---|
| `high` | 20 | medium | 192k |
| `medium` | 23 | fast | 192k |
| `low` | 28 | fast | 128k |

**Response** — `RenderJobResponse { "jobId": "rnd-..." }`.

### `GET /api/v2/render/{jobId}/status`

`PENDING` / `PROCESSING` / `COMPLETED` / `FAILED` + `progress`.

### `GET /api/v2/render/{jobId}/download`

mp4 byte stream. **Not statically mounted** — always go through this endpoint. With `GCS_BUCKET` set, responds `302` to a V4 signed URL.

---

## Dev testdata

These are mock endpoints for local development. Not authenticated.

### `GET /api/v2/testdata/separation/list`

Lists `testdata/<startSec>-<endSec>/` folders found under the BFF's working directory, each with the stem audio filenames inside (extension-stripped).

**Response** — array of `{ folder, startSec, endSec, stems[] }`.

### `GET /api/v2/testdata/separation/{folder}/{stem}`

Returns the matching stem audio file (whatever extension exists — `wav`/`mp3`/`m4a`/`aac`/`ogg`/`flac`). Used by the mobile chat / separation flows when developing without hitting Perso.

---

## Code references

- Route definitions: `vibi-bff/src/main/kotlin/com/vibi/bff/routes/{Auth,Chat,Language,Render,Separation}Routes.kt`
- DTOs: `vibi-bff/.../model/BffModels.kt`, `ChatModels.kt`, `PersoModels.kt`, `AuthModels.kt`
- Client-side callers: `vibi-mobile/shared/src/commonMain/kotlin/com/vibi/shared/data/remote/api/BffApi.kt`
- OpenAPI: `vibi-bff/src/main/resources/openapi/vibi-bff.yaml`
- Chat tool single source of truth: `vibi-bff/src/main/resources/chat-tools.md`
