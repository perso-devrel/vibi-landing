# How we built vibi with Claude

vibi is Perso AI DevRel's showcase app, and — as of May 2026 — it consists of a single-codebase KMP/CMP Android + iOS mobile app and one Ktor BFF layer. This is a retrospective on *how we arrived at that shape*, and how the workflow of pairing with an AI coding agent (Claude Code) settled into place.

This isn't all a brag — where things got stuck, pitfalls we never wanted to hit twice, and patterns built but never reused are all written down too.

## 0. Starting point — legacy-android, a single app

The original incarnation of vibi was an Android-only app. Stack:

- Hilt + Retrofit + Room v19
- Video editing + Perso AI voice processing + embedded ffmpeg-kit
- Single-module Android project


## 1. The big shift — two directories: KMP/CMP + BFF

Three decisions landed almost simultaneously:

1. **We ship iOS too** — the mobile video + speech + stem separation category is mobile-first ([`../../PITCH.md`](../../PITCH.md)), and skipping iOS isn't an option.
2. **But we don't keep a separate Android codebase** — KMP makes that condition feasible. The comparison against RN/Flutter is in [`../explanation/why-kmp.md`](../explanation/why-kmp.md).
3. **No external API keys on mobile** — the Perso key lives in a single BFF layer. Vendor abstraction happens at the same time [`../explanation/why-bff.md`](../explanation/why-bff.md).

After all three landed, the workspace split into the sibling directories `vibi-mobile/` + `vibi-bff/` — while the workspace root directory name (`DubCast/`) stayed as-is for IDE/session compatibility.

At this point, *how to use Claude Code* first became a design problem. *The two directories had such different context* that having one agent juggle both meant half the context was wasted every time.

## 2. Tooling settles in — three layers: agents, commands, skills

The three below weren't built all at once. Each started from *an incident where some kind of work was inefficient*.

**Two subagents** (`bff-dev`, `kmp-dev`) — `/.claude/agents/`. Details in [`claude-toolbox/agents.md`](./claude-toolbox/agents.md).

> Trigger: the pitfall collections for BFF work and KMP work are very different, but they kept landing in the same context and creating inefficiency — split into separate descriptions for auto dispatch.

**Four slash commands** (`/plan`, `/sync-api`, `/review`, `/ship`) — `/.claude/commands/`. Details in [`claude-toolbox/commands.md`](./claude-toolbox/commands.md).

> Trigger: a BFF route was modified but the mobile client update was missed → surfaced at runtime as `Field 'foo_id' is required, but it was missing`. The conclusion was that gaps not caught at build time have to be hoisted into an explicit verification step. `/sync-api` fills that slot.

**Four skills** (`render-pipeline`, `separation-pipeline`, `review`, `build`) — in `vibi-bff/.claude/skills/` and `vibi-mobile/shared/.claude/skills/`. Details in [`claude-toolbox/skills.md`](./claude-toolbox/skills.md).

> Trigger: the ffmpeg multi-segment concat details and the Perso voice separation details both live in the BFF directory but *almost never overlap as a working topic* — split into separate skills for the two domains.

After these three layers settled, the *first 5 minutes of a new task* got shorter. Claude no longer re-deliberates where to start every time.

## 3. Operating principles — how the six policies formed

Once the tool shape stabilized, six operational policies formed one by one out of side effects. The order they formed in is roughly the order in which they occurred.

1. **No auto-execution of gradle/xcodebuild/simctl** — after seeing one accidental build disrupt disk, memory, and simulator state.
2. **Simple v1 + avoid hardcoding** — a case where a large plan couldn't be verified in one pass + a case where a secret almost leaked through a commit.
3. **External API routing: Perso first, all calls go only through BFF** — two threads: business policy and key isolation policy.
4. **iOS-first release order** — iOS has more pitfalls, so splitting time evenly across the two platforms always leaves iOS lagging.
5. **Hot-path-aware default** — an incident where a Room write was running on every frame of timeline scrubbing and caused lag.
6. **Known-bug logging policy** — after hitting the same NSURL pitfall twice, the *place to patternize it* (`vibi-mobile/shared/CLAUDE.md`) was pinned.

