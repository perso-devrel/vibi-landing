# BFF API Reference — `/api/v2/*`

Specification for every endpoint the vibi mobile client calls. The **Swagger UI** (`http://localhost:8080/swagger`) is the authoritative single source of truth; this markdown is an offline lookup / citation copy.

- **Swagger is mounted only when `ENABLE_SWAGGER=true`** (off by default, including local dev — it exposes the full *unauthenticated* spec). For a liveness/readiness probe that's always on, use **`GET /healthz`** (unauthenticated, exempt from rate limiting, returns `200`).
- All responses are JSON. Error shape: [`error-contract.md`](./error-contract.md).
- Auth: most endpoints require `Authorization: Bearer <jwt>` (BFF-issued JWT). Issuance: `POST /api/v2/auth/google` or `POST /api/v2/auth/apple`. The BFF-issued JWT carries `iss="vibi-bff"` / `aud="vibi-mobile"`; tokens minted before this tightening (no `aud`) are rejected, so a one-time re-login is required after that deploy.
- **Submit endpoints** (`POST /render`, `/render/v3`, `/render/inputs`, `POST /separate`) additionally re-check that the account still exists — a valid JWT for a since-deleted account → `401 account_deleted`. Polling/download GETs skip the DB check (no cost impact).
- **Rate limits** (429 on exceed, Ktor `RateLimit` plugin): auth login **10/min** (per IP), render submit **10/min** and separation submit (`POST /separate`) **20/min** (per user, IP fallback). Status-poll and download GETs are not limited. Behind a proxy, set `RATE_LIMIT_TRUSTED_PROXY_HOPS` so the client IP is read from the right of `X-Forwarded-For`.
- multipart upload form-field limits are noted separately (must be called out when over 50MB — see `vibi-bff/CLAUDE.md` "Known BFF bug patterns").
- Full response model definitions: `vibi-bff/src/main/kotlin/com/vibi/bff/model/BffModels.kt` (plus `AuthModels.kt`, `CreditModels.kt`, `PersoModels.kt`).
- **Download endpoints (`/render/{id}/download`, `/separate/{id}/stem/{stemId}`) 302-redirect to a Cloudflare R2 SigV4 presigned URL when `R2_BUCKET` is set** — R2 egress is free, so Cloud Run instance *and* egress cost are both decoupled from the byte stream. When `R2_BUCKET` is blank (the local-dev path) the same routes fall back to `respondFile` streaming. Clients must follow redirects.

> **Removed surfaces** (BFF commit `52f8d7c refactor(bff): sticker/자막/더빙 surface 절단`, plus later cuts): `/api/v2/subtitles*`, `/api/v2/autodub*`, `/api/v2/lipsync*`, sticker overlays in `/render`, subtitle burn-in in `/render`, `/api/v2/chat` (Gemini function-calling assistant), `/api/v2/languages`, and the server-side mix endpoints `POST /api/v2/separate/{id}/mix` / `GET /api/v2/separate/mix/{id}{,/download}`. Final mix is now performed inside `/render` via `RenderConfig.separationDirectives[*].selections[]`; volume-slider preview during stem editing is done locally on the mobile side (multi-player playback). The mobile `BffApi.kt` has been pruned to match — none of the dead caller methods remain.

Table of contents:

