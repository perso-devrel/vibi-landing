# Slash commands — `/plan` `/sync-api` `/review` `/ship`

The workspace root's `.claude/commands/` holds four slash commands. This note covers the operational flow of *why each one was created and when it gets used*.

```
.claude/commands/
├── plan.md         # cross-directory implementation plan
├── sync-api.md     # BFF ↔ mobile shared API contract consistency check
├── review.md       # change review (per-directory dispatch)
└── ship.md         # release gate (full build/test + consistency)
```

The flow sits naturally on a single line:

```
design       → implement       → contract check → review    → ship
/plan          (bff-dev/kmp-dev)  /sync-api        /review     /ship
```

## `/plan <feature>` — design from the BFF first

[`.claude/commands/plan.md`](../../../.claude/commands/plan.md)

When cross-directory work comes in — e.g. "add an admin grant button that surfaces the new credit balance in the mobile user menu" — designing BFF, shared, and cmp simultaneously in a single agent's head always leaves one side underbaked. So the command forces six explicit phases:

1. Impact scope (BFF route? shared DTO? cmp UI? iOS adapter?)
2. **Design from the BFF first** — the BFF is the contract's source of truth
3. Map mobile shared changes (`commonMain` first → expect/actual only where required)
4. Map mobile cmp UI changes (domain calls go only through `:shared`)
5. Verification gates (per-directory build/test + `/sync-api`)
6. Risk check (BFF compatibility, Windows paths, signed URLs, BFF_BASE_URL env)

**The command's value**: details like BFF route signatures / `@SerialName` policy / mobile BuildConfig env vars get raised *in the same slot, in the same phrasing*, across every plan. The cost of asking the same item differently each time disappears.

## `/sync-api` — BFF ↔ mobile contract consistency

[`.claude/commands/sync-api.md`](../../../.claude/commands/sync-api.md)

The BFF's routes/DTOs and mobile shared's `BffApi`/DTOs *aren't linked at compile time* — the two directories have separate gradle builds, so when a BFF DTO changes, mobile only finds out *at runtime*.

`/sync-api` is the verification command that bridges that gap. It cross-checks five items:

1. **Endpoint coverage** — BFF's `/api/v2/*` lines up 1:1 with mobile `BffApi` methods
2. **DTO field consistency** — `@SerialName`, types, nullability
3. **Multipart part names** — keys like `video_0`/`bgm_0`/`file`/`spec`/`config`/`inputId` match character for character
4. **HTTP status codes** — BFF `ErrorHandling` mapping ↔ mobile `expectSuccess = true` `ResponseException` handling
5. **Domain interface consistency** — `AudioSeparationRepository` and friends correspond logically to BFF endpoints

**When to run it**:
- Before merging a BFF PR (the enforcement point for the "BFF is source of truth" policy)
- Verification gate 5 in `/plan`
- Item 4 in `/ship`

**Why this is needed**: after a case where mobile build passed + BFF build passed → real-device integration surfaced a runtime error like `Field 'foo_id' is required, but it was missing`. Gaps not caught at build time have to be hoisted into an explicit verification step.

## `/review` — per-directory dispatch

[`.claude/commands/review.md`](../../../.claude/commands/review.md)

Review itself has different angles per directory — BFF prioritizes security/efficiency/error mapping, KMP/CMP prioritizes commonMain pollution, expect/actual consistency, and JVM-only library leakage.

So `/review` doesn't inspect *directly* — it looks at the change scope and dispatches to the per-directory review skill:

- `vibi-bff` changes: `vibi-bff/.claude/skills/review.md` (4 angles + severity labels)
- `vibi-mobile` changes: BFF checklist with KMP angles added
- Changes in both: the above two + cross-API contract check (including a `/sync-api` call)

**`/review`'s value**: it auto-invokes the right checklist based on directory location — a human doesn't have to judge "this PR is BFF-only, so focus on security" / "this one touches mobile too, so also expect/actual" every time.

## `/ship` — release gate

[`.claude/commands/ship.md`](../../../.claude/commands/ship.md)

Bundles the build command + tests + `/sync-api` consistency into one pass. Five phases:

1. `vibi-bff` — `./gradlew test` + `compileKotlin` + env verification
2. `vibi-mobile (:shared)` — `:shared:testDebugUnitTest` + `:shared:build` + iOS framework link
3. `vibi-mobile (:cmp)` — `:cmp:assembleDebug` + iOS simulator build
4. **Cross API contract** — `/sync-api` mismatches at 0
5. Risk check — `BFF_BASE_URL` production address, iOS `Info.plist` permissions, Android permissions, etc.

`/ship` itself doesn't run the builds — per the in-memory policy ([operating-rules.md](../operating-rules.md)), gradle/xcodebuild/simctl auto-execution is disallowed. The user takes the command, a human triggers it, and Claude grades the output against the checklist.

## What the commands have in common

- They all end with a *checklist + output format*. If the output is free-form, every run looks different and can't be compared.
- One command calls another — `/ship` calls `/sync-api`, and `/review` calls `/sync-api` when needed. The commands are small building blocks.
- The "BFF is source of truth" policy is the baseline running through all of them.

## Related reading

- [`agents.md`](./agents.md) — the two subagents the commands dispatch to
- [`skills.md`](./skills.md) — the smaller unit invoked from inside commands (e.g. per-directory review skill)
- [Workspace `CLAUDE.md`](../../../CLAUDE.md) § "Root slash commands" — the one-line catalog of the same four commands
