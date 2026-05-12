# KMP/iOS pitfall journal — patterns hit twice

[`docs/explanation/why-kmp.md`](../explanation/why-kmp.md) covers why we picked KMP/CMP, but the *cost* of that decision is worth writing down separately. These are the iOS-side patterns we hit more than once — patternized in `vibi-mobile/shared/.claude/skills/ios-kn-patterns.md` (extracted from the main `CLAUDE.md` once the list outgrew it).

This note expands them back out into narratives. So that someone starting from the same spot only has to hit them once.

## Pitfall 1 — `NSURL.URLWithString(absolutePath)` doesn't return nil

**Symptom**: `NSData.dataWithContentsOfURL`, `AVURLAsset.tracks`, `AVAsset.duration`, `AVPlayer` silently return nil/empty/0. No error is thrown. *Video won't display / metadata unreadable / multipart upload reports "cannot read source media".*

**Time to diagnosis**: double-digit hours. Without an error, there's no obvious place to start suspecting.

**Cause**: PHPicker returns paths without the `file://` scheme — absolute paths like (`/Users/.../Documents/...`). Kotlin/Native's `NSURL.URLWithString("/Users/...")` *doesn't return nil* as expected; it produces *an invalid URL object*. So the `?: NSURL.fileURLWithPath(uri)` fallback never fires.

**Solution pattern** (apply at every NSURL construction site):

```kotlin
val url = if (uri.startsWith("file://")) {
    NSURL.URLWithString(uri) ?: NSURL.fileURLWithPath(uri.removePrefix("file://"))
} else {
    NSURL.fileURLWithPath(uri)
}
```

Files where it's applied: `IosVideoMetadataExtractor`, `IosMediaJobUploader`, `cmp/.../VideoPlayer.ios.kt`. Apply the same pattern whenever a new NSURL usage site is added.

**Recurrence prevention**: pinned as the first item in the "Known iOS bug patterns" section of `vibi-mobile/shared/CLAUDE.md`, with a policy of reading that section before writing new K/N code ([memory: feedback_known_bugs](../journal/operating-rules.md)).

## Pitfall 2 — `AVAsset.duration` / `tracks` are lazy, so immediate access returns 0/empty

**Symptom**: `AVURLAsset(url).duration` gives `CMTimeGetSeconds = 0.0`. `tracksWithMediaType(...)` returns an empty list. The video is clearly there.

**Cause**: AVURLAsset's `duration`, `tracks` and friends are lazy. Calling them immediately means they aren't loaded yet.

**Solution — three steps**:

1. When creating the AVURLAsset, pass `mapOf(AVURLAssetPreferPreciseDurationAndTimingKey to true)`
2. Wait on `loadValuesAsynchronouslyForKeys(listOf("duration", "tracks"))` wrapped in `suspendCancellableCoroutine`, then use the values
3. If duration is still 0, fall back to `CMTimeRangeGetEnd` on `videoTrack.timeRange`

All three steps are needed because *where the 0 comes from* differs per case — at first only step 1 was applied but some videos still gave 0, step 2 was added, and occasionally even then 0 came back, so step 3 too.

**Observation**: the combination of lazy APIs and multiplatform makes *when something is evaluated* even hazier than usual. KMP's suspend bridge adds one more layer in between.

## Pitfall 3 — missing audio setters in K/N AVFoundation cinterop

**Symptom**: `AVPlayer.muted = true`, `AVPlayer.volume = 0f`, `AVPlayerItem.audioMix = mix`, `AVMutableAudioMix.inputParameters = ...` all unresolved reference.

**Cause**: audio-related setters aren't exposed in the ios_simulator_arm64 platform klib. A surface cinterop missed.

**Two workaround options** (in this order of preference):

1. **Receive an already-muxed mp4 from the BFF and play it with a single AVPlayer** — the current dubbing preview pattern. Most robust. The mobile side never needs to manipulate audio; the BFF pre-mixes via ffmpeg.
2. **Swift bridge** — an `@objc class` on the iosApp side handles AVMutableAudioMix and returns an `AVPlayerItem`, injected via protocol from K/N.

