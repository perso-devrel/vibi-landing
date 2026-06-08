# Two Subagents — `bff-dev` and `kmp-dev`

The vibi workspace root has just two custom subagents. `bff-dev.md` and `kmp-dev.md` inside `.claude/agents/`.

```
.claude/agents/
├── bff-dev.md     # vibi-bff only
└── kmp-dev.md     # vibi-mobile (shared + cmp + iosApp) only
```

This article covers *why split into two* — and *why not split finer*.

## Split only when the context gap can't be narrowed to one topic

For vibi, the domain gap between the two directories is large enough.

| | `vibi-bff` | `vibi-mobile` |
|---|---|---|
| Language | Kotlin (JVM) | Kotlin (Multiplatform — JVM + LLVM/iOS) |
| Framework | Ktor 3 + ffmpeg/ffprobe | Compose Multiplatform + Ktor Client + Room v5 (multiplatform, destructive migration) |
| Build unit | single gradle project | KMP `:shared` + CMP `:cmp` + Xcode `iosApp` |
| Common pitfalls | multipart 50MB limit, ffmpeg path escaping, Perso 5xx backoff | NSURL absolute paths, AVAsset lazy load, configuration cache |
| External calls | Perso | (none — only calls the BFF) |

If one agent had to cover both, it would have to throw away half of its context every turn — handling Ktor's `StatusPages` mapping in one turn, then the NSData conversion in expect/actual the next. The *per-domain pitfall sets* (Known bug patterns) and the *service-layer maps* are too different.

So each agent holds its own information:

### `bff-dev` ([`.claude/agents/bff-dev.md`](../../../.claude/agents/bff-dev.md))

- Locations of 6 route files + 3 DTOs + 10 service classes
- Policies like "artifacts are not statically mounted" (HMAC-signed URLs)
- Error mapping table (`NotFoundException`→404, `PersoApiException`→402/429/4xx/502)
- ffmpeg/ffprobe must be on PATH, JDK 21
- Working directory is `./vibi-bff` (its own git repo, so git commands run there)

### `kmp-dev` ([`.claude/agents/kmp-dev.md`](../../../.claude/agents/kmp-dev.md))

- The three module boundaries — `:shared` domain+logic, `:cmp` UI only, `iosApp` Xcode entry
- Multiplatform rules like "no Android/JVM-only API in `commonMain`"
- Why `--no-configuration-cache` is often needed for build commands
- iOS two-stage build — `:shared:embedAndSignAppleFrameworkForXcode` + Xcode

Each agent's description specifies this scope, so Claude Code auto-routes "add BFF Ktor route" / "write KMP expect/actual" tasks accordingly.

## Why not split finer

Initially the plan considered splitting `:shared` and `:cmp` into separate agents too. Why they were kept together in the end:

- 80% of tasks that touch `:shared` need to be carried through to `:cmp` ViewModel/UI usage. If split, two agents end up doing two halves of the same task and consistency breaks.
- Both modules share the same gradle root (`vibi-mobile/`), the same `local.properties`, and the same `BFF_BASE_URL`. Build commands almost always run together (`./gradlew :shared:build :cmp:assembleDebug --no-configuration-cache`).
- The module boundary is clear enough as a single table inside `kmp-dev.md`.

> Heuristic: **split agents by *context consistency*, not by task type**. If the same facts (error model, module locations, build procedure) get *copy-pasted* across two agents, merge them.

## Routing goes in the description

If a subagent's description spells out "which tasks are its territory," the parent agent uses it as the signal for auto-dispatch. vibi's two descriptions:

```
bff-dev:  vibi-bff (Kotlin/Ktor 백엔드) 전용 서브에이전트.
          Ktor 3 + kotlinx.serialization + ffmpeg/ffprobe 서비스 레이어 범위.
          렌더/오디오 분리 라우트 및 Perso 프록시 작업에 호출.

kmp-dev:  vibi-mobile (KMP `:shared` 비즈니스 로직 + Compose Multiplatform `:cmp` UI
          + iosApp Xcode 엔트리) 전용 서브에이전트. 모바일 클라이언트의 모든 작업.
```

Also specify *which tools only* (`tools: Bash, Read, Edit, Write, Grep, Glob`) — Web tools and other MCPs are intentionally excluded to prevent context blowup.

## Where do cross-cutting tasks go

There are tasks that fit neither agent — adding a BFF route *together with* a mobile client BffApi method, as one change. Separate slash commands (`/plan`, `/sync-api`) handle those → [`commands.md`](./commands.md).

## See also

- [`commands.md`](./commands.md) — dispatch for cross-cutting tasks
- [`skills.md`](./skills.md) — finer-grained splits within the same directory
- [Workspace `CLAUDE.md`](../../../CLAUDE.md) § "Task routing" — the same table for humans routing manually
