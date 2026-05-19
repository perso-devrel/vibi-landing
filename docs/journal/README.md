# journal — a record of how it was built

While the other directories in `docs/` (learning, reference, how-to, explanation) cover *how to use vibi*, this one covers *how vibi was built*.

## Who this is for

- Developers running a non-trivial project — **multiplatform (KMP/CMP) + BFF** — with an AI coding agent (Claude Code)
- People looking for the answer somewhere between "Can't you just have the agent do everything?" and "Okay, but what exactly did you tell it, and how?"
- People who find *how vibi's code settled into place* more interesting than the code itself

This is intended as a technical retrospective, not self-congratulation — it includes the places I got stuck, patterns I built once and never reused, and pitfalls I encountered twice or more.

## Posts

| Post | What it covers |
|---|---|
| [`how-we-built-vibi-with-claude.md`](./how-we-built-vibi-with-claude.md) | A single-piece retrospective from the starting point to the workflow that settled in |
| [`claude-toolbox/agents.md`](./claude-toolbox/agents.md) | Why I split into the two sub-agents `bff-dev` and `kmp-dev` |
| [`claude-toolbox/commands.md`](./claude-toolbox/commands.md) | The operating flow of `/plan`, `/sync-api`, `/review`, `/ship` |
| [`claude-toolbox/skills.md`](./claude-toolbox/skills.md) | How I drew the boundaries between skills |
| [`ios-pitfalls-with-kmp.md`](./ios-pitfalls-with-kmp.md) | Seven KMP/iOS pitfalls I encountered twice or more |
| [`cloud-run-deploy-journey.md`](./cloud-run-deploy-journey.md) | Eight pitfalls between `./gradlew run` and a Cloud Run deploy on `git push` |
| [`egress-redirect-to-gcs.md`](./egress-redirect-to-gcs.md) | Moving the download data plane off Cloud Run and onto V4 signed GCS URLs *(historical — the BFF was later migrated to Cloudflare R2 SigV4 presigned URLs to capture R2's free egress. The shape of the redirect is unchanged; only the backend swapped.)* |
| [`operating-rules.md`](./operating-rules.md) | Operating rules that settled in from working with an AI agent |

## Relationship to product docs

This directory is meta + retrospective. The *results* of the same decisions (e.g. the single BFF layer, the KMP module layout) live in [`../explanation/`](../explanation/). The two groups are cross-linked, so you can jump back and forth.

```
docs/explanation/why-kmp.md       ←→ docs/journal/ios-pitfalls-with-kmp.md
docs/explanation/why-bff.md       ←→ docs/journal/operating-rules.md
docs/explanation/pipelines.md     ←→ docs/journal/claude-toolbox/skills.md
```

## Why publish it

vibi is Perso AI DevRel's showcase app, and "a case of running multiplatform + BFF with an AI agent" felt worth writing up on its own. So it can help someone starting from the same place.

## What's not included

- Direct quotes pulled from the ~100 conversation logs (`.jsonl`) accumulated along the way. The first pass only covers the patterned outputs in the `.claude/` assets and `vibi-*/CLAUDE.md` — the raw conversations need separate PII filtering infrastructure, so they are a follow-up.
- The *raw text* of private policy memory. I brought over the *shape* of the decisions, not the personal workflow details.
