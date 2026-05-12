# Operating rules — working with an AI agent as a partner

Working on vibi, a set of **operating rules** settled in. Policy for what the AI agent may do automatically and what it may not, what defaults it should hold, and how to block side effects.

These rules were not *designed up front* — each one was forged after an unintended side effect happened once. So the *why* always comes with an *incident*.

This post documents how they formed, so someone starting from the same place can *start with the same rules*.

## Rule 1 — No automatic gradle/xcodebuild/simctl invocation

Unless the user explicitly says "build it" / "run the tests", Claude Code only *proposes* build/run commands.

**Why**: Multiplatform builds have large unintended side effects — some KMP tasks invalidate caches and slow down the next build, simctl mutates simulator state, and gradle spawns a daemon that holds disk and memory. Auto-running anything the user did not explicitly say *I want to run this right now* is high cost, low benefit.

**Application**:
- *Building to verify* after a code change is user-triggered.
- Release gates like `/ship` only produce a checklist — the actual gradle commands are run by a human, and Claude grades the output afterward.

This is the first rule that breaks out of the "AI agent = one click and it's done" illusion. Execution stays in human hands, and Claude focuses on *proposing and grading*.

## Rule 2 — Simple v1, avoid hardcoding

The first-pass plan is the **smallest unit**. Large design spaces are not handled in a single shot. And secrets / IDs always come from env / properties / xcconfig, never as constants embedded in code.

**Why**:
- A large plan cannot be verified in one shot — when half of a plan is right and half is wrong, untangling the wrong half takes longer than producing the plan itself. A small plan lets "do exactly this" actually work.
- Keys / IPs / spaceSeq embedded in code as constants *will eventually leak via a commit*. Setting env injection as the first-pass default blocks that incident from the start.

**Application**:
- Pull all environment dependencies into a single place: BFF `.env` / mobile `local.properties` / iOS `.xcconfig`.
- Even temporary changes for demos or debugging (e.g. auth bypass) get a separate restore-before-commit policy note ([memory: project_demo_temp_changes](../../README.md) and similar transient notes).

## Rule 3 — External API routing: Perso only, all calls only from BFF

vibi's external voice API calls go to Perso, and only to Perso. Zero direct calls from mobile. The dual-vendor (Perso + ElevenLabs fallback) design from earlier iterations was retired once the Perso surface stabilized — the BFF abstraction seam stays so a second vendor *could* be added later, but day-to-day operation runs single-vendor.

**Why**:
- Key isolation — details in [`../explanation/why-bff.md`](../explanation/why-bff.md).
- Vendor abstraction — quota / outage / pricing changes are absorbed in the single BFF layer, *without rebuilding and redeploying mobile*.
- vibi is Perso AI DevRel's showcase. The first-order intent is to show off Perso's strengths, so *Perso-only* is a business policy too.

## Rule 4 — iOS-first release order

vibi ships iOS first. New KMP features are completed on `iosMain` + `iosApp` first; `androidMain` lands as a stub or follow-up.

**Why**: Schedule priority. iOS has more pitfalls (`AVPlayer`, AVFoundation, cinterop, XcodeGen, Info.plist permissions), and splitting the same time across both platforms makes iOS slip further.

**Application**:
- When adding a new expect, write the `iosMain` actual first; add the `androidMain` stub at the same time (KMP refuses to compile if an actual is missing).
- Verifying on iOS simulator / physical device is the first verification gate; Android verification is a follow-up.

KMP itself is *a tool that enables iOS-first*, not *a tool that forces simultaneous Android and iOS launches*. Stating this explicitly keeps work priorities from drifting.

## Rule 5 — Hot-path-aware defaults

*Hot paths* like Flow `onEach` and mutation handlers default to in-memory + parallel from the start. No multiple heavy player instances; lightweight DAO lookups come first.

**Why**: For the same code, *how often it is called* is half the decision. Code called on every frame during a user's timeline scrubbing and code called once an hour cannot share the same authoring criteria.

**Application**:
- ViewModel mutation handlers prefer in-memory state; Room writes are debounced or run on onPause.
- Heavy instances like AVPlayer / ExoPlayer are capped at one per screen; no new instance creation during scrubbing.

The fact that the code you just wrote *is called 60 times per second* is often not obvious at authoring time. Pinning **call frequency** as the first question in design review makes hot-path patterns surface naturally.

## Rule 6 — Known-bug logging policy

The moment you encounter the same pitfall twice, *append it as a pattern* to `vibi-mobile/shared/CLAUDE.md` "Known iOS bug patterns" / `vibi-bff/CLAUDE.md` "Known BFF bug patterns". Read that section *before* writing new K/N code or a new multipart endpoint.

**Why**: The goal isn't to reduce debug time — it's to **not debug again**. The debug cost of a pitfall you've already solved is large, but moved into a single pattern line, the next person (= future you or a teammate) skips the debugging entirely.

**Application**:
- Seven patterns are already stacked. iOS 5 ([`ios-pitfalls-with-kmp.md`](./ios-pitfalls-with-kmp.md)) + BFF 4 (multipart 50MB limit, Perso 5xx backoff, retiring the `submitTranslate` bypass, the Perso path prefix `/video-translator` vs `/file`).
- Stack them *in the same place* (no scattering). When working on a new K/N, only one place needs reading.

## The meta — these are not produced by being taught

None of the six rules above came from *reading an official guide and applying it*. Each was one side effect, then pinned into memory at the spot. So each policy *has its own story*.

What this means:

- **A new project also starts from zero rules** — copying the six above from day one will not fit some of them. A rule *forms only after a side effect occurs*.
- **You can carry rules by *shape*, not *literal text*** — "Known-bug logging policy" is tied to vibi's specifics, but *patterning repeated pitfalls into a single place* is a shape that applies anywhere.
- **The location of the rule set is itself a rule** — vibi keeps them in per-user memory (`~/.claude/projects/.../memory/`). There is an alternative of pinning them in the workspace `CLAUDE.md`, but I split along the boundary between *personal workflow* and *project policy*.

## Related reading

- [`how-we-built-vibi-with-claude.md`](./how-we-built-vibi-with-claude.md) — the timeline of *when* these rules were formed
- [`ios-pitfalls-with-kmp.md`](./ios-pitfalls-with-kmp.md) — the five pitfalls covered by the Known-bug logging policy
- [`../explanation/why-bff.md`](../explanation/why-bff.md) — product-docs-side background for the external API routing rule