The narratives for the six and *why they don't form by being taught* are in [`operating-rules.md`](./operating-rules.md).

## 4. Where we got stuck — seven KMP/iOS pitfalls

On the iOS side there are seven patterns we hit more than once and ended up patternizing:

1. NSURL absolute path handling — `URLWithString(absolutePath)` doesn't return nil
2. AVAsset lazy loading — calling `duration` / `tracks` immediately returns 0/empty
3. Missing audio setters in K/N AVFoundation cinterop — work around via Swift bridge or BFF mux
4. NSData → ByteArray copy — using `allocArrayOf(bytes)` as the dest causes silent corruption
5. Streaming AVPlayer is silent under K/N — download then `AVAudioPlayer` instead
6. Path-only URLs leak into the iOS player — prepend the BFF base URL there too
7. AVMutableComposition missing `preferredTransform` — video rotation breaks

Each pitfall's narrative is in [`ios-pitfalls-with-kmp.md`](./ios-pitfalls-with-kmp.md). Only after these seven sat in one place did the policy "*read that section first before starting new K/N code*" start paying off.

A similar collection exists on the BFF side (`vibi-bff/CLAUDE.md` "Known BFF bug patterns" — 4 items): the multipart 50MB limit, Perso 5xx backoff, STT/voice separation must use dedicated endpoints, and inconsistent Perso path prefixes.

## 5. The workflow that settled in — lifecycle of a single task

A new feature now flows through this lifecycle:

```
user request
  │
  ▼
cross-directory? ── yes ──▶  /plan <feature>          (design from BFF first)
  │                            │
  no                           ▼
  │                          BFF change → bff-dev agent
  │                            │
  ▼                            ▼
single directory             mobile shared change → kmp-dev agent
↓                              │
bff-dev or kmp-dev              ▼
                             cmp UI change → kmp-dev agent
  │                            │
  ▼                            ▼
  ◀──────────────────────  /sync-api  (BFF ↔ mobile contract consistency)
                               │
                               ▼
                          /review  (per-directory dispatch)
                               │
                               ▼
                          (user runs build/test manually)
                               │
                               ▼
                          /ship  (graded by checklist)
```

After this flow was made explicit, the cost of "what should I do now?" disappeared. Claude and the human look at the same table.

## 6. What didn't go well

Writing only the wins would be inaccurate, so the misses are here too.

- **A skill that could have been merged, kept separate** — at one point there was a separate `koin-di` skill. It was a one-line policy, so it got absorbed into the `kmp-dev.md` agent description soon after. *When to merge versus when to split* wasn't a clear criterion early on.
- **Taking on too large a plan in one go** — the "simple v1" policy was made after that. Untangling the half-correct half of a too-large plan cost more than the plan itself.
- **Late formation of the known-bug policy** — among the seven pitfalls, the first two were each hit twice. The decision "let's patternize this" came only *on the third pitfall*. Had the policy existed from the start, the duplicated debugging time would have been saved.

## 7. If you're starting from the same spot

Translating the retrospective above into actionable one-liners:

1. If the directory context gap is large, start by splitting *subagents*.
2. Gaps between directories that surface *only at runtime* get pinned with *an explicit verification slash command*.
3. If a domain demands *a manual dozens of lines long*, pull it into a *skill*; if it's *a one-line policy*, put it in the *agent description*.
4. Policies form *when side effects occur*, not *from reading the official guide*.
5. If you hit the same pitfall twice, *patternize it on the spot* — skip the next debugging session.

These five are the shortest generalization of vibi's retrospective.

## Related reading

- Tool details: [`claude-toolbox/agents.md`](./claude-toolbox/agents.md), [`claude-toolbox/commands.md`](./claude-toolbox/commands.md), [`claude-toolbox/skills.md`](./claude-toolbox/skills.md)
- Pitfalls and policies: [`ios-pitfalls-with-kmp.md`](./ios-pitfalls-with-kmp.md), [`operating-rules.md`](./operating-rules.md)
- Product-docs side of the outcome: [`../explanation/why-kmp.md`](../explanation/why-kmp.md), [`../explanation/why-bff.md`](../explanation/why-bff.md), [`../explanation/pipelines.md`](../explanation/pipelines.md)
