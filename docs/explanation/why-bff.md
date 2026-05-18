# Why a BFF Layer

vibi's mobile app does **not** call external voice APIs (Perso, Vertex AI Gemini) directly. Every external call goes through `vibi-bff`, a Ktor backend in the sibling directory. This article explains the background of that decision — what was gained, what was given up.

---

## Problem: API keys shipped inside a mobile app get extracted

The usual onboarding flow for a voice SaaS is "issue a key → call the SDK or REST directly." Doing that from mobile means embedding the key in the app bundle, which means anyone can extract it.

- An Android `apk` falls to plain `unzip` plus string extraction
- An iOS `ipa` is the same — Info.plist · embedded provisioning profile · binary strings
- Obfuscation and encryption eventually have to produce plaintext *at runtime* for the call to work, so a debugger or MITM still catches it

A leaked key means someone else's traffic eats the quota and the bill. For external voice APIs that meter and bill per workspace, the cost is especially direct.

---

## Solution: a BFF layer

```
┌────────────────┐     ┌─────────────┐     ┌────────────────┐
│ vibi-mobile    │HTTPS│ vibi-bff    │HTTPS│ Perso AI       │
│ (Android, iOS) │────▶│  /api/v2/*  │────▶│ Gemini         │
│   no API keys  │     │ holds keys  │     │ (external API) │
└────────────────┘     └─────────────┘     └────────────────┘
```

Mobile calls only **vibi-bff's `/api/v2`**. External keys exist only in the BFF's environment variables (`PERSO_API_KEY`, `GEMINI_*`). Not a single character of an external API key ships in the mobile build artifacts.

### What the BFF layer brings

1. **API key isolation** — the core motivation. Keys only in server env vars, zero in the mobile bundle.
2. **Unified error model** — each external API has a different error shape; the BFF normalizes them to a single `ErrorResponse(error, detail?)`. The client only has to write one error-handling path. The mapping lives in [`../reference/error-contract.md`](../reference/error-contract.md).
3. **Vendor abstraction** — if the upstream needs to change (different provider, dual-vendor failover), swap at the BFF layer *without rebuilding or redeploying mobile*. vibi currently runs a single-vendor Perso configuration, but the seam exists.
4. **Signed downloads** — stem · mix · dub artifacts are not statically mounted but signed with HMAC tokens. Rotating `SEPARATION_SIGNING_SECRET` once invalidates every unexpired token.
5. **Coalesced external calls** — when a single mobile action would otherwise fan out to multiple Perso endpoints (e.g. submit + poll + download + storage-host hop), the BFF executes that sequence inline and exposes a single typed job to mobile.
6. **Local ffmpeg pipeline** — multi-segment concat · BGM `atrim`+`amix` sub-range mixing · multi-variant render with shared input cache are all done by the BFF directly with ffmpeg. Mobile does not need to embed ffmpeg-kit ([`pipelines.md`](./pipelines.md)).

### Tradeoffs

| Cost | Impact |
|---|---|
| **Additional infrastructure** | The BFF has to run somewhere. A single machine is enough, but it is not zero. |
| **Additional latency** | One more hop, mobile → BFF → external API. Not large, but not zero. |
| **Operational burden** | Monitoring, deployment, logs, and secret rotation for the BFF itself. |

vibi chose the BFF after judging these three costs to be smaller than the cost of embedding voice SaaS keys in the mobile app. Given the pricing tier of voice APIs (per-minute billing), the decision usually pays for itself after a single key leak.

---

## What kind of BFF

vibi-bff is a narrow variant of the [BFF pattern](https://samnewman.io/patterns/architectural/bff/) — a single server serving *just one type of client*, mobile. The following are decisions deliberately **not** taken:

- **App data storage ❌** — user projects (timeline, segment, dub clips) live in mobile's Room DB. The BFF only does stateless job processing.
- **Session / state retention ❌** — after JWT issuance, every job is `jobId`-based. No state shared between BFF instances (currently a single-instance assumption).
- **CDN ❌** — render results and stems are not statically mounted; the BFF streams them directly. A simplification valid only at small-traffic stages.

These three are simplifications **in the context of vibi being a showcase app**. At production scale, moving stem and render results to S3+CDN while the BFF handles only metadata is the natural shape.

---

## External API routing policy

> Perso is the single external voice engine. All external calls go through the BFF only.

This policy exists because vibi is a showcase app for Perso AI DevRel — the primary intent is to demonstrate the strengths of the Perso API. The earlier dual-vendor design (Perso + ElevenLabs fallback) was removed once the Perso surface stabilized; the BFF code path is simpler with one vendor, and the swap seam at the BFF layer is still available if a second vendor needs to be added later.

---

## See also

- Walk through a flow: [`../learning/tutorial-stem-separation.md`](../learning/tutorial-stem-separation.md) · [`../learning/tutorial-export-variants.md`](../learning/tutorial-export-variants.md)
- Fork with your own keys: [`../how-to/deploy-your-own-bff.md`](../how-to/deploy-your-own-bff.md)
- ffmpeg-side pipeline decisions: [`pipelines.md`](./pipelines.md)
- Mobile-side KMP decision: [`why-kmp.md`](./why-kmp.md)
- Operational narrative for the external-API routing policy: [`../journal/operating-rules.md`](../journal/operating-rules.md)
