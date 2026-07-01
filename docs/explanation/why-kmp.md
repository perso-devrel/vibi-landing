# Why KMP/CMP

vibi's mobile client is a single codebase for Android and iOS — Kotlin Multiplatform (`:shared`) + Compose Multiplatform (`:cmp`). Only the iOS entry point (`iosApp/`) is Swift+XcodeGen.

This article explains the background of that decision — which options were on the table and the tradeoffs that led to choosing KMP/CMP.

---

## Candidate comparison

| | Native separately | Flutter | React Native | **KMP + CMP** |
|---|---|---|---|---|
| **Language** | Kotlin / Swift | Dart | TS/JS | Kotlin (both sides) |
| **UI code sharing** | 0% | 100% | 100% | 100% (`:cmp`) |
| **Logic sharing** | 0% | 100% | 100% | 100% (`:shared`) |
| **Platform API access** | immediate (per side) | platform channel + plugin | bridge + native module | `expect/actual` (immediate) |
| **AVPlayer / Media3 access** | immediate | plugin | RN module | direct via `expect/actual` |
| **Embedding ffmpeg** | direct | ffmpeg-kit Flutter wrap | RN module | direct on both sides (or delegated to BFF) |
| **iOS build artifact** | `.app` | `.app` | `.app` | `.framework` (KMP) → embedded by Xcode |
| **iOS DevTools** | Xcode | flutter doctor | Xcode + Metro | Xcode (Swift) + Android Studio (KMP) |
| **Staffing** | iOS and Android separately | needs Dart | RN/JS plus native skill on both sides | Kotlin only |

vibi's core work is voice/video processing — it constantly touches native media APIs like `AVPlayer` (iOS), `Media3` (Android), `PHPicker`, `AVURLAsset`. Smoothness in that interaction was weighted heavily.

---

## Why KMP/CMP won

### 1. Lowest friction against native media APIs

iOS's `AVPlayer` is just imported and used on the platform side of `expect/actual`. With Flutter, you always go through one layer of platform channel + plugin; with RN, one layer of bridge + native module + JS. For code that, like vibi's, touches every segment's `preferredTransform` · `loadValuesAsynchronously` · `AVMutableComposition`, the cost of that extra layer compounds.

vibi-mobile/shared's `iosMain/IosVideoMetadataExtractor.kt` is one example — it handles the `AVURLAsset` lazy loading pitfall directly (see the "AVAsset lazy loading" entry in `vibi-mobile/shared/CLAUDE.md`). Doing the same debugging across a plugin boundary would have taken days.

### 2. External APIs are REST, so no SDK dependency

Every external API vibi calls goes through **the BFF's `/api/v2`** ([`why-bff.md`](./why-bff.md)). So the mobile side just calls HTTP via Ktor Client, and there is zero vendor SDK dependency — the best-fit condition for KMP (when a vendor SDK supports only iOS/Android, that alone becomes the primary source of KMP friction).

### 3. Kotlin only — simple staffing

The Android team naturally also touches iOS. iOS-only engineers find Kotlin close to Swift, so the on-ramp is low. No need to add a separate language like Dart.

### 4. Easy to adopt incrementally

vibi had a legacy-android (Hilt + Retrofit + Room v19, Android-only) ahead of it. Moving the domain model · repositories · UseCases · ViewModels into `commonMain` and reimplementing UI in `:cmp` Compose Multiplatform was cheap to migrate — *because Compose code already existed*.

If it had been RN/Flutter, the same migration would have meant rewriting the domain from scratch.

---

## What is shared and what diverges

### Shared (`commonMain`)

- Domain model (`Segment`, `Stem`, `BgmClip`, `SeparationDirective`, `EditProject`, ...)
- Repository interfaces + implementations (Room v5 + BFF Ktor Client)
- UseCases (input · separation · timeline · text · bgm · image · save · draft · export)
- ViewModels (Koin)
- DI modules
- All UI (Compose Multiplatform — `:cmp/commonMain`)

