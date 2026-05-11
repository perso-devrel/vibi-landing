# Skill split — big domains get their own, light tools merge

vibi's skills are scattered per directory. The layout takes advantage of the fact that *the directory itself is a context boundary*.

```
vibi-bff/.claude/skills/
├── render-pipeline.md         # /api/v2/render — ffmpeg multi-segment composition
├── separation-pipeline.md     # /api/v2/separate — Perso separation + stem mix
└── review.md                  # code review checklist

vibi-mobile/shared/.claude/skills/
└── build.md                   # KMP build commands and configuration cache caveats
```

This note covers *why these four settled in* — and *why they weren't split further or merged*.

## What skills do — hands-on manuals for a working domain

If subagents (`bff-dev`, `kmp-dev`) hold context at the *directory* level, skills hold the details of *one domain frequently worked within that directory*. A manual one level deeper than an agent description.

Each skill is user-invocable via trigger keywords (e.g. "render", "separation", "build"), so when a user says something like "render pipeline ...", the matching skill is pulled in automatically.

## Heuristics for splitting

### 1. When a domain is large enough to look like its own machine — its own skill

`render-pipeline.md` and `separation-pipeline.md` are like that. Each has:

- Its own routes (`RenderRoutes.kt`, `SeparationRoutes.kt`)
- Its own 1–2 services (`RenderService` / `SeparationService` + `StemMixService`)
- Its own multipart key convention (`video_0`/`audio_0`/`image_0`... vs `file`/`spec`)
- Its own external dependency (assembling ffmpeg commands vs Perso's 3-step upload → translate → poll → download)
- Its own collection of pitfalls (Windows path escaping vs Perso 5xx backoff)

At this point, working on one topic barely surfaces details from the other — splitting them reduces context blowup, and when a PR touches *both topics at once*, both can be pulled in explicitly.

### 2. Meta work — one skill is enough

`vibi-bff/.claude/skills/review.md` puts the four angles of code review (duplication/efficiency/security/clean code) into a single file. No need to split into "security review skill" / "efficiency review skill". A single PR review usually looks at all four angles at once.

`vibi-mobile/shared/.claude/skills/build.md` is the same reason — KMP build commands are naturally pulled in together. Configuration cache caveats, per-module commands, iOS framework compilation in one place.

### 3. Hang it on the directory — the directory itself is the context boundary

The fact that `render-pipeline` and `separation-pipeline` sit *inside the vibi-bff directory* is itself meaningful — Claude Code only auto-exposes them when working in that directory. BFF ffmpeg details don't leak into context during KMP work.

This is cleaner than the alternative of putting all skills under a *single `.claude/skills/` at the workspace root*. The root holds only *cross-cutting work* (commands, agents); module-level details stay inside the module.

## What was not split

A few options that were considered and skipped:

- **A separate `error-handling` skill** — the `bff-dev.md` agent already carries the mapping table, and the BFF README has the same table, so it's duplication. Keeping it in the agent's description is enough.
- **A separate `kmp-bug-patterns` skill** — the "Known iOS bug patterns" section of `vibi-mobile/shared/CLAUDE.md` already plays that role. CLAUDE.md auto-loads into context, so a separate skill would be redundant.
- **A `koin-di` skill** — `kmp-dev.md`'s working principle #6 sums it up in one line, which is enough. Unless a new DI module is being added, no deeper manual is needed.

> Heuristic: **information that fits *in a single line* inside CLAUDE.md / an agent description doesn't get pulled out as a skill**. Skills are only worth it when the domain needs *a manual dozens of lines long*.

## What's inside a skill

The skeleton of each skill is similar:

```
---
name: <slug>
description: <when to use>
user_invocable: true
trigger: <Korean trigger keyword>
---

# One-page summary (architecture diagram or flow table)

## Common pitfalls and remedies

## Code locations (file_path:line)

## Adjacent topics (related skills or CLAUDE.md sections)
```

Code locations are always included — Claude Code greps well, but pre-baking *which file to start from* is faster.

## Related reading

- [`agents.md`](./agents.md) — one level above skills, directory-level context
- [`commands.md`](./commands.md) — workflows that invoke and bundle skills (e.g. `/review` → per-directory review skill)
- [`../../explanation/pipelines.md`](../../explanation/pipelines.md) — product-docs side description of the domain covered by the render/separation skills
