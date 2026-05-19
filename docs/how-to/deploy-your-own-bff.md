# Spin up BFF with your own Perso key

In 5–10 minutes, fork vibi-bff, start it with your own Perso key, and point a physical-device vibi mobile build at it.

Assumes you have already completed "Prerequisites" in [`../learning/getting-started.md`](../learning/getting-started.md).

---

## 1. Fork & clone

```bash
gh repo fork <upstream-vibi-bff-url> --clone --remote
cd vibi-bff
```

Or grab a zip under your account and unpack it — either works.

## 2. Write `.env`

```bash
cp .env.example .env
```

Keys to fill in `.env`:

```dotenv
PERSO_API_KEY=<your_perso_api_key>
PERSO_SPACE_SEQ=<your_workspace_seq>
SEPARATION_SIGNING_SECRET=<output of: openssl rand -hex 32>
AUTH_JWT_SECRET=<output of: openssl rand -hex 32>
GOOGLE_OAUTH_CLIENT_IDS=<iOS, Android, Web client ids — comma-separated>
```

For caption translation and chat you also need Vertex AI variables. Full table in [`../reference/environment.md`](../reference/environment.md).

> ⚠️ **Never commit `.env` to git**. It is already listed in `.gitignore` — verify.

## 3. Verify boot

```bash
./gradlew run
```

Success signal:

```
[main] INFO  Application - Responding at http://0.0.0.0:8080
```

Live check:

```bash
curl http://localhost:8080/api/v2/languages | jq .
```

