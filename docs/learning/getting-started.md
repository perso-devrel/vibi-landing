# Getting started

The goal of this doc is to take you from a fresh checkout of vibi to **BFF + mobile app talking to each other and showing the first screen** in under 30 minutes. If you get stuck, jump to [`../how-to/troubleshooting.md`](../how-to/troubleshooting.md).

> This doc assumes macOS. Windows differences are noted inline per step.

## 0. Prerequisites

| Tool | Purpose | Check |
|---|---|---|
| **JDK 21** | BFF + KMP build | `java -version` |
| **Xcode 15+** | iOS build | `xcodebuild -version` |
| **Android Studio (or Android SDK)** | Android build | `$ANDROID_HOME` set |
| **XcodeGen** | Regenerate the iOS project | `brew install xcodegen` |
| **ffmpeg / ffprobe** | BFF render pipeline | `ffmpeg -version`, `ffprobe -version` |
| **Perso AI key + spaceSeq** | BFF calls the external API for audio separation | Issued at [perso.ai](https://perso.ai) |
| **Postgres** (Neon free tier OK) | BFF user upsert + JWT issuance | `DATABASE_URL`, `DB_USER`, `DB_PASSWORD` |
| **Google OAuth client IDs** | App sign-in is gated by Google | Cloud Console → APIs & Services → Credentials |
| *(optional)* Apple Sign In client id | iOS Sign in with Apple | iOS bundle id (e.g. `com.vibi.ios`) |
| *(optional)* Cloudflare R2 bucket | Egress-free download path | `R2_BUCKET` + `R2_ACCOUNT_ID` + R2 API token |

Sign up for Perso → create a workspace → issue the API key and note the `spaceSeq`. You can look up `spaceSeq` via `GET /portal/api/v1/spaces`.

For Google sign-in: in Google Cloud Console → APIs & Services → Credentials, create OAuth 2.0 Client IDs for **iOS**, **Android**, and **Web** under the same project. The BFF validates all three against `GOOGLE_OAUTH_CLIENT_IDS` (comma-separated). The iOS client ID is also referenced from the iOS app's `Auth.xcconfig` (step 4 below).

## 1. Clone the repos

```bash
git clone <vibi-mobile-repo-url> vibi-mobile
git clone <vibi-bff-repo-url>    vibi-bff
```

The recommended layout is these two directories sitting side by side as siblings (same shape as the workspace root `README.md`).

## 2. Spin up the BFF

### 2-1. Write `.env`

```bash
cd vibi-bff
cp .env.example .env
```

Values you **must fill in** in `.env`:

```dotenv
PERSO_API_KEY=<YOUR_PERSO_API_KEY>
PERSO_SPACE_SEQ=<YOUR_PERSO_SPACE_SEQ>
SEPARATION_SIGNING_SECRET=<random_string_32_chars_or_more>
AUTH_JWT_SECRET=<random_string_32_chars_or_more>
GOOGLE_OAUTH_CLIENT_IDS=<iOS, Android, Web client ids — comma-separated>
DATABASE_URL=jdbc:postgresql://<host>/<db>?sslmode=require
DB_USER=<role>
DB_PASSWORD=<password>
```

The two `*_SECRET` values must each be at least 32 characters. Generate them with:

```bash
openssl rand -hex 32
```

See [`../reference/environment.md`](../reference/environment.md) for the full env var table.

### 2-2. Run

```bash
./gradlew run
```

Success signal:

```
[main] INFO  Application - Application started in ... seconds.
[main] INFO  Application - Responding at http://0.0.0.0:8080
```

Verify it's up:

- `curl http://localhost:8080/healthz` returns `200` — the always-on readiness probe.
- The Swagger API-spec UI at <http://localhost:8080/swagger> is mounted **only if you set `ENABLE_SWAGGER=true`** in `.env` (it's off by default, even locally). Add it when you want to browse the spec.

> 🚧 If blocked: `PERSO_API_KEY must be set` / `SEPARATION_SIGNING_SECRET must be at least 32 chars` → [`../how-to/troubleshooting.md`](../how-to/troubleshooting.md).

## 3. Mobile build — Android (emulator)

### 3-1. Write `local.properties`

```bash
cd ../vibi-mobile
cat > local.properties <<'EOF'
sdk.dir=/Users/<you>/Library/Android/sdk
BFF_BASE_URL=http://10.0.2.2:8080/
EOF
```

`10.0.2.2` is the special IP that points back to the host Mac's `localhost` from inside an Android emulator. If you're going to use a physical device, jump to [`../how-to/connect-real-device.md`](../how-to/connect-real-device.md).

### 3-2. Build the APK

```bash
./gradlew :shared:build :cmp:assembleDebug --no-configuration-cache
```

`--no-configuration-cache` is required because some KMP tasks are not compatible with the configuration cache. For the detailed reason see [`../how-to/troubleshooting.md#gradle-configuration-cache-problems-found`](../how-to/troubleshooting.md#gradle-configuration-cache-problems-found).

The built APK lands at:

```
vibi-mobile/cmp/build/outputs/apk/debug/cmp-debug.apk
```

Install on the emulator:

```bash
adb install vibi-mobile/cmp/build/outputs/apk/debug/cmp-debug.apk
```

Or open `vibi-mobile/` in Android Studio and Run.

## 4. Mobile build — iOS (simulator)

### 4-1. Compile the shared framework

```bash
cd vibi-mobile
./gradlew :shared:compileKotlinIosSimulatorArm64 --no-configuration-cache
```

### 4-2. Write `Auth.xcconfig`

iOS doesn't share `local.properties` — the iOS-specific Google client id and the BFF URL are injected via an Xcode config file. Copy the template and fill it in:

```bash
cd vibi-mobile/iosApp/Configs
cp Auth.xcconfig.template Auth.xcconfig
```

The template:

```
GOOGLE_OAUTH_IOS_CLIENT_ID = REPLACE_BASE.apps.googleusercontent.com
GOOGLE_OAUTH_IOS_REVERSED_CLIENT_ID = com.googleusercontent.apps.REPLACE_BASE

URL_SLASH = /
BFF_BASE_URL = http:$(URL_SLASH)$(URL_SLASH)localhost:8080/
```

- The two `GOOGLE_OAUTH_IOS_*` values share the same base id — copy it from your iOS OAuth client. `Info.plist` substitutes `$(GOOGLE_OAUTH_IOS_CLIENT_ID)` into `GIDClientID` and the reversed id into `CFBundleURLTypes` (used for the OAuth callback).
- `BFF_BASE_URL` uses a `$(URL_SLASH)` indirection because xcconfig parsers treat `//` as a comment — without it, the slashes vanish.
- Substitute `localhost` with your Mac's LAN IP when running on a physical iPhone.

`Auth.xcconfig` is in `.gitignore` — never commit your real values.

### 4-3. Run from Xcode

```bash
cd vibi-mobile/iosApp
xcodegen generate     # project.yml → creates/refreshes iosApp.xcodeproj
open iosApp.xcodeproj
```

Pick a simulator in Xcode → Run. The `preBuildScripts` hook invokes `:shared:embedAndSignAppleFrameworkForXcode` automatically.

On the iOS simulator, `BFF_BASE_URL=http://localhost:8080/` is the simplest setup. Make sure that's what you wrote in both `local.properties` (Android side) and `Auth.xcconfig` (iOS side) — easy to confuse with the Android emulator's `10.0.2.2`.

## 5. Sign in

Navigation goes **Splash → Login → Input ↔ Timeline** (`vibi-mobile/cmp/.../navigation/VibiNavHost.kt`). On first launch:

1. Splash runs `AuthRepository.restoreSession()`. With no token cached, it routes to `LoginScreen`.
2. LoginScreen renders a "Sign in with Google" button.
   - **iOS**: `GoogleSignIn` SDK presents the OS sheet; a Swift bridge (`GoogleSignInBridge.swift`) hands the ID token back to K/N.
   - **Android**: Credential Manager presents the picker.
3. The app exchanges the ID token at `POST /api/v2/auth/google` → BFF validates `aud` against `GOOGLE_OAUTH_CLIENT_IDS` and returns its own JWT. The JWT is stored in `AuthTokenStore` and attached as `Authorization: Bearer` on every subsequent call.
4. On success, the app navigates to **InputScreen**.

On subsequent launches the JWT is restored from local storage; Login is skipped unless `/api/v2/auth/me` returns 401 (token expired or rotated).

> Common blocker: BFF returns 401 with `invalid_audience`. Cause: the iOS/Android client id you signed in with is not in `GOOGLE_OAUTH_CLIENT_IDS`. Fix on the BFF side — restart after editing `.env`.

## 6. First screen

InputScreen lists past drafts (per signed-in user — A and B don't see each other's projects) and offers a "new project" button. Pick a short video (10–30s recommended) from the gallery and upload it:

1. Metadata (duration, resolution) is extracted locally — this step does not call the BFF.
2. The app moves to the timeline screen.

At this point the **first real call to the BFF** happens when you trigger stem separation or save an export. Dragging a range and tapping **"이 구간 음원분리"** (Separate this range) is the fastest way to see a real Perso job complete — for the detailed flow see [`tutorial-stem-separation.md`](./tutorial-stem-separation.md).

> **Stem separation is gated by an in-app credit balance.** The details:
>
> - **Cost** — 1 credit per started 5 minutes of source, rounded up, minimum 1.
> - **Signup bonus** — the first sign-in auto-grants `SIGNUP_BONUS_CREDITS` (currently `3`), enough for short demo clips.
> - **Buying is off pre-launch** — the in-app purchase UI is hidden (the balance is shown, but the buy flow is gated off). With IAP keys unset (`IAP_APPLE_*` / `IAP_GOOGLE_*` blank in the BFF env), `/credits/purchase` returns `400 iap_unconfigured`.
> - **Topping up** — the practical path once the bonus runs out is the admin-only `POST /api/v2/credits/admin-grant`; grant yourself the admin role in the `users` table to use it. (The `/credits/purchase` receipt-verification endpoint stays live for when billing switches on.)

> Drafts are retained for 7 days (a small notice on InputScreen reminds you). Log out via the user avatar in the top-right corner of InputScreen → "Sign out" in the `UserMenuSheet`.

## Success checklist

- [ ] BFF console prints `Responding at http://0.0.0.0:8080`
- [ ] `curl http://localhost:8080/healthz` returns `200` (Swagger UI only if `ENABLE_SWAGGER=true`)
- [ ] Android: `adb install` succeeds, Splash opens, Login lets you sign in with Google, InputScreen follows
- [ ] iOS: same flow in the simulator (`Auth.xcconfig` filled in)
- [ ] Upload a short video → reach the timeline screen

If you got here, **your dev environment is set up**. Next:

- Walk through stem separation end-to-end → [`tutorial-stem-separation.md`](./tutorial-stem-separation.md)
- Export your edit through the v3 asset-by-reference flow → [`tutorial-export-variants.md`](./tutorial-export-variants.md)
- Want to expose a BFF you spun up with your own Perso key to other devices → [`../how-to/deploy-your-own-bff.md`](../how-to/deploy-your-own-bff.md)
- What external API calls the BFF intercepts, and why → [`../explanation/why-bff.md`](../explanation/why-bff.md)