Don't try to work around it through cinterop — it dead-ends every time. Waste of time.

**Observation**: KMP's "direct access to iOS native APIs" runs into the limit that *cinterop's surface is incomplete*. 90% of APIs are well exposed, but when the missing 10% lands on a critical path, the design itself has to route around it. After hitting this pitfall, vibi added the design principle *audio manipulation happens in the BFF mux*.

## Pitfall 4 — `NSData → ByteArray` copy: using `allocArrayOf(bytes)` as the dest breaks everything

**Visible symptom**: after video upload, the BFF console shows `ffprobe: moov atom not found` / `Invalid data found when processing input` / a 71MB zero-filled file. Perso silently produces no result (404, F5001, "no stems available" and various other downstream errors).

**Time to diagnosis**: days. From the BFF, Perso seemed to be giving strange responses; from Perso, the video data seemed corrupt; from the client, "but the upload looks fine?" — the real cause sat somewhere between the two opposing views.

**Cause**: the commonly-used pattern

```kotlin
// wrong pattern
memScoped {
    val dest = allocArrayOf(bytes)   // ← creates a new native buffer pre-filled, returns its pointer
    memcpy(dest, src, len)
    // when memScoped ends, dest is freed; our ByteArray bytes stays zero
}
```

`allocArrayOf(bytes)` creates *a new native buffer pre-filled with bytes* and returns its pointer. memcpy uses that buffer as dest, but the buffer is freed when memScoped exits, and our ByteArray instance remains zero.

**Solution pattern**:

```kotlin
val bytes = ByteArray(length)
if (length > 0) {
    nsData.bytes?.let { src ->
        bytes.usePinned { pinned ->
            memcpy(pinned.addressOf(0), src, length.toULong())
        }
    }
}
```

Pin the ByteArray's address with `usePinned` and use that as memcpy's dest. Apply the same pattern whenever a new NSData ↔ ByteArray conversion site is added.

**Observation**: the *indirectness* of this pitfall made diagnosis hard — the client sent exactly 71MB, the server received exactly 71MB, those 71MB just happened to be all zeros. Every size, hash, and count looked normal. **Silent corruption is caught fastest by a single debug log line (`bytes.take(16).toList()`)** — a side-product lesson.

## Pitfall 5 — streaming AVPlayer is silent under K/N — download then AVAudioPlayer instead

**Symptom**: `AVPlayer(uRL=remoteUrl)` (or `replaceCurrentItemWithPlayerItem(item)`) followed by `play()` produces no sound. The player reports `rate=1.0`, `currentTime` advances normally — it just silently outputs nothing. KVC `setValue(NSNumber, forKey="volume")` doesn't help either.

**Cause**: The audio output graph wiring on streaming `AVPlayer` items silently fails to connect under K/N. Same family as pitfall 3 — the cinterop surface is incomplete, only this one shows up at *runtime* rather than at compile time.

**Solution pattern** — switch the entire remote audio playback path to "download to a temp file, then play with AVAudioPlayer":

1. On a background coroutine (`Dispatchers.Default`), call `NSData.dataWithContentsOfURL` to fetch the bytes. **Not** on the main thread — iOS prints `Synchronous URL loading should not occur on this application's main thread` and may silently fail.
2. Write to the caches dir with the **original file extension preserved** (`.flac`/`.wav`/`.mp3`). Format inference inside AVAudioPlayer is more stable from the file extension than from the byte stream.
3. Back on the main thread, init `AVAudioPlayer(contentsOfURL=fileUrl, error=null)` and call `play()`. Use the file-URL initializer, not `AVAudioPlayer(data=)` — file mode is more robust at format detection.
4. On release / re-play, clean up the temp file.

Applied in `cmp/.../platform/AudioPreviewer.ios.kt` (single-stem preview) and `StemMixer.ios.kt` (multi-stem concurrent playback for separation directives). Multi-stem in particular relies on prepared `AVAudioPlayer`s pooled by `groupId` so that switching between separation ranges is instant — none of which would work if the streaming path actually played sound.

**Observation**: pitfall 3 was a *compile-time* missing setter; this is a *runtime* missing wiring with no error. The combined effect of those two is that vibi treats the BFF as the audio truth — anything that needs muxing or per-stem manipulation happens server-side, and the iOS client just downloads finished files.

