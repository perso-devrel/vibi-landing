# vibi docs

"Keep the video. Erase just the noise." vibi splits a video's audio into per-speaker stems so you can mute the parts you don't want — driven from a single mobile codebase (Android + iOS), with all external voice API calls confined to one BFF layer. This is its open-source showcase.

These docs target both the **external developer meeting vibi for the first time** and the **contributor joining the codebase**. The writing classification follows the four types from [technical-writing.dev](https://technical-writing.dev/overview.html) — each directory maps to exactly one type.

## Where to start

| Situation | Go here |
|---|---|
| First time — want to spin it up | [`learning/`](./learning/) |
| Stuck — build/connect/run won't work | [`how-to/`](./how-to/) |
| Looking up env vars, endpoints, error codes | [`reference/`](./reference/) |
| Curious why BFF, why KMP — the decision background | [`explanation/`](./explanation/) |
| Curious about how it was built and the Claude workflow | [`journal/`](./journal/) |

## Index by directory

### [`learning/`](./learning/) — Learn
Step-by-step guides you follow end to end.

- [`getting-started.md`](./learning/getting-started.md) — Environment setup → spin up BFF → mobile build → sign in → first app screen
- [`tutorial-stem-separation.md`](./learning/tutorial-stem-separation.md) — Separate per-speaker stems, remix the selection, and insert into the timeline
- [`tutorial-export-variants.md`](./learning/tutorial-export-variants.md) — End-to-end export pipeline from the timeline 저장 tap through the v3 asset-by-reference render flow

### [`reference/`](./reference/) — Look up
Specs to search and consume when you need them.

- [`environment.md`](./reference/environment.md) — `.env` (BFF) / `local.properties` (mobile) variable tables
- [`bff-api.md`](./reference/bff-api.md) — `/api/v2/*` request, response, and errors per endpoint (markdown copy of the Swagger UI)
- [`error-contract.md`](./reference/error-contract.md) — `ErrorResponse` contract, Perso upstream mapping, client handling patterns

### [`how-to/`](./how-to/) — Task guides + troubleshooting
Short docs for solving a specific problem quickly.

- [`deploy-your-own-bff.md`](./how-to/deploy-your-own-bff.md) — Spin up your own BFF with your Perso key and connect from mobile
- [`connect-real-device.md`](./how-to/connect-real-device.md) — When the emulator works but a physical device can't reach the BFF
- [`troubleshooting.md`](./how-to/troubleshooting.md) — Common build/runtime blockers

### [`explanation/`](./explanation/) — Deep understanding
The "why" and "how we decided" background.

- [`why-bff.md`](./explanation/why-bff.md) — Why the mobile app does not call external APIs directly
- [`why-kmp.md`](./explanation/why-kmp.md) — Why KMP/CMP over Flutter / RN
- [`pipelines.md`](./explanation/pipelines.md) — Design of the stem-separation and multi-variant render pipelines

### [`journal/`](./journal/) — How it was built
Not how to use vibi, but the meta and retrospective on *how vibi was built*.

- [`how-we-built-vibi-with-claude.md`](./journal/how-we-built-vibi-with-claude.md) — Single-piece project retrospective
- [`claude-toolbox/`](./journal/claude-toolbox/) — How `.claude/` agents, commands, and skills are split
- [`ios-pitfalls-with-kmp.md`](./journal/ios-pitfalls-with-kmp.md) — Narrative of 5 KMP/iOS pitfalls
- [`operating-rules.md`](./journal/operating-rules.md) — Operating principles that settled in while working with AI agents

## Relationship to other docs

The vibi workspace already has a few markdown files. Roles are split cleanly.

| Doc | Audience | Tone |
|---|---|---|
| Workspace root [`README.md`](../README.md) | Developer who wants the 5-second pitch | 5-second hook |
| Workspace root [`ARCHITECTURE.md`](../ARCHITECTURE.md) | Contributor going deep into the codebase | Code-grounded facts (single source of truth) |
| `vibi-bff/README.md` · `vibi-mobile/README.md` | Developer touching only that module | Per-module build and run |
| **This `docs/`** | **Both external entrants and contributors** | **Purpose-based classification (4 types)** |
| `CLAUDE.md` files | Claude Code routing | Not externally exposed |

When you need code-grounded facts, start with `ARCHITECTURE.md` — these docs prioritize the learning flow and simplify some facts along the way.

## Contributing

If a doc here does **not work end-to-end on a fresh shell when followed verbatim**, that's a bug. PRs welcome.
