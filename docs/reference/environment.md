# Environment Variables

All of vibi's environment dependencies live in two files:

- **BFF**: `vibi-bff/.env` (or the same keys in system env). Validated in `vibi-bff/src/main/kotlin/com/vibi/bff/config/AppConfig.kt`.
- **Mobile**: `vibi-mobile/local.properties`. Gradle injects these into BuildConfig at build time.

Do not hardcode keys, secrets, or internal IPs in code — use `<placeholder>` only; real values must flow in from the two files above.

---

## BFF — `vibi-bff/.env`

`PERSO_API_KEY`, `PERSO_SPACE_SEQ`, `SEPARATION_SIGNING_SECRET`, `AUTH_JWT_SECRET`, `GOOGLE_OAUTH_CLIENT_IDS`, `DATABASE_URL`, `DB_USER`, `DB_PASSWORD` are fail-fast at boot — the server exits immediately on missing or malformed values.

> **Local dev vs Cloud Run.** `.env` is for local `./gradlew run` (and the one-shot `deploy/cloud-run.sh` bootstrap). The single source of runtime env for production Cloud Run is `.github/workflows/deploy.yml` — Secret Manager for sensitive values (`PERSO_API_KEY`, `PERSO_SPACE_SEQ`, `AUTH_JWT_SECRET`, `SEPARATION_SIGNING_SECRET`), GitHub Secrets for the deploy-time identities (`GCP_WIF_PROVIDER`, `GCP_SA_EMAIL`, `GCP_PROJECT_ID`, `GCP_RUNTIME_SA_EMAIL`, `GOOGLE_OAUTH_CLIENT_IDS`), and GitHub Variables for plain config (`CORS_ALLOWED_ORIGINS`, `BFF_BASE_URL`). Update those in repo Settings → Secrets and variables → Actions, then push or "Run workflow". Comma-containing values are quoted via the `^@^` delimiter (see `deploy.yml`).

### Perso AI

| Key | Required | Default | Description |
|---|:-:|---|---|
| `PERSO_API_KEY` | ✅ | — | Perso-issued API key. Used for audio separation. (Past surfaces — STT / auto-dubbing / lipsync — were removed from the BFF in commit `52f8d7c`.) |
| `PERSO_SPACE_SEQ` | ✅ | — | Perso workspace ID. Look up via `GET /portal/api/v1/spaces`. **Must be greater than 0.** |
| `PERSO_BASE_URL` | | `https://api.perso.ai` | Upstream base URL. Change only when fronted by your own gateway. |
| `PERSO_POLL_INTERVAL_MS` | | `15000` | Progress poll interval (ms). **Must be ≥ 1000.** |
| `PERSO_MAX_POLL_MINUTES` | | `30` | Audio separation job poll timeout (minutes). **1..120.** |

### Server

| Key | Required | Default | Description |
|---|:-:|---|---|
| `PORT` | | `8080` | Ktor server bind port. |
| `BFF_BASE_URL` | | `http://localhost:8080` | Public URL used to sign download links. Change to ngrok / LAN address when exposing externally. |
| `STORAGE_PATH` | | `./storage` | Root for upload / render / separation artifacts. Use a location with sufficient disk space. |
| `CORS_ALLOWED_ORIGINS` | | *(blank = any)* | Comma-separated whitelist. For Android-only deployments, set to a sentinel like `android-only.invalid` to block browsers. |
| `GCS_BUCKET` | | *(blank)* | GCS bucket name. When set, large render / separation outputs are uploaded and the `/download` endpoint **302-redirects** to a V4 signed URL — Cloud Run instance and egress are decoupled from the byte stream. Blank falls back to `respondFile` streaming (the dev path). |
| `GCS_SIGNED_URL_TTL_SEC` | | `900` (15m) | V4 signed URL lifetime (s). 60..86400. Only consulted when `GCS_BUCKET` is set. |

### Separation / signing

| Key | Required | Default | Description |
|---|:-:|---|---|
| `SEPARATION_SIGNING_SECRET` | ✅ | — | HMAC key for stem / mix download URLs. **Enforced ≥ 32 chars.** Generate with `openssl rand -hex 32`. Rotation invalidates all unexpired tokens at once. |
| `SEPARATION_ABANDON_TTL_MS` | | `604800000` (7d) | Time (ms) before READY-but-uncollected separation results are cleaned up. Must be ≥ 60_000. Matches the "resume separation later" window the mobile client assumes. |
| `SEPARATION_MIX_TTL_MS` | | `600000` (10m) | Mix artifact retention time (ms). Must be ≥ 60_000. |
| `SEPARATION_URL_TTL_SEC` | | `604800` (7d) | Stem download token lifetime (s). 60..604800. Must not exceed `SEPARATION_ABANDON_TTL_MS` — a live token for a reaped job has no server-side mapping. |
| `SEPARATION_MIX_URL_TTL_SEC` | | `600` (10m) | Mix download token lifetime (s). 60..604800. |

