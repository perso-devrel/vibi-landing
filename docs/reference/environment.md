# Environment Variables

All of vibi's environment dependencies live in two files:

- **BFF**: `vibi-bff/.env` (or the same keys in system env). Validated in `vibi-bff/src/main/kotlin/com/vibi/bff/config/AppConfig.kt`.
- **Mobile**: `vibi-mobile/local.properties`. Gradle injects these into BuildConfig at build time.

Do not hardcode keys, secrets, or internal IPs in code — use `<placeholder>` only; real values must flow in from the two files above.

---

## BFF — `vibi-bff/.env`

`PERSO_API_KEY`, `PERSO_SPACE_SEQ`, `SEPARATION_SIGNING_SECRET`, `AUTH_JWT_SECRET`, `GOOGLE_OAUTH_CLIENT_IDS`, `DATABASE_URL`, `DB_USER`, `DB_PASSWORD` are fail-fast at boot — the server exits immediately on missing or malformed values.

> **Local dev vs Cloud Run.** `.env` is for local `./gradlew run` (and the one-shot `deploy/cloud-run.sh` bootstrap). The single source of runtime env for production Cloud Run is `.github/workflows/deploy.yml` — Secret Manager for sensitive values, GitHub Secrets for the deploy-time identities (`GCP_WIF_PROVIDER`, `GCP_SA_EMAIL`, `GCP_PROJECT_ID`, `GCP_RUNTIME_SA_EMAIL`, `GOOGLE_OAUTH_CLIENT_IDS`, `GOOGLE_OAUTH_CLIENT_ID_ADMIN`, `APPLE_OAUTH_CLIENT_IDS`, `ADMIN_SLUG`), and GitHub Variables for plain config (`CORS_ALLOWED_ORIGINS`, `BFF_BASE_URL`, `R2_BUCKET`, `R2_ACCOUNT_ID`). Update those in repo Settings → Secrets and variables → Actions, then push or "Run workflow". Comma-containing values are quoted via the `^@^` delimiter (see `deploy.yml`). Postgres credentials (`DATABASE_URL`, `DB_USER`, `DB_PASSWORD`) and the Apple IAP key (`IAP_APPLE_ISSUER_ID` / `IAP_APPLE_KEY_ID` / `IAP_APPLE_PRIVATE_KEY`) ride through Secret Manager; the non-secret IAP fields (`IAP_APPLE_BUNDLE_ID`, `IAP_APPLE_ENV`, `IAP_GOOGLE_PACKAGE_NAME`) and `RATE_LIMIT_TRUSTED_PROXY_HOPS` are GitHub Variables.

### Perso AI

| Key | Required | Default | Description |
|---|:-:|---|---|
| `PERSO_API_KEY` | ✅ | — | Perso-issued API key. Used for audio separation. (Past surfaces — STT / auto-dubbing / lipsync — were removed from the BFF in commit `52f8d7c`.) |
| `PERSO_SPACE_SEQ` | ✅ | — | Perso workspace ID. Look up via `GET /portal/api/v1/spaces`. **Must be greater than 0.** |
| `PERSO_BASE_URL` | | `https://api.perso.ai` | Upstream base URL. Change only when fronted by your own gateway. |
| `PERSO_STORAGE_BASE_URL` | | `https://portal-media.perso.ai` | Audio-separation `/download` responses point at this CDN host (`/perso-storage/...` paths), not `PERSO_BASE_URL`. Auth header is **not** sent here. |
| `PERSO_DOWNLOAD_ALLOWED_HOSTS` | | `portal-media.perso.ai` | Comma-separated SSRF whitelist for download fetches. `PERSO_BASE_URL` and `PERSO_STORAGE_BASE_URL` hosts are added automatically. |
| `PERSO_POLL_INTERVAL_MS` | | `15000` | Progress poll interval (ms). **Must be ≥ 1000.** |
| `PERSO_MAX_POLL_MINUTES` | | `30` | Audio separation job poll timeout (minutes). **1..120.** |

### Server

