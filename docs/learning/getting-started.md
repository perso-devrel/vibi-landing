# Getting started

The goal of this doc is to take you from a fresh checkout of vibi to **BFF + mobile app talking to each other and showing the first screen** in under 30 minutes. If you get stuck, jump to [`../how-to/faq.md`](../how-to/faq.md).

> This doc assumes macOS. Windows differences are noted inline per step.

## 0. Prerequisites

| Tool | Purpose | Check |
|---|---|---|
| **JDK 21** | BFF + KMP build | `java -version` |
| **Xcode 15+** | iOS build | `xcodebuild -version` |
| **Android Studio (or Android SDK)** | Android build | `$ANDROID_HOME` set |
| **XcodeGen** | Regenerate the iOS project | `brew install xcodegen` |
| **ffmpeg / ffprobe** | BFF render pipeline | `ffmpeg -version`, `ffprobe -version` |
| **Perso AI key + spaceSeq** | BFF calls the external API | Issued at [perso.ai](https://perso.ai) |
| *(optional)* GCP service account | Gemini caption translation and chat | Project with Vertex AI enabled |

Sign up for Perso → create a workspace → issue the API key and note the `spaceSeq`. You can look up `spaceSeq` via `GET /portal/api/v1/spaces`.

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
```

`SEPARATION_SIGNING_SECRET` is required to be at least 32 characters. Generate one with:

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

Open in a browser to verify:

- <http://localhost:8080/swagger> — API spec UI
- <http://localhost:8080/api/v2/languages> — The first live endpoint that actually calls Perso. If healthy, it returns a language list JSON. A 401/402 means the key or spaceSeq is wrong.

> 🚧 If blocked: `PERSO_API_KEY must be set` / `SEPARATION_SIGNING_SECRET must be at least 32 chars` → [`../how-to/faq.md`](../how-to/faq.md).

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

`--no-configuration-cache` is required because some KMP tasks are not compatible with the configuration cache. For the detailed reason see [`../how-to/faq.md#gradle-configuration-cache`](../how-to/faq.md).

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

### 4-2. Run from Xcode

```bash
cd iosApp
xcodegen generate     # project.yml → creates/refreshes iosApp.xcodeproj
open iosApp.xcodeproj
```

Pick a simulator in Xcode → Run. The `preBuildScripts` hook invokes `:shared:embedAndSignAppleFrameworkForXcode` automatically.

On the iOS simulator, `BFF_BASE_URL=http://localhost:8080/` is the simplest setup. Make sure that's what you wrote in `local.properties` (easy to confuse with the Android emulator's `10.0.2.2`).

## 5. First screen

When the app launches you'll see InputScreen. Pick a short video (10–30s recommended) from the gallery and upload it:

1. Metadata (duration, resolution) is extracted locally — this step does not call the BFF.
2. The app moves to the timeline screen.

At this point the **first real call to the BFF** happens when you trigger one of captions, auto dubbing, or stem separation. Running auto captions once is the fastest finish — for the detailed flow see [`tutorial-auto-dub.md`](./tutorial-auto-dub.md).

## Success checklist

- [ ] BFF console prints `Responding at http://0.0.0.0:8080`
- [ ] <http://localhost:8080/api/v2/languages> returns HTTP 200 with a JSON body
- [ ] Android: `adb install` succeeds, and InputScreen opens in the emulator
- [ ] iOS: InputScreen opens in the simulator
- [ ] Upload a short video → reach the timeline screen

If you got here, **your dev environment is set up**. Next:

- Want to follow the real auto dubbing flow → [`tutorial-auto-dub.md`](./tutorial-auto-dub.md)
- Want to expose a BFF you spun up with your own Perso key to other devices → [`../how-to/deploy-your-own-bff.md`](../how-to/deploy-your-own-bff.md)
- What external API calls the BFF intercepts, and why → [`../explanation/why-bff.md`](../explanation/why-bff.md)
