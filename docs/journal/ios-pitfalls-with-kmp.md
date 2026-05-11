# KMP/iOS pitfall journal — five patterns hit twice

[`docs/explanation/why-kmp.md`](../explanation/why-kmp.md) covers why we picked KMP/CMP, but the *cost* of that decision is worth writing down separately. These are the iOS-side patterns we hit more than once — patternized in the "Known iOS bug patterns" section of `vibi-mobile/shared/CLAUDE.md`.

This note expands those five back out into narratives. So that someone starting from the same spot only has to hit them once.

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

## Pitfall 5 — `AVMutableComposition` track missing `preferredTransform`

**Symptom**: after adjusting the speed of split segments (= rebuilding a multi-segment composition), video appears sideways or flipped upside down.

**Cause**: iOS cameras always record raw frames in landscape and store the rotation info as metadata in `AVAssetTrack.preferredTransform`. AVMutableCompositionTrack defaults to identity transform, so the source's transform isn't carried over automatically.

The SingleItem path (direct AVURLAsset) works fine because AVPlayer *automatically applies* the asset's transform — simple playback without splitting doesn't show the problem. It only surfaces *when assembled via composition*.

**Solution**:

```kotlin
videoTrack.preferredTransform = srcVideo.preferredTransform
```

Split segments from the same sourceUri share the transform, so set it once. Applied in: `cmp/.../VideoPlayer.ios.kt`'s `buildCompositionPlayer`. Same when adding a new AVMutableComposition usage site.

**Observation**: the boundary of *which work iOS does automatically* blurs during KMP work — when working directly in Swift, you're reading documentation alongside and `preferredTransform`'s existence registers naturally; beyond the K/N cinterop, it can pass by unnoticed entirely.

## Looking at the five together

| | Commonality |
|---|---|
| 1, 2, 5 | iOS API *implicit behavior* (lazy load, automatic transform application, URL scheme assumptions) only surfaces as a problem beyond K/N |
| 3 | The limit that cinterop *isn't complete* — a design-level workaround |
| 4 | KMP itself (NSData ↔ ByteArray) pitfall. Unrelated to iOS APIs |

## The tool that keeps the same pitfall from being hit twice

The reason these five are *patternized* in the "Known iOS bug patterns" section of `vibi-mobile/shared/CLAUDE.md` is, when hitting the same pitfall again, not *shortening debugging time* but *skipping debugging altogether*. Reading that section before starting new K/N code means pitfall 5 won't be rebuilt.

The policy itself lives in [memory: feedback_known_bugs](../journal/operating-rules.md) — *recurring iOS/KMP bugs always get appended in that spot*.

## Related reading

- [`../explanation/why-kmp.md`](../explanation/why-kmp.md) — KMP tradeoff summary (this note's product-docs counterpart)
- [`operating-rules.md`](./operating-rules.md) — how the Known-bug logging policy formed
- `vibi-mobile/shared/CLAUDE.md` "Known iOS bug patterns" — the official pattern collection (source for this note)