| Key | Required | Default | Description |
|---|:-:|---|---|
| `PORT` | | `8080` | Ktor server bind port. |
| `BFF_BASE_URL` | | `http://localhost:8080` | Public URL used to sign download links. Change to ngrok / LAN address when exposing externally. |
| `STORAGE_PATH` | | `./storage` | Root for upload / render / separation artifacts. Use a location with sufficient disk space. |
| `CORS_ALLOWED_ORIGINS` | | *(blank = any)* | Comma-separated whitelist. For Android-only deployments, set to a sentinel like `android-only.invalid` to block browsers. |
| `R2_BUCKET` | | *(blank)* | Cloudflare R2 bucket name. When set, large render / separation outputs are uploaded and the `/download` endpoints **302-redirect** to a SigV4 presigned URL. **R2 egress is free**, so this decouples Cloud Run instance time *and* zeros out egress cost. Blank falls back to `respondFile` streaming (the dev path). |
| `R2_ACCOUNT_ID` | | — | 32-char hex from `dash.cloudflare.com/<id>/r2`. Determines the S3 endpoint host as `https://{accountId}.r2.cloudflarestorage.com` (no separate endpoint var). Required when `R2_BUCKET` is set. |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | | — | R2 API token (Object Read & Write). Issued in Cloudflare dashboard → R2 → Manage API Tokens. Required when `R2_BUCKET` is set. |
| `SIGNED_URL_TTL_SEC` | | `900` (15m) | Presigned URL lifetime (s). 60..86400. Only consulted when `R2_BUCKET` is set. |

### Separation

| Key | Required | Default | Description |
|---|:-:|---|---|
| `SEPARATION_SIGNING_SECRET` | ✅ | — | HMAC key for stem download URLs. **Enforced ≥ 32 chars.** Generate with `openssl rand -hex 32`. Rotation invalidates all unexpired tokens at once. |
| `SEPARATION_ABANDON_TTL_MS` | | `604800000` (7d) | Time (ms) before READY-but-uncollected separation results are cleaned up. Matches the "resume separation later" window the mobile client assumes. |
| `SEPARATION_URL_TTL_SEC` | | `604800` (7d) | Stem download token lifetime (s). 60..604800. **Must not exceed** `SEPARATION_ABANDON_TTL_MS` — a live token for a reaped job has no server-side mapping. |
| `SEPARATION_MAX_PERSO_IN_FLIGHT` | | `2` | BFF-side concurrency cap for Perso `/audio-separation` calls. The dispatcher queues additional requests. Default `2` keeps "1 running + 1 Perso-side queued" so there is no idle gap. **1..5.** |
| `SEPARATION_STUCK_SUBMITTING_SEC` | | `600` (10m) | If a job sits in `SUBMITTING` for more than this many seconds, the reaper treats the worker as dead and requeues the job. Must be **longer** than worst-case Perso upload + retry and **shorter** than the stale-QUEUED window (30 min). **60..1800.** |

### Authentication (Google + Apple Sign In + own JWT)

| Key | Required | Default | Description |
|---|:-:|---|---|
| `GOOGLE_OAUTH_CLIENT_IDS` | ✅ | — | Comma-separated. iOS / Android / Web client ids all allowed. Passes only when the `tokeninfo` `aud` matches one of these. |
| `APPLE_OAUTH_CLIENT_IDS` | | *(blank = disabled)* | Comma-separated Apple Sign In client ids (typically iOS bundle id like `com.vibi.ios`). Blank → `POST /api/v2/auth/apple` returns `503`. |
| `AUTH_JWT_SECRET` | ✅ | — | HMAC-SHA256 signing key. **Enforced ≥ 32 chars.** Rotation invalidates every unexpired JWT at once. |
| `AUTH_JWT_EXPIRY_SECONDS` | | `604800` (7d) | Issued access token lifetime (s). 60..7776000 (90 days). |

### Postgres (user upsert + credits + jobs)

The BFF persists `(provider, providerSub)` tuples into a Postgres `users` table on every sign-in, plus credit balances, IAP transactions, render/separation job history. Neon free tier is sufficient.

| Key | Required | Default | Description |
|---|:-:|---|---|
| `DATABASE_URL` | ✅ | — | JDBC URL. Format: `jdbc:postgresql://<host>/<db>?sslmode=require`. For `jdbc:postgresql://` URLs the BFF now **fails boot if `sslmode` is absent or `sslmode=disable`** (`require`/`verify-ca`/`verify-full` accepted). H2 test URLs are exempt. |
| `DB_USER` | ✅ | — | DB role. |
| `DB_PASSWORD` | ✅ | — | DB password. |
| `DB_MAX_POOL` | | `5` | HikariCP pool size. Neon free tier 100 connection cap — 5 per instance is generous. |

### Admin UI

| Key | Required | Default | Description |
|---|:-:|---|---|
| `ADMIN_SLUG` | | *(blank = disabled)* | Unguessable mount path — when set, the admin SPA is served at `/${ADMIN_SLUG}/`. Alphanumeric / dash / underscore, 6..64 chars. Example: `ADMIN_SLUG=x-vb-2026-panel`. |
| `VITE_GOOGLE_OAUTH_CLIENT_ID_ADMIN` | (build-time) | — | Google OAuth **web** client id inlined into the admin SPA bundle at `npm run build` time (Vite reads `VITE_*` env vars). Typically the same web client id you list in `GOOGLE_OAUTH_CLIENT_IDS`. If unset, the admin LoginPage renders a "build env missing" notice and the Google button is hidden. CI wires this from a GitHub Secret named `GOOGLE_OAUTH_CLIENT_ID_ADMIN`. |

