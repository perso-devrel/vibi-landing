# Error Contract

Every error response from vibi-bff has a single wire shape:

```jsonc
// HTTP 4xx / 5xx
{
  "error": "<machine_readable_code_or_message>",
  "detail": "<optional_extra_context>"
}
```

Code: `vibi-bff/src/main/kotlin/com/vibi/bff/plugins/ErrorHandling.kt`. The mobile client runs Ktor with `expectSuccess = true`, so non-2xx responses automatically throw `ResponseException`.

---

## Mapping table

| Exception type | HTTP | `error` field | Trigger |
|---|:-:|---|---|
| `NotFoundException` | 404 | `cause.message` | Explicitly thrown by a route handler (e.g. `jobId not found`) |
| `IllegalArgumentException` | 400 | `cause.message` | DTO validation, `require(...)` failure |
| `ApiErrorException` | (specified) | `errorCode` + `detail` | Structured validation failure (e.g. `trim_end_exceeds_duration`) |
| `PersoApiException` (401) | 401 | `Authentication failed with Perso` | Upstream 401 |
| `PersoApiException` (402) | 402 | `Insufficient Perso quota` | Upstream 402 (workspace limit) |
| `PersoApiException` (429) | 429 | `Perso rate limit exceeded, please try again later` | Upstream 429 |
| `PersoApiException` (4xx) | 400 | `Invalid request to Perso` | Upstream 4xx |
| `PersoApiException` (5xx) | 502 | `Perso service unavailable` | Upstream 5xx |
| Other `Throwable` | 500 | `Internal server error` | Unhandled exception |
| Client disconnect | (no response) | — | `ChannelWriteException`, `Broken pipe`, etc. are logged at DEBUG only |

---

## Structured error codes (`ApiErrorException`)

Cases where the `error` field is a machine code rather than a human-readable sentence — clients can branch on the `error` value.

| `error` | HTTP | Origin | `detail` |
|---|:-:|---|---|
| `partial_trim_range` | 400 | `POST /api/v2/separate` | — |
| `trim_start_negative` | 400 | `POST /api/v2/separate` | — |
| `trim_range_invalid` | 400 | `POST /api/v2/separate` | — |
| `trim_range_too_short` | 400 | `POST /api/v2/separate` | — |
| `trim_end_exceeds_duration` | 400 | `POST /api/v2/separate` | `trimEndMs=… duration=…` |
| `ffmpeg_error` | 500 | `POST /api/v2/separate` trim stage | Tail of ffmpeg stderr |

> Why `500 ffmpeg_error` and not `501 Not Implemented`: the ffmpeg call *is* implemented and did execute, but failed. `501` semantically means "Not Implemented", which would be inaccurate.

---

## Client handling patterns

### Basic try/catch

```kotlin
import io.ktor.client.plugins.ResponseException

try {
    val res = bffApi.submitAutoDubJob(file = part, spec = spec)
} catch (e: ResponseException) {
    val status = e.response.status            // 402, 429, 502, ...
    val body   = e.response.body<ErrorResponse>()
    when (status.value) {
        402 -> showQuotaExhaustedDialog()
        429 -> retryWithBackoff()
        502 -> showServiceUnavailableSnack()
        else -> showGenericError(body.error)
    }
}
```

### Machine-code branching (separation trim)

```kotlin
catch (e: ResponseException) {
    val body = e.response.body<ErrorResponse>()
    when (body.error) {
        "trim_end_exceeds_duration" -> {
            // detail format: "trimEndMs=12345 duration=10000"
            val actualDuration = parseDuration(body.detail)
            promptUserToShortenRange(actualDuration)
        }
        "trim_range_too_short" -> showError("Select at least 500ms")
        else -> showGenericError(body.error)
    }
}
```

### Token expiry (separation / auto-dub / subtitle downloads)

When the `?token=…` for stem / mix / subtitle SRT / dubbing results expires, the download fails with 401/403.

```kotlin
suspend fun fetchStem(jobId: String, stemId: String): ByteArray = try {
    bffApi.downloadStem(currentSignedUrl)
} catch (e: ResponseException) when (e.response.status.value) {
    401, 403 -> {
        // Call status again to get a fresh token
        val fresh = bffApi.getSeparationStatus(jobId)
        val url = fresh.stems.first { it.stemId == stemId }.url
        bffApi.downloadStem(url)
    }
    else -> throw e
}
```

---

## Code references

- Handler: `vibi-bff/src/main/kotlin/com/vibi/bff/plugins/ErrorHandling.kt`
- Response DTO: `vibi-bff/.../model/BffModels.kt#ErrorResponse`
- Client: `vibi-mobile/shared/.../data/remote/api/BffApi.kt` (Ktor `expectSuccess = true`)
