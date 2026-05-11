# Troubleshooting — common build / runtime pitfalls

Each entry: **symptom → cause → fix**. Environment-specific differences are split out into tables.

Contents:

- [`PERSO_API_KEY must not be blank` on boot](#perso_api_key-must-not-be-blank-on-boot)
- [`SEPARATION_SIGNING_SECRET must be at least 32 chars` on boot](#separation_signing_secret-must-be-at-least-32-chars-on-boot)
- [Gradle: `Configuration cache problems found`](#gradle-configuration-cache-problems-found)
- [iOS: framework embed fails / `Module 'shared' not found`](#ios-framework-embed-fails--module-shared-not-found)
- [Room migration conflict / crash on first app launch](#room-migration-conflict--crash-on-first-app-launch)
- [`IOException: ... storage/uploads ...` on first BFF upload](#ioexception--storageuploads--on-first-bff-upload)
- [`ffprobe`/`ffmpeg` missing](#ffprobeffmpeg-missing)
- [500 error when multipart exceeds 50MB](#500-error-when-multipart-exceeds-50mb)
- [Perso transient 5xx (`F5001 INTERNAL_SERVER_ERROR`)](#perso-transient-5xx-f5001-internal_server_error)
- [Perso 402 — Payment Required](#perso-402--payment-required)
- [stem download 403](#stem-download-403)
- [BFF connect timeout from mobile](#bff-connect-timeout-from-mobile)

---

## `PERSO_API_KEY must not be blank` on boot

**Symptom**: stack trace and exit immediately after `./gradlew run`, with the message `PERSO_API_KEY must not be blank`.

**Cause**: The key is missing from `vibi-bff/.env` or the system env. `AppConfig.kt` fails fast at boot.

**Fix**: After `cp .env.example .env`, fill in `PERSO_API_KEY` and `PERSO_SPACE_SEQ`. Details in [`../reference/environment.md`](../reference/environment.md).

---

## `SEPARATION_SIGNING_SECRET must be at least 32 chars` on boot

**Symptom**: Boot fails with a message containing `got N`.

**Cause**: The HMAC signing key is shorter than 32 chars. Likely the `.env.example` placeholder was left in place.

**Fix**:
```bash
openssl rand -hex 32
```
Paste the output into `SEPARATION_SIGNING_SECRET` in `.env`. The same pattern applies to `AUTH_JWT_SECRET`.

---

## Gradle: `Configuration cache problems found`

**Symptom**: `./gradlew :shared:build` or `:cmp:assembleDebug` fails with a cache-related error.

**Cause**: Some KMP tasks are incompatible with Gradle's configuration cache. `vibi-mobile/gradle.properties` sets `org.gradle.configuration-cache=true`, so it is on by default.

**Fix**: Append `--no-configuration-cache` to the command.

```bash
./gradlew :shared:build :cmp:assembleDebug --no-configuration-cache
./gradlew :shared:compileKotlinIosSimulatorArm64 --no-configuration-cache
```

For frequently used commands, an alias is convenient.

---

## iOS: framework embed fails / `Module 'shared' not found`

**Symptom**:
- Xcode build fails with `No such module 'shared'`
- Or `Build input file cannot be found: '.../shared.framework/...'`
- The above happens right after editing `project.yml`

**Cause**: `iosApp/iosApp.xcodeproj` is generated from XcodeGen's `project.yml`. When `project.yml` changes, `.xcodeproj` must be regenerated.

**Fix**:
```bash
cd vibi-mobile/iosApp
xcodegen generate
```
Then in Xcode, Clean Build Folder (`⌘ ⇧ K`) and Run again.

If the framework itself is missing, verify the prebuild script runs:
```bash
cd vibi-mobile
./gradlew :shared:embedAndSignAppleFrameworkForXcode --no-configuration-cache
```

---

## Room migration conflict / crash on first app launch

**Symptom**: Immediate crash on first launch or after an update. Logs show `IllegalStateException: Migration didn't properly handle ...` or `A migration from N to M was required but not found`.

**Cause**: A DB with an older schema remains on the local device, and the code-side Migration list does not cover the path from that version.

**Fix** (during development):
- Android emulator: `adb uninstall com.vibi.cmp`, or clear app data
- iOS simulator: long-press the vibi app on the simulator → Delete App
- After reinstall, it starts from a fresh schema

For a production scenario, first confirm that `MigrationsTest` and `Migration7To8Test` under `:shared:testDebugUnitTest` pass.

---

## `IOException: ... storage/uploads ...` on first BFF upload

**Symptom**: BFF boots fine but the first multipart upload returns 500 with `NoSuchFileException` in the logs.

**Cause**: The `STORAGE_PATH` directory (default `./storage`) does not exist.

**Fix**: Create it before starting the BFF.

```bash
cd vibi-bff
mkdir -p storage/{uploads,render,separation}
```

Or point `STORAGE_PATH` to an absolute path that already exists.

---

## `ffprobe`/`ffmpeg` missing

**Symptom**:
- Render jobs go to `FAILED` immediately with `ffmpeg exited with code 127` (command not found)
- Or `500 ffmpeg_error` during separation trimming
- Or boot succeeds but every media operation fails

**Cause**: `ffmpeg` / `ffprobe` are not on the BFF's `PATH`. Child processes spawned by Gradle inherit the same PATH.

**Fix**:

| Environment | Install |
|---|---|
| macOS | `brew install ffmpeg` |
| Linux (Debian/Ubuntu) | `sudo apt install ffmpeg` |
| Windows | `choco install ffmpeg` or [ffmpeg.org](https://ffmpeg.org) |

After installing, in the same shell:
```bash
ffmpeg -version
ffprobe -version
```
Both must print output.

---

## 500 error when multipart exceeds 50MB

**Symptom**: Uploading a large video (50MB+) hits BFF with `IOException: Multipart content length exceeds limit ... > 52428800` followed by 500.

**Cause**: Ktor 3.x's `receiveMultipart()` defaults `formFieldLimit` to 50MB.

**Fix** (when BFF code edits are needed): For new multipart routes, pass `call.receiveMultipart(formFieldLimit = MAX_*_FILE_SIZE)` explicitly. Existing routes already do this (`SubtitleRoutes`, `AutoDubRoutes`, `SeparationRoutes`, `RenderRoutes`).

---

## Perso transient 5xx (`F5001 INTERNAL_SERVER_ERROR`)

**Symptom**: `submitTranslate` / `registerMedia` and similar requests occasionally fail with 500. Retrying succeeds.

**Cause**: A transient Perso-side incident.

**Fix**: Inside the BFF's `PersoClient` methods, retry only 5xx with a short backoff (3s × 3 attempts). 4xx throws immediately. Already applied to `registerMedia` — apply the same pattern to other methods that show the same symptom.

---

## Perso 402 — Payment Required

**Symptom**: BFF responds `402 { "error": "Insufficient Perso quota" }`.

**Cause**: The Perso workspace quota is exhausted.

**Fix**: Check and top up the quota in the Perso console. Mapping table in [`../reference/error-contract.md`](../reference/error-contract.md).

---

## stem download 403

**Symptom**: `GET /api/v2/separate/{jobId}/stem/{stemId}?token=…` initially returns 200, but turns to 403 after a while.

**Cause**: The stem URL's HMAC token expired. Lifetime is `SEPARATION_URL_TTL_SEC` (default 1800s).

**Fix**: Call `GET /api/v2/separate/{jobId}` again to receive fresh signed URLs and use those.

---

## BFF connect timeout from mobile

**Symptom**: Every screen that calls BFF times out and errors.

**Cause**: `BFF_BASE_URL` is unreachable from that target.

**Fix** — by target:

| Target | `BFF_BASE_URL` |
|---|---|
| Android emulator | `http://10.0.2.2:8080/` |
| iOS simulator | `http://localhost:8080/` |
| Physical device (Android / iOS) | Mac LAN IP — details in [`connect-real-device.md`](./connect-real-device.md) |

After changing `local.properties`, **the app must be rebuilt** (`BFF_BASE_URL` is injected via BuildConfig and resolved at compile time).