- [Authentication](#authentication)
- [Credits + IAP](#credits--iap)
- [Render (multipart + v3 asset-by-reference)](#render-multipart--v3-asset-by-reference)
- [Asset upload (v3)](#asset-upload-v3)
- [Audio separation + remix](#audio-separation--remix)
- [Admin (read-only)](#admin-read-only)
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

### `DELETE /api/v2/auth/account`

Permanently deletes the authenticated user. FK cascade clears `user_credits`, `credit_transactions`, `render_jobs`, `separation_jobs` per the V5 migration policy. Before deleting the row, an `AccountContentEraser` also removes that user's separation stems and render outputs from local disk **and R2** (GDPR/CCPA erasure). Satisfies the App Store guideline 5.1.1(v) "in-app account deletion" requirement.

**Request** — empty body. `Authorization: Bearer <jwt>` required.

**Response** — `204 No Content`.

---

## Credits + IAP

The mobile client gates audio separation on a credit balance. Cost is **1 credit per started 5 minutes** of separation-source duration — `ceil(durationMs / 5min)`, minimum 1 (`CreditCost.forSeparation`, `BILLABLE_BLOCK_MS = 5*60*1000`). A 1-second per-block grace (`BOUNDARY_GRACE_MS`) absorbs AAC encoder padding so the `/credits/cost` quote matches the deduction. IAP receipts are verified directly against Apple/Google upstream APIs before crediting the balance.

> **Signup bonus.** The first successful `/auth/{google,apple}` upsert grants `SIGNUP_BONUS_CREDITS` (currently `3`) via `CreditRepository.grantSignupBonus` — recorded in the ledger as `(kind='signup', ref_id="signup-<userId>")`, UNIQUE-idempotent so a duplicate sign-in won't double-grant. Grant failures are logged but never block the sign-in itself.

### `GET /api/v2/credits`

Current authenticated user's balance. Returns 0 when no row exists yet.

**Response** — `CreditBalanceResponse { "balance": 0 }`.

### `GET /api/v2/credits/cost?durationMs={ms}`

Quote endpoint — called before showing the "이 구간 X 크레딧 사용, 진행할까요?" confirmation. Returns the cost, current balance, and whether the user has enough.

**Response** — `CreditCostResponse { "durationMs", "credits", "balance", "sufficient" }`.

**Errors** — `400 missing_duration_ms` when `durationMs` query param is absent. `400 duration_ms_negative` when `< 0`.

### `POST /api/v2/credits/purchase`

Verifies a StoreKit2 / Play Billing receipt against Apple's App Store Server API or Google's Android Publisher API, then atomically grants credits. `(platform, transactionId)` is `UNIQUE` — duplicate calls are idempotent (return `granted=0`).

**Request** — JSON `CreditPurchaseRequest { "platform": "apple"|"google", "transactionId", "receipt", "productId" }`.

**Response** — `CreditPurchaseResponse { "granted", "balance", "transactionId" }`.

**Errors** —
| `error` | HTTP | Trigger |
|---|:-:|---|
| `invalid_platform` | 400 | platform not in `{"apple","google"}` |
| `missing_receipt` | 400 | `transactionId` or `receipt` blank |
| `unknown_product` | 400 | `productId` not in `CreditCatalog` |
| `iap_unconfigured` | 400 | the platform's IAP verifier env (`IAP_APPLE_*` / `IAP_GOOGLE_*`) is missing |
| `receipt_invalid` | 400 | upstream verification failed (single sanitized message — internal reason in BFF logs only) |
| `receipt_verify_unavailable` | 502 | Apple/Google upstream transient error; safe to retry with same `transactionId` |

### `POST /api/v2/credits/admin-grant`

Admin-role-only test/demo top-up. No receipt verification. Each call gets a fresh server-generated `txId` (`admin-<uuid>`) so repeated calls accumulate. Returns 403 unless the JWT subject has admin role. Capped at `ADMIN_GRANT_DAILY_CAP` credits per rolling 24h (default `1000`) — over the cap → `429 admin_grant_daily_cap_exceeded`.

**Request** — JSON `AdminGrantRequest { "productId" }`.

**Response** — `CreditPurchaseResponse`.

---

## Render (multipart + v3 asset-by-reference)

Local ffmpeg pipeline. Multi-segment normalize → concat demuxer (`-c copy`) → final mix (`-c:v copy`, BGM `atrim`+`amix`, separation stem `amix normalize=0`).

Two submission paths coexist:

- **Multipart** (`POST /render`, plus `/render/inputs` for shared upload cache) — original path. The mobile client uploads bytes in the multipart body, optionally referenced by an `inputId` from a prior `/inputs` upload.
- **v3 asset-by-reference** (`POST /render/v3`) — JSON body only. Segment / BGM bytes are uploaded directly to R2 via `POST /assets/upload-url` first, then the render config carries `assets/<sha>.<ext>` keys. Avoids Cloud Run request-body limits and lets the mobile client skip re-upload when R2 already has the bytes. This is what the current mobile build uses.

### `POST /api/v2/render/inputs`

Legacy companion to multipart `POST /render`. Uploads the source video once and caches it so the same video can back several follow-up renders without re-multiparting. The returned `inputId` is passed to `POST /render` as a form field to skip the `video*` parts. `inputId = sha256(video)[:16]`, so the same file resolves to the same slot on retry. TTL default 24h (`RENDER_INPUT_CACHE_TTL_HOURS`), hourly sweep. The current mobile build uses `/render/v3` for the same effect via R2 asset addressing — `/render/inputs` stays as a fallback when `R2_BUCKET` isn't configured.

**Request** — multipart `video` (one part).

**Response** — `RenderInputCacheResponse { "inputId", "expiresAt", "videoSizeBytes" }`.

### `POST /api/v2/render`

**Request** — multipart:
| Field | Description |
|---|---|
| `inputId` | (optional) Cache ID returned by `/render/inputs`. If present, the `video*` parts are skipped. |
| `video` *(legacy single-video mode)* / `video_0`, `video_1`, … | Source video. |
| `bgm_0`, … | BGM tracks (referenced from `bgmClips[]`). |
| `inputId` | (optional) Re-use a previously uploaded video from `/render/inputs` instead of resending bytes. |
| `config` | JSON `RenderConfig` (form-item). |

Sticker overlays, dub clips, image segments, and audio-override are all gone — the remaining render surface is segment concat + BGM amix + separation stem amix.

**RenderConfig** — two modes:

```jsonc
// Legacy single-video
{
  "videoDurationMs": 60000,
  "outputKind": "video",   // "video" (default, mp4) | "audio" (m4a AAC 192k, video stages skipped)
  "quality": "medium",     // "low" | "medium" (default) | "high" — CRF + preset + audio bitrate triple
  "bgmClips":  [ { "audioFileKey": "bgm_0",   "startMs": 0,
                   "sourceTrimStartMs": 2000, "sourceTrimEndMs": 8000, "volume": 0.6 } ],
  "separationDirectives": [ /* per-range stem mix — see Audio separation section */ ]
}

// Multi-segment
{
  "segments": [
    { "sourceFileKey": "video_0", "order": 0,
      "durationMs": 30000, "trimStartMs": 0, "trimEndMs": 30000,
      "volumeScale": 1.0, "speedScale": 1.0 }
  ],
  "bgmClips": [ /* with optional sourceTrim*Ms for sub-range mixing */ ],
  "separationDirectives": [ /* … */ ]
}
```

Output resolution: ffprobe-extracted from the source video. BGM `sourceTrimStartMs`/`sourceTrimEndMs` come from the mobile `BgmTrimSheet`'s sub-range handles and are translated into ffmpeg `atrim`+`asetpts` at mix time.

`outputKind="audio"` emits audio-only m4a (AAC). The mobile client no longer pre-renders before separation (commit `3d94e95 refactor(separation): /render 선행 호출 제거`), so this mode is rarely exercised end-to-end now.

`quality` maps to an `(x264 CRF, preset, audio bitrate)` triple:

| Profile | CRF | preset | audio |
|---|---|---|---|
| `high` | 20 | slow | 192k |
| `medium` | 23 | fast | 192k |
| `low` | 28 | fast | 128k |

**Response** — `RenderResponse { "jobId": "rnd-..." }`.

### `POST /api/v2/render/v3`

JSON-only render submission. Bytes must already be in R2 (via [`/assets/upload-url`](#post-apiv2assetsupload-url)).

**Request** — JSON `RenderConfigV3`:

```jsonc
{
  "segments": [
    { "sourceAssetKey": "assets/<sha256>.<ext>", "order": 0,
      "durationMs": 30000, "trimStartMs": 0, "trimEndMs": 30000,
      "volumeScale": 1.0, "speedScale": 1.0 }
  ],
  "bgmClips": [ { "audioAssetKey": "assets/<sha256>.<ext>", "startMs": 0,
                  "sourceTrimStartMs": 0, "sourceTrimEndMs": 0, "volume": 1.0 } ],
  "separationDirectives": [ /* same shape as RenderConfig */ ],
  "outputKind": "video",
  "quality": "medium"
}
```

Every `sourceAssetKey` / `audioAssetKey` must start with `assets/` (BFF rejects otherwise). The route downloads each referenced object from R2 into the local ffmpeg working directory before running the same pipeline as legacy `/render`.

**Response** — `RenderResponse { "jobId": "rnd-..." }`.

### `GET /api/v2/render/{jobId}/status`

`PENDING` / `PROCESSING` / `COMPLETED` / `FAILED` + `progress` + optional `progressReason` (`"queued"` while waiting for an ffmpeg permit).

### `GET /api/v2/render/{jobId}/download`

mp4 byte stream. **Not statically mounted** — always go through this endpoint. With `R2_BUCKET` set, responds `302` to an R2 SigV4 presigned URL.

---

## Asset upload (v3)

### `POST /api/v2/assets/upload-url`

Hands out a short-lived (300s) R2 presigned PUT URL for the mobile client to upload bytes directly. The BFF dedupes via `objectExists` first — if R2 already has the object, the response is `alreadyExists=true` and the client skips PUT.

**Request** — JSON `AssetUploadUrlRequest`:

```jsonc
{
  "sha256Hex": "<64-char lower hex>",
  "sizeBytes": 12345678,
  "ext": "mp4",
  "contentType": "video/mp4"
}
```

**Response** — `AssetUploadUrlResponse`:

```jsonc
{
  "assetKey": "assets/<sha>.<ext>",
  "alreadyExists": false,
  "uploadUrl": "https://...r2.cloudflarestorage.com/...?X-Amz-Signature=...",
  "expiresInSec": 300
}
```

When `alreadyExists=true`, `uploadUrl` is `null` and `expiresInSec` is `0` — reuse the `assetKey` directly.

**Errors** — `503 r2_disabled` when `R2_BUCKET` is unset. `sizeBytes` over `MAX_UPLOAD_FILE_SIZE_MB` → 400. `sha256Hex` not 64-char lower hex → 400.

> SigV4 binds `contentType` and `Content-Length` at sign time — the subsequent PUT must use the exact same values or R2 returns 401.

---

## Audio separation + remix

Perso voice separation exposes per-speaker stems (`speaker_0..N`) + `voice_all`; only the stems the user selects are remixed back together via amix.

### `POST /api/v2/separate`

Mobile clients send audio only — trim + audio-extract (m4a AAC) happens on-device before upload. The BFF whitelists `m4a` / `mp3` / `wav`; `flac` / video / `ogg` etc. → `400 unsupported_audio_format`.

**Request** — multipart:
| Field | Description |
|---|---|
| `file` | m4a / mp3 / wav, ≤ `MAX_SEPARATION_AUDIO_MB` (default 100). |
| `spec` | JSON `SeparationSpec` (form-item) |

```jsonc
// SeparationSpec — minimal shape
{ "sourceLanguageCode": "auto" }  // or an ISO code like "ko"
```

> Earlier versions exposed `mediaType`, `numberOfSpeakers`, `trimStartMs/EndMs` etc. Those were removed when the contract became audio-only — the mobile client does trim/extraction itself, so the BFF doesn't need to. Old fields are tolerated (`AppJson` ignores unknown keys) but ignored.

The route charges credits **at submit time**, before dispatching to Perso — cost = **1 credit per started 5 minutes** of source duration (`ceil`, minimum 1; source length is ffprobe-measured, with a conservative size-based fallback on probe failure). Insufficient balance → `402 insufficient_credits` (detail `required=<n> balance=<n>`). On job failure or reaping the charge is refunded (idempotent — no-op if already refunded). Submit is also rate-limited to 20/min per user and rejects a deleted-account JWT with `401 account_deleted`.

**Response** — `SeparationResponse { "jobId": "sep-..." }`.

### `GET /api/v2/separate/{jobId}`

Status + signed URL per stem on `READY`. Also returns `actualDurationMs` (measured stem FLAC duration) so the client can pin the timeline range to the real length, and `queuePosition` / `estimatedWaitSec` while `QUEUED`.

| `stemId` | Label | Source |
|---|---|---|
| `voice_all` | All speakers | Perso `originalVoiceAudio` |
| `speaker_0`, `speaker_1`, … | Speaker 1, 2, … | Perso `originalVoiceSpeakers` (TAR unpack) |
| `background` | Background audio | Perso `originalBackgroundPath` (with `originalSubBackground` fallback) |

### `GET /api/v2/separate/{jobId}/stem/{stemId}?token=…`

Signed stem audio stream. 401 if no token, 403 if expired.

> **Final mix lives in `/render`, not `/separate`** — the volume-slider preview while the user edits stems plays the stem URLs locally (multi-player AVAudioPlayer / ExoPlayer mix on the mobile side). The final committed mix is performed by `/render` via `RenderConfig.separationDirectives[*].selections[]`, where each selection passes a stem URL + volume. ffmpeg `amix` runs with `normalize=0` so unmuting all stems preserves the original loudness (commit `92e1758`). The BFF checks every `selections[].audioUrl` is its own HMAC-signed `/separate/.../stem/` URL — foreign URLs are rejected with `400 invalid_stem_url`.

---

## Admin (read-only)

`/api/v2/admin/*` is mounted unconditionally on the BFF, but every handler enforces `requireAdmin(jwtSecret)` — the JWT must carry the `admin` role or the call returns `403 admin_required`. There are no mutating routes; admins read aggregated KPIs and per-user activity only. The admin SPA itself ships in-process and is mounted at `/${ADMIN_SLUG}/` only when `ADMIN_SLUG` is set (see [`environment.md`](./environment.md)).

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v2/admin/overview` | Top KPI cards — total users, total jobs, cumulative source duration, 7-day active users. |
| GET | `/api/v2/admin/stats/daily` | Daily trend. `from` / `to` are ISO dates; default = last 30 days. `from` inclusive, `to` exclusive. |
| GET | `/api/v2/admin/users` | Paged user list with per-user job counters + last-activity timestamp. `limit` 1..200 (default 50), `offset` ≥0, `q` search. |
| GET | `/api/v2/admin/stats/external-calls` | Perso daily call count + failure rate + p95 latency. |
| GET | `/api/v2/admin/stats/duration-histogram` | Source-duration distribution (5 buckets). |
| GET | `/api/v2/admin/jobs/active` | In-progress render + separation jobs. |
| GET | `/api/v2/admin/stats/signups` | Daily new signups by provider. |
| GET | `/api/v2/admin/revenue` | Paying users + sold credits + platform split (admin-grant excluded). |
| GET | `/api/v2/admin/revenue/daily` | Daily IAP revenue trend (admin-grant excluded). |
| GET | `/api/v2/admin/jobs/status-breakdown` | Job success / failure breakdown. |
| GET | `/api/v2/admin/users/{userId}/jobs` | Render + separation job history for a single user. |

Daily-range params validate: bad format → `400 invalid_from_date` / `invalid_to_date`; `from >= to` → `400 from_must_be_before_to`; span over 90 days → `400 range_too_wide`.

Code: `vibi-bff/.../routes/AdminRoutes.kt` + `service/AdminRepository.kt`. DTOs in `model/AdminModels.kt`.

---

## Dev testdata

These are mock endpoints for local development. Not authenticated — so they are **mounted only when `ENABLE_TESTDATA_MOCK=true`** (off by default; never enabled in production).

### `GET /api/v2/testdata/separation/list`

Lists `testdata/<startSec>-<endSec>/` folders found under the BFF's working directory, each with the stem audio filenames inside (extension-stripped).

**Response** — array of `{ folder, startSec, endSec, stems[] }`.

### `GET /api/v2/testdata/separation/{folder}/{stem}`

Returns the matching stem audio file (whatever extension exists — `wav`/`mp3`/`m4a`/`aac`/`ogg`/`flac`). Used by the mobile separation flows when developing without hitting Perso.

---

## Code references

- Route definitions: `vibi-bff/src/main/kotlin/com/vibi/bff/routes/{Auth,Asset,Credit,Render,Separation}Routes.kt` (+ `DownloadResponder`, `MultipartUtils` helpers)
- DTOs: `vibi-bff/.../model/BffModels.kt`, `AuthModels.kt`, `CreditModels.kt`, `PersoModels.kt`, `AdminModels.kt`
- Client-side callers: `vibi-mobile/shared/src/commonMain/kotlin/com/vibi/shared/data/remote/api/BffApi.kt`
- OpenAPI: `vibi-bff/src/main/resources/openapi/vibi-bff.yaml`