## Pitfall 6 — path-only URLs make it to the iOS player; prepend BFF base URL there too

**Symptom**: An iOS player call fails with `NSURLConnection error -1002 (badURL)`. The URL it received looks like `/api/v2/separate/.../stem/...?token=...` — a server-relative path that should have been resolved to `https://your-bff/api/v2/...` before reaching the OS.

**Cause**: A path-only URL leaked through some path that should have prefixed the BFF base — either a stale ViewModel state cache, a KMP framework build cache pinning an older repository binding, or a code path that bypassed the centralized resolver. `NSURL.URLWithString("/api/v2/...")` happily returns a URL object without a host (just as in pitfall 1).

**Solution pattern**: defense in depth. The repository layer prepends `bffBaseUrl` whenever it returns a stem URL to the UI — that's the primary fix. **And** the iOS player itself has a self-contained safety net: it reads `BFFBaseURL` from `NSBundle.mainBundle.objectForInfoDictionaryKey` (the value `Auth.xcconfig` substitutes into `Info.plist`) and prepends it to any URL that lacks a scheme. The repository and the player don't need to be in sync — both can ship correctly on their own.

Applied in `cmp/.../platform/AudioPreviewer.ios.kt`, `StemMixer.ios.kt` — see `resolveAbsoluteAudioUrl`.

**Observation**: this is a "two seatbelts" pattern. Either layer alone is sufficient most of the time; together they survive cache eviction lag and the build-time framework re-embed.

## Pitfall 7 — `AVMutableComposition` track missing `preferredTransform`

**Symptom**: after adjusting the speed of split segments (= rebuilding a multi-segment composition), video appears sideways or flipped upside down.

**Cause**: iOS cameras always record raw frames in landscape and store the rotation info as metadata in `AVAssetTrack.preferredTransform`. AVMutableCompositionTrack defaults to identity transform, so the source's transform isn't carried over automatically.

The SingleItem path (direct AVURLAsset) works fine because AVPlayer *automatically applies* the asset's transform — simple playback without splitting doesn't show the problem. It only surfaces *when assembled via composition*.

**Solution**:

```kotlin
videoTrack.preferredTransform = srcVideo.preferredTransform
```

Split segments from the same sourceUri share the transform, so set it once. Applied in: `cmp/.../VideoPlayer.ios.kt`'s `buildCompositionPlayer`. Same when adding a new AVMutableComposition usage site.

**Observation**: the boundary of *which work iOS does automatically* blurs during KMP work — when working directly in Swift, you're reading documentation alongside and `preferredTransform`'s existence registers naturally; beyond the K/N cinterop, it can pass by unnoticed entirely.

## Looking at them together

| | Commonality |
|---|---|
| 1, 2, 7 | iOS API *implicit behavior* (lazy load, automatic transform application, URL scheme assumptions) only surfaces as a problem beyond K/N |
| 3, 5 | The cinterop surface *isn't complete* — compile-time gap (3) and runtime gap (5). Both force a design-level workaround |
| 4 | KMP itself (NSData ↔ ByteArray) pitfall. Unrelated to iOS APIs |
| 6 | Defense-in-depth as the response when a value can leak past one layer |

## The tool that keeps the same pitfall from being hit twice

The reason these are *patternized* in `vibi-mobile/shared/.claude/skills/ios-kn-patterns.md` is, when hitting the same pitfall again, not *shortening debugging time* but *skipping debugging altogether*. Reading that section before starting new K/N code means pitfall 7 won't be rebuilt.

The policy itself lives in [memory: feedback_known_bugs](../journal/operating-rules.md) — *recurring iOS/KMP bugs always get appended in that spot*.

## Related reading

- [`../explanation/why-kmp.md`](../explanation/why-kmp.md) — KMP tradeoff summary (this note's product-docs counterpart)
- [`operating-rules.md`](./operating-rules.md) — how the Known-bug logging policy formed
- `vibi-mobile/shared/.claude/skills/ios-kn-patterns.md` — the official pattern collection (source for this note)