### IAP receipt verifiers (App Store / Play Billing)

`POST /api/v2/credits/purchase` won't credit anything until the receipt is verified upstream. When the platform's required keys are blank, that platform's purchase calls return `400 iap_unconfigured`.

| Key | Required | Default | Description |
|---|:-:|---|---|
| `IAP_APPLE_ISSUER_ID` | (per platform) | — | App Store Connect → Users and Access → Keys → Issuer ID (UUID). |
| `IAP_APPLE_KEY_ID` | (per platform) | — | 10-char Key ID of the In-App Purchase key. |
| `IAP_APPLE_PRIVATE_KEY` | (per platform) | — | `.p8` private key body. Newlines may be passed as literal `\n` — AppConfig restores real newlines. |
| `IAP_APPLE_BUNDLE_ID` | (per platform) | — | iOS app bundle id. Verified against the receipt's `bundleId`. |
| `IAP_APPLE_ENV` | | `production` | `production` for App Store, `sandbox` for TestFlight / sandbox tester. |
| `IAP_GOOGLE_PACKAGE_NAME` | (per platform) | — | Android app package name. |
| `IAP_GOOGLE_SERVICE_ACCOUNT_JSON` | (per platform) | — | Service account JSON body for the Android Publisher API. Single-line OK — the JSON parser handles it. |

### Error monitoring (Sentry)

Boot is a no-op when `SENTRY_DSN_BFF` is blank — dev/test won't pollute the production Sentry project.

| Key | Required | Default | Description |
|---|:-:|---|---|
| `SENTRY_DSN_BFF` | | *(blank = disabled)* | Sentry project DSN. |
| `SENTRY_ENV` | | `dev` | Tag for filtering (e.g. `prod`, `staging`). |
| `SENTRY_TRACES_SAMPLE_RATE` | | `0.1` | Performance trace sampling rate (0.0..1.0). |
| `SENTRY_RELEASE` | | — | Release identifier — CI should inject the git SHA so Sentry can group issues by deploy. |

### Runtime tunables (process-level)

These bypass `AppConfig` and are read directly from the process environment — change them when running into Cloud Run cold-start timeouts or memory-tier limits. Unset values fall back to the defaults below.

| Key | Default | Description |
|---|---|---|
| `MAX_UPLOAD_FILE_SIZE_MB` | `500` | General multipart upload ceiling (`POST /render`, `/render/inputs`, asset PUT size cap). Tie to the Cloud Run `--memory` tier — `1Gi` → `200`, `4Gi` → `1000`. |
| `MAX_SEPARATION_AUDIO_MB` | `100` | Separation-only audio upload ceiling. Mobile sends trimmed m4a/mp3/wav — 60min AAC 192k is ~86 MB, so 100 MB has safe margin. |
| `RENDER_INPUT_CACHE_TTL_HOURS` | `24` | TTL of the multipart `/render/inputs` cache. Increase when users edit N variants over many hours. |
| `ASSET_CACHE_TTL_HOURS` | `24` | TTL of the on-disk asset cache used by `/render/v3` after downloading R2 bytes. Hourly sweep removes expired entries. |
| `RENDER_MAX_CONCURRENT` | CPU count / 2 | ffmpeg fan-out cap. Set explicitly when containerized hosts misreport `availableProcessors()`. |
| `HTTP_CONNECT_TIMEOUT_MS` | `120000` (120s) | Ktor HTTP client `connectTimeoutMillis`. Extend for cold starts on the upstream. |
| `HTTP_REQUEST_TIMEOUT_MS` | `600000` (600s) | `requestTimeoutMillis`. Large Perso uploads sit on this. |
| `HTTP_SOCKET_TIMEOUT_MS` | `600000` (600s) | `socketTimeoutMillis`. Same situation as above. |
| `RATE_LIMIT_TRUSTED_PROXY_HOPS` | `0` | Trusted reverse-proxy hop count in front of the BFF. The rate-limiter reads the client IP that many positions from the **right** of `X-Forwarded-For` so a spoofed left-most entry can't dodge limits. Behind Cloud Run set `1`. |
| `UPLOADS_TTL_HOURS` | `6` | Retention (hours) of the `uploads/` staging dir (raw uploaded PII media) before the sweep deletes it. |
| `ADMIN_GRANT_DAILY_CAP` | `1000` | Max credits `POST /credits/admin-grant` may mint per rolling 24h before `429 admin_grant_daily_cap_exceeded`. |
| `RENDER_PROCESS_TIMEOUT_MIN` | `30` | Hard timeout (minutes) on the final ffmpeg render pass — kills a wedged encode instead of holding the instance. |

