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

An HTTP 200 with a JSON array of supported languages means the Perso key is live. If you get 401 / 402 → [`faq.md#perso-402--payment-required`](./faq.md).

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

Launch the app → upload a video → run auto-captions once.

You should see lines like this in the BFF console:

```
[POST] /api/v2/subtitles
[GET]  /api/v2/subtitles/sub-...
```

If this is the first call from a physical device or a different computer, note that per-user Perso workspace usage counts against the BFF's `PERSO_API_KEY` quota.

---

## Common pitfalls

| Symptom | Where to go |
|---|---|
| Key validation fails on BFF boot | [`faq.md#perso_api_key-must-not-be-blank-on-boot`](./faq.md#perso_api_key-must-not-be-blank-on-boot) |
| connect timeout from mobile | [`connect-real-device.md`](./connect-real-device.md) |
| iOS rejects cleartext http | [`connect-real-device.md#ios-ats`](./connect-real-device.md) |
| Perso 402 | [`faq.md#perso-402--payment-required`](./faq.md#perso-402--payment-required) |

## See also

- Background on the flow decisions: [`../explanation/why-bff.md`](../explanation/why-bff.md)
- Full environment variable set: [`../reference/environment.md`](../reference/environment.md)
- BFF README: `vibi-bff/README.md` (this doc takes the mobile / external-exposure angle; the README takes the BFF's own angle)