### Vertex AI Gemini (chat assistant)

Boot succeeds even if these are missing, as long as chat is not used — they are validated on first call.

| Key | Required | Default | Description |
|---|:-:|---|---|
| `GEMINI_PROJECT_ID` | | — | Vertex AI project. Named `GEMINI_*` (not `GCP_*`) so the Cloud Run hosting project and the Vertex-AI-enabled project can differ. |
| `GEMINI_LOCATION` | | `us-central1` | Vertex AI region. |
| `GEMINI_MODEL` | | `gemini-2.5-flash` | Model ID. |
| `GOOGLE_APPLICATION_CREDENTIALS` | | — | Path to a local service account JSON. Leave blank to fall back to Application Default Credentials — on Cloud Run that resolves to the attached SA via the metadata server; locally it resolves to the `gcloud auth application-default login` cache. |

### Authentication (Google + Apple Sign In + own JWT)

| Key | Required | Default | Description |
|---|:-:|---|---|
| `GOOGLE_OAUTH_CLIENT_IDS` | ✅ | — | Comma-separated. iOS / Android / Web client ids all allowed. Passes only when the `tokeninfo` `aud` matches one of these. |
| `APPLE_OAUTH_CLIENT_IDS` | | *(blank = disabled)* | Comma-separated Apple Sign In client ids (typically iOS bundle id like `com.vibi.ios`). Blank → `POST /api/v2/auth/apple` returns `503`. |
| `AUTH_JWT_SECRET` | ✅ | — | HMAC-SHA256 signing key. **Enforced ≥ 32 chars.** Rotation invalidates every unexpired JWT at once. |
| `AUTH_JWT_EXPIRY_SECONDS` | | `604800` (7d) | Issued access token lifetime (s). 60..7776000 (90 days). |

### Postgres (user upsert)

The BFF persists `(provider, providerSub)` tuples into a Postgres `users` table on every sign-in. Neon free tier is sufficient.

| Key | Required | Default | Description |
|---|:-:|---|---|
| `DATABASE_URL` | ✅ | — | JDBC URL. Format: `jdbc:postgresql://<host>/<db>?sslmode=require`. H2 also accepted for local tests. |
| `DB_USER` | ✅ | — | DB role. |
| `DB_PASSWORD` | ✅ | — | DB password. |
| `DB_MAX_POOL` | | `5` | HikariCP pool size (1..50). Neon free tier 100 connection cap. |

### Perso storage host + SSRF whitelist

| Key | Required | Default | Description |
|---|:-:|---|---|
| `PERSO_STORAGE_BASE_URL` | | `https://portal-media.perso.ai` | Audio-separation `/download` responses point at this CDN host (`/perso-storage/...` paths), not `PERSO_BASE_URL`. The auth header is **not** sent to this host. |
| `PERSO_DOWNLOAD_ALLOWED_HOSTS` | | `portal-media.perso.ai` | Comma-separated SSRF whitelist. `PERSO_BASE_URL` and `PERSO_STORAGE_BASE_URL` hosts are added automatically. |

### Runtime tunables (process-level)

These bypass `AppConfig` and are read directly from the process environment — change them when running into Cloud Run cold-start timeouts or memory-tier limits. Unset values fall back to the defaults below.

| Key | Default | Description |
|---|---|---|
| `MAX_UPLOAD_FILE_SIZE_MB` | `500` | Multipart upload ceiling. Tie to the Cloud Run `--memory` tier — `1Gi` → `200`, `4Gi` → `1000`. Applied to every `receiveMultipart(formFieldLimit=…)` call. |
| `HTTP_CONNECT_TIMEOUT_MS` | `120000` (120s) | Ktor HTTP client `connectTimeoutMillis`. Extend for cold starts on the upstream. |
| `HTTP_REQUEST_TIMEOUT_MS` | `600000` (600s) | `requestTimeoutMillis`. Large Perso uploads sit on this. |
| `HTTP_SOCKET_TIMEOUT_MS` | `600000` (600s) | `socketTimeoutMillis`. Same situation as above. |
| `RENDER_MAX_CONCURRENT` | CPU count | ffmpeg fan-out cap for the render pipeline. |

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
| `GEMINI_PROJECT_ID` missing | Boot succeeds. 5xx on first call to `/api/v2/chat`. |
| `GOOGLE_APPLICATION_CREDENTIALS` missing **and** no ADC cache **and** not on Cloud Run | Boot succeeds. Gemini calls fail with `Could not load credentials`. |
| `STORAGE_PATH` directory missing | Boot succeeds. `IOException` on first upload. Recommended to pre-create: `mkdir -p ./storage/{uploads,render,separation}`. |

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
- `vibi-bff/build.gradle.kts` — `application { mainClass.set(...) }` + build output paths.
- Workspace root [`README.md`](../../README.md) — BFF_BASE_URL per-target table (this document is the single source of truth; the README is an excerpt).