### Platform divergence (`expect/actual` or platform adapter)

- `MediaPicker` — Android `PickVisualMedia`, iOS `PHPickerVC`
- `VideoPlayer` — Android `Media3 ExoPlayer`, iOS `AVPlayer`
- `VideoMetadataExtractor` — `MediaMetadataRetriever` vs `AVURLAsset`
- `GallerySaver` — `MediaStore` vs `PHPhotoLibrary`
- `GoogleSignInClient` / `AppleSignInClient` — Credential Manager + GoogleSignIn SPM vs `AuthenticationServices`
- `StemMixer` — Android ExoPlayer multi-instance vs iOS `AVAudioEngine` graph
- `ExportPlatformAdapter` — both platforms delegate the render to BFF `/api/v2/render` (legacy) or `/render/v3` (current asset-by-reference flow); the platform side handles input upload + gallery save
- `MediaJobUploader` — multipart upload of trimmed separation audio. Per-platform file handle differences (Android `Uri` + `ContentResolver` vs iOS `NSURL` + `NSData`).
- Time, UUID, and File system primitives

This divergence is explicit via KMP's `expect fun` / `expect class` — meaning the IDE can navigate which platform-specific code lives where. Different from the implicit divergence of plugins and bridges.

---

## Tradeoffs

KMP/CMP is not a free lunch.

### 1. iOS build depends on Xcode

On the iOS side, the KMP-produced `.framework` is embedded by Xcode — a two-stage build. CI needs a macOS runner, and `iosApp/iosApp.xcodeproj` is generated from XcodeGen `project.yml` (after editing `project.yml`, `xcodegen generate` is required). For iOS-only engineers, one stage more than Xcode alone.

### 2. CMP iOS overlay limitations

UIKit interop views (such as `VideoPlayer`) sit on the native layer and are always topmost — Compose cannot draw on top of them (see "Compose does not draw over CMP's UIKitView" in `vibi-mobile/shared/CLAUDE.md`). For text overlays on video, route around with a native UILabel, or place Compose Row/Column outside the video.

### 3. Some K/N audio APIs not exposed

In the ios_simulator_arm64 platform klib, audio setters like `AVPlayer.muted`, `AVPlayer.volume`, `AVPlayerItem.audioMix` come back as unresolved references. Workarounds:
- Receive a mux'd mp4 from the BFF and play it through a single AVPlayer (the current dub-preview pattern)
- Swift bridge — an `@objc class` on the iosApp side processes it and returns an `AVPlayerItem`

Cinterop workaround attempts hit walls every time — see the "K/N AVFoundation cinterop" entry in `vibi-mobile/shared/CLAUDE.md`.

### 4. Configuration cache incompatibility

`vibi-mobile/gradle.properties` has `org.gradle.configuration-cache=true` by default, but some KMP tasks are not compatible with the cache, and certain commands require `--no-configuration-cache`. Details in [`../how-to/troubleshooting.md#gradle-configuration-cache-problems-found`](../how-to/troubleshooting.md#gradle-configuration-cache-problems-found).

---

## What iOS-first means

vibi ships iOS first. New KMP features land in `iosMain` + `iosApp` first → `androidMain` follows as a stub or follow-up.

This justifies the KMP choice — iOS-first, but without maintaining a separate Android codebase. Going native-separately would have meant rewriting Android from scratch after an iOS-only launch.

---

## See also

- KMP module structure details: [`../../ARCHITECTURE.md`](https://github.com/perso-devrel/vibi/blob/main/ARCHITECTURE.md) § 2
- Known iOS pitfalls: see "Known iOS bug patterns" in `vibi-mobile/shared/CLAUDE.md` — narrative retrospective in [`../journal/ios-pitfalls-with-kmp.md`](../journal/ios-pitfalls-with-kmp.md)
- Build commands: [`../learning/getting-started.md`](../learning/getting-started.md)
