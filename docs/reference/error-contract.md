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
| `IllegalArgumentException` | 400 | `cause.message` | DTO validation via `require(...)` failure — most validation today flows through this path (free-form messages) |
| `ApiErrorException` | (specified) | `errorCode` + `detail` | Structured validation failure with a stable machine code — see the catalog below |
| `PersoApiException` (401) | 401 | `Authentication failed with Perso` | Upstream 401 |
| `PersoApiException` (402) | 402 | `Insufficient Perso quota` | Upstream 402 (workspace limit) |
| `PersoApiException` (429) | 429 | `Perso rate limit exceeded, please try again later` | Upstream 429 |
| `PersoApiException` (4xx) | 400 | `Invalid request to Perso` | Upstream 4xx |
| `PersoApiException` (5xx) | 502 | `Perso service unavailable` | Upstream 5xx |
| Other `Throwable` | 500 | `Internal server error` | Unhandled exception |
| Client disconnect | (no response) | — | `ChannelWriteException`, `Broken pipe`, etc. are logged at DEBUG only |

> The sanitize convention (`34b7002 fix(security)`) keeps raw upstream messages out of the `detail` field — Perso wording is mapped only by status code, and IAP verifier reasons collapse to a single `receipt_invalid` regardless of the underlying cause (refund vs wrong productId vs replay). Specifics live in BFF logs.

---

## Structured error codes (`ApiErrorException`)

Cases where the `error` field is a machine code rather than a human-readable sentence — clients can branch on the `error` value.

### Credits / IAP — `/api/v2/credits/*`

| `error` | HTTP | Origin | Notes |
|---|:-:|---|---|
| `missing_duration_ms` | 400 | `GET /credits/cost` | `durationMs` query param missing or non-numeric |
| `duration_ms_negative` | 400 | `GET /credits/cost` | `durationMs < 0` |
| `insufficient_credits` | 402 | `POST /separate` | Balance below the separation cost quote |
| `invalid_platform` | 400 | `POST /credits/purchase` | `platform` not in `{"apple","google"}` |
| `missing_receipt` | 400 | `POST /credits/purchase` | `transactionId` or `receipt` blank |
| `unknown_product` | 400 | `POST /credits/{purchase,admin-grant}` | `productId` not in `CreditCatalog` |
| `iap_unconfigured` | 400 | `POST /credits/purchase` | Platform-side IAP verifier env (`IAP_APPLE_*` / `IAP_GOOGLE_*`) is blank |
| `receipt_invalid` | 400 | `POST /credits/purchase` | Upstream verification failed (sanitized — internal reason in BFF logs only) |
| `receipt_verify_unavailable` | 502 | `POST /credits/purchase` | Apple/Google upstream transient error. Safe to retry with the same `transactionId`. |

### Render — `/api/v2/render*`

| `error` | HTTP | Origin | Notes |
|---|:-:|---|---|
| `invalid_stem_url` | 400 | `POST /render` | A `separationDirectives[*].selections[].audioUrl` is not a BFF-signed `/separate/.../stem/` URL |
| `r2_disabled` | 503 | `POST /assets/upload-url`, `POST /render/v3` (when an asset requires R2) | `R2_BUCKET` not configured; v3 path is unavailable |

### Separation — `/api/v2/separate*`

| `error` | HTTP | Origin | Notes |
|---|:-:|---|---|
| `unsupported_audio_format` | 400 | `POST /separate` | File extension / codec not in `{m4a, mp3, wav}` whitelist (e.g. `flac`, video file, `ogg`) |
| `insufficient_credits` | 402 | `POST /separate` | (Same code as above — credits are charged inside the route) |

> Earlier doc revisions listed a `trim_*` family (`partial_trim_range`, `trim_start_negative`, `trim_range_invalid`, `trim_range_too_short`, `trim_end_exceeds_duration`) and an `ffmpeg_error` code. None of these are thrown today — the `/separate` contract was simplified to audio-only and the mobile client does trim + audio extract itself, so the BFF no longer validates trim windows. If you need to branch on validation failures from this route, use the HTTP status (400 from `IllegalArgumentException`) and the free-form `error` message.

---

## Client handling patterns

### Basic try/catch

```kotlin
import io.ktor.client.plugins.ResponseException

try {
    val resp = bffApi.startSeparation(file = part, spec = spec)
} catch (e: ResponseException) {
    val status = e.response.status            // 402, 429, 502, ...
    val body   = e.response.body<ErrorResponse>()
    when (status.value) {
        402 -> showQuotaOrCreditDialog(body.error)   // insufficient_credits vs Perso 402
        429 -> retryWithBackoff()
        502 -> showServiceUnavailableSnack()
        else -> showGenericError(body.error)
    }
}
```

### Machine-code branching (credits + audio format)

```kotlin
catch (e: ResponseException) {
    val body = e.response.body<ErrorResponse>()
    when (body.error) {
        "insufficient_credits"       -> openCreditPurchaseSheet()
        "unsupported_audio_format"   -> showError("Pick an m4a / mp3 / wav file")
        "receipt_verify_unavailable" -> retryWithBackoff()           // 502, safe retry
        "iap_unconfigured"           -> hidePurchaseButton()         // dev/test build
        else                         -> showGenericError(body.error)
    }
}
```

### Token expiry (stem downloads)

When the `?token=…` for stem downloads expires, the fetch fails with 401/403.

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
- Error codes emitted from routes: grep `ApiErrorException(` in `vibi-bff/src/main/kotlin/com/vibi/bff/routes/`
- Client: `vibi-mobile/shared/.../data/remote/api/BffApi.kt` (Ktor `expectSuccess = true`)