An HTTP 200 with a JSON array of supported languages means the Perso key is live. If you get 401 / 402 → [`troubleshooting.md#perso-402--payment-required`](./troubleshooting.md#perso-402--payment-required).

## 4. External exposure options

If you only use it from emulators/simulators on the same machine, skip this step (`localhost:8080` or `10.0.2.2:8080`). To expose to a physical device or another computer, two common options:

### Option A — LAN exposure (home / office)

```bash
ipconfig getifaddr en0    # macOS, Wi-Fi
# e.g. 192.168.1.42
```

Both iOS and Android physical devices must be on the same Wi-Fi. Set the mobile `BFF_BASE_URL` to `http://192.168.1.42:8080/`.

Also set `.env`'s `BFF_BASE_URL` to the same value — this value is embedded in signed download URLs. A signed URL handed out externally is useless if it points at `localhost`.

```dotenv
BFF_BASE_URL=http://192.168.1.42:8080
```

If a firewall blocks 8080 you'll see `connect timeout` — on macOS, System Settings → Network → Firewall, allow Java/Gradle or turn it off briefly. Details in [`connect-real-device.md`](./connect-real-device.md).

### Option B — ngrok (HTTPS, reachable anywhere)

```bash
ngrok http 8080
```

Copy the https URL from the `Forwarding https://<random>.ngrok-free.app -> http://localhost:8080` line.

```dotenv
# .env
BFF_BASE_URL=https://<random>.ngrok-free.app
```

```properties
# vibi-mobile/local.properties
BFF_BASE_URL=https://<random>.ngrok-free.app/
```

> ngrok's free tier rotates the URL every session. For a fixed URL, use an ngrok subdomain or a cloudflare tunnel.

> Side benefit: https means you can ignore iOS ATS workarounds (the `http://` in option A needs extra iOS-side configuration).

### Option C — Cloud Run + GitHub Actions (production)

The repo ships with everything needed to run the BFF on Google Cloud Run, fronted by a fixed HTTPS URL and redeployed on `main` push:

- `Dockerfile` — multi-stage JDK21 → JRE21 + ffmpeg, `MaxRAMPercentage=75`.
- `.dockerignore` / `.gcloudignore` — keep secrets and caches out of the build context.
- `deploy/cloud-run.sh` — idempotent bootstrap (enables APIs, creates the runtime service account, loads `.env` into Secret Manager, runs the first `gcloud run deploy`).
- `.github/workflows/deploy.yml` — main-branch push triggers a Workload Identity Federation login and `gcloud run deploy --source .`. No service account JSON stored in GitHub. The runtime SA, env vars, secrets, and resource spec are declared inline so each deploy re-wires them; the GitHub UI is the single source of truth for env updates.

Quickstart:

```bash
# 1. First-time bootstrap from your laptop (creates the SA + secrets + first Cloud Run revision)
cd vibi-bff
./deploy/cloud-run.sh

# 2. One-time WIF setup so GitHub Actions can deploy without a JSON key
# Follow deploy/GITHUB_ACTIONS_SETUP.md (workload-identity-pools create + provider + SA binding)

# 3. Configure GitHub Settings → Secrets and variables → Actions
```

What goes where (Settings → Secrets and variables → Actions):

| Type | Key | Source / purpose |
|---|---|---|
| **Secret** | `GCP_WIF_PROVIDER` | Output of step 2 — the WIF provider resource path. |
| **Secret** | `GCP_SA_EMAIL` | Deploy-time SA (allowed to `gcloud run deploy`). |
| **Secret** | `GCP_PROJECT_ID` | Cloud Run hosting project. |
| **Secret** | `GCP_RUNTIME_SA_EMAIL` | Runtime SA attached to the Cloud Run service (this is the identity `GeminiClient` ADC resolves to). |
| **Secret** | `GOOGLE_OAUTH_CLIENT_IDS` | Comma-separated iOS / Android / Web client ids. |
| **Variable** | `CORS_ALLOWED_ORIGINS` | Plain comma list — visible in workflow logs intentionally. |
| **Variable** | `BFF_BASE_URL` | Optional. Set when you own a custom domain (`https://api.example.com`); leave blank to self-reference the Cloud Run-issued URL. |
| **Variable** | `R2_BUCKET`, `R2_ACCOUNT_ID` | Optional. When `R2_BUCKET` is set, big render / separation outputs 302-redirect to a Cloudflare R2 SigV4 presigned URL — **R2 egress is free**, so this decouples Cloud Run egress *and* zeros out its cost. `R2_ACCOUNT_ID` is the 32-char hex from the Cloudflare dashboard URL. |
| **Secret Manager** | `PERSO_API_KEY`, `PERSO_SPACE_SEQ`, `AUTH_JWT_SECRET`, `SEPARATION_SIGNING_SECRET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | Created by `deploy/cloud-run.sh` from your `.env`. The workflow mounts them via `--set-secrets`. R2 credentials are an API token (Object Read & Write) issued in the Cloudflare dashboard. |

After that, `git push origin main` ships a new revision. Two things worth flagging on first read of `deploy.yml`:

- **`^@^` delimiter** — `--set-env-vars` uses `^@^` as the entry separator instead of the default `,`, because `GOOGLE_OAUTH_CLIENT_IDS` itself contains commas. Switching the delimiter to `@` lets the comma-bearing value stay inline.
- **Cross-project `GEMINI_PROJECT_ID`** — the project Vertex AI is enabled in can differ from the Cloud Run hosting project. The workflow's `env:` block keeps `GEMINI_PROJECT_ID` separate from `GCP_PROJECT_ID` for exactly this case.

The runtime credential is the Cloud Run **attached service account** (`GCP_RUNTIME_SA_EMAIL`) — `GOOGLE_APPLICATION_CREDENTIALS` stays blank and `GeminiClient` falls back to Application Default Credentials via the metadata server. Memory-tier vs upload-size: scale `MAX_UPLOAD_FILE_SIZE_MB` down when running on `--memory 1Gi`, up on `4Gi+`.

The full walkthrough — WIF bootstrap commands, IAM roles per secret, R2 bucket creation + API token in the Cloudflare dashboard, and a table mapping five common errors (`invalid_target`, `unauthorized_client`, `iam.serviceAccounts.getAccessToken denied`, `run deploy: Permission denied`, 500 only on `/download` after a successful deploy) to their root cause — lives in `vibi-bff/deploy/GITHUB_ACTIONS_SETUP.md`.

> **Lifecycle / retention.** R2 lifecycle rules are managed in the Cloudflare dashboard (Settings → Object lifecycle rules), not in `deploy/cloud-run.sh`. The repo ships `vibi-bff/deploy/r2-lifecycle.json` with a 7-day expire rule — apply via dashboard or `aws s3api put-bucket-lifecycle-configuration` with the R2 endpoint override.

## 5. Wire up mobile

```properties
# vibi-mobile/local.properties
sdk.dir=/Users/<you>/Library/Android/sdk
BFF_BASE_URL=http://192.168.1.42:8080/   # or the ngrok https URL
```

After changing the value, **a rebuild is required**:

```bash
cd vibi-mobile
./gradlew :cmp:assembleDebug --no-configuration-cache
```

For iOS, Clean Build Folder in Xcode and then Run.

## 6. Verify

Launch the app → upload a video → drag a range and tap **"이 구간 음원분리"**.

You should see lines like this in the BFF console:

```
[POST] /api/v2/separate
[GET]  /api/v2/separate/sep-...
[GET]  /api/v2/separate/sep-.../stem/voice_all
```

If this is the first call from a physical device or a different computer, note that per-user Perso workspace usage counts against the BFF's `PERSO_API_KEY` quota.

---

## Common pitfalls

| Symptom | Where to go |
|---|---|
| Key validation fails on BFF boot | [`troubleshooting.md#perso_api_key-must-not-be-blank-on-boot`](./troubleshooting.md#perso_api_key-must-not-be-blank-on-boot) |
| connect timeout from mobile | [`connect-real-device.md`](./connect-real-device.md) |
| iOS rejects cleartext http | [`connect-real-device.md#ios-ats`](./connect-real-device.md) |
| Perso 402 | [`troubleshooting.md#perso-402--payment-required`](./troubleshooting.md#perso-402--payment-required) |

## See also

- Background on the flow decisions: [`../explanation/why-bff.md`](../explanation/why-bff.md)
- Full environment variable set: [`../reference/environment.md`](../reference/environment.md)
- BFF README: `vibi-bff/README.md` (this doc takes the mobile / external-exposure angle; the README takes the BFF's own angle)
- Cloud Run deploy details: `vibi-bff/deploy/GITHUB_ACTIONS_SETUP.md` (referenced from Option C above)