### Dev / debug toggles

Off in production. Both expose surface that must never be public, so they are opt-in and ship blank in `.env.example`.

| Key | Default | Description |
|---|---|---|
| `ENABLE_SWAGGER` | *(blank = off)* | `=true` mounts the Swagger UI at `/swagger`. It serves the **full unauthenticated** API spec, so it stays off everywhere except local exploration. Use `GET /healthz` for boot/liveness checks instead. |
| `ENABLE_TESTDATA_MOCK` | *(blank = off)* | `=true` mounts the unauthenticated `/api/v2/testdata/separation/*` mock routes used to develop separation flows without hitting Perso. |

### Symptoms on missing values

| Missing key | Boot result |
|---|---|
| `PERSO_API_KEY` | `IllegalArgumentException: PERSO_API_KEY must not be blank` followed by immediate exit |
| `PERSO_SPACE_SEQ` | `PERSO_SPACE_SEQ must be > 0 (got 0)` |
| `SEPARATION_SIGNING_SECRET` (under 32 chars) | `SEPARATION_SIGNING_SECRET must be at least 32 chars (got N)` |
| `AUTH_JWT_SECRET` (under 32 chars) | `AUTH_JWT_SECRET must be at least 32 chars (got N)` |
| `GOOGLE_OAUTH_CLIENT_IDS` | `GOOGLE_OAUTH_CLIENT_IDS must not be empty (comma-separated)` |
| `DATABASE_URL` | `DATABASE_URL must not be blank` |
| `DB_USER` / `DB_PASSWORD` | Hikari fails to initialize the pool at startup. |
| `R2_BUCKET` set, `R2_ACCOUNT_ID` blank | Boot fails — R2 config validates as all-or-nothing. |
| `IAP_APPLE_*` partial | Apple receipt verifier is null. `POST /credits/purchase` with `platform=apple` returns `400 iap_unconfigured`. |
| `STORAGE_PATH` parent not writable | `FileStorageService` mkdirs the path on boot, so a missing directory is fine. But if the **parent** is read-only or owned by a different user, boot logs `Storage initialized at ...` and the first upload throws `IOException: Permission denied`. Point `STORAGE_PATH` at a writable absolute path. |

---

## Mobile — `vibi-mobile/local.properties`

`vibi-mobile/local.properties` is not committed to git. A single file serves the same values to both Android and iOS.

```properties
sdk.dir=/Users/<you>/Library/Android/sdk
BFF_BASE_URL=http://10.0.2.2:8080/
```

| Key | Required | Description |
|---|:-:|---|
| `sdk.dir` | ✅ (Android build) | Absolute path to local Android SDK. |
| `BFF_BASE_URL` | ✅ | Public address of the BFF. **Trailing slash required** (Ktor Client base URL join rule). |

### `BFF_BASE_URL` — recommended values per target

| Target | Value |
|---|---|
| Android emulator | `http://10.0.2.2:8080/` |
| Android physical device | `http://192.168.x.x:8080/` (Mac LAN IP) |
| iOS simulator | `http://localhost:8080/` or Mac LAN IP |
| iOS physical device | `http://192.168.x.x:8080/` |

`10.0.2.2` is the Android emulator's host loopback alias — it does not work on iOS. You must update this value every time you switch between simulator / emulator / physical device.

When using a LAN IP, additional setup may be required — see [`../how-to/connect-real-device.md`](../how-to/connect-real-device.md).

### Symptoms on missing values

| Missing / wrong | Result |
|---|---|
| `sdk.dir` missing | Gradle: `SDK location not found.` |
| `BFF_BASE_URL` missing | Ktor Client cannot resolve relative paths to absolute URLs; `IllegalStateException` on first call. |
| Missing trailing slash | Ktor's path-join rule may send `api/v2/...` to a path other than intended. |
| Using `10.0.2.2` from iOS simulator | All BFF calls connect-timeout. |

---

## Code references

- `vibi-bff/src/main/kotlin/com/vibi/bff/config/AppConfig.kt` — env → validated `AppConfig` data class.
- `vibi-bff/src/main/kotlin/com/vibi/bff/Constants.kt` — `MAX_UPLOAD_FILE_SIZE`, `MAX_SEPARATION_AUDIO_SIZE`.
- `vibi-bff/src/main/resources/application.conf` — HOCON template that env vars override.
- `vibi-bff/src/main/kotlin/com/vibi/bff/Application.kt` — Sentry init + the process-level tunable reads.
