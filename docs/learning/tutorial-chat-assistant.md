# Tutorial — Edit by talking: the chat assistant

vibi's chat assistant lets the user describe edits in natural language ("이 영상 영어로 더빙해줘", "5초~10초 구간을 2배속으로", "BGM 음량 50%로 줄여"). Gemini turns the request into a typed proposal of timeline mutations; the user reviews it and taps **적용** to run it.

This tutorial walks the same flow from a different angle than `tutorial-auto-dub.md` / `tutorial-stem-separation.md` — instead of tapping panels, you let the model translate intent into the same underlying use-cases. By the end:

- You'll see how `projectContext` + the `chat-tools.md` spec turn an LLM into a typed editor
- You'll know what happens between "tap 적용" and the timeline actually changing
- You'll have intuition for the cost/race-avoidance gotchas baked into the design

Prerequisite: [`getting-started.md`](./getting-started.md) is done, BFF and the mobile app are alive, you're signed in, and you have a video uploaded. Reading at least one of [`tutorial-auto-dub.md`](./tutorial-auto-dub.md) / [`tutorial-stem-separation.md`](./tutorial-stem-separation.md) first is helpful — the chat surface routes to the **same** use-cases those tutorials drive directly.

---

## 1. Open the chat

In TimelineScreen, the chat FAB sits at the bottom-right corner. It's visible in the **영상 편집** and **음원** steps, and hidden in the **자막/더빙** step (that step already has its own panel for the same actions).

When the panel is closed, an unread dot on the FAB indicates new assistant messages — including system-emitted completion notices like "음성 분리 완료" that the chat ViewModel collects from `TimelineViewModel.chatAssistantEvents`.

Tap the FAB. A bottom sheet rises with:

- A "자주 쓰는 명령" row of context-aware example chips (`buildPrompts` in `ChatPanel.kt`). These adapt to your project: if BGM is present, "삽입한 음원에서 보컬만 분리해줘" appears; if there are no captions, "자막 자동으로 생성해줘" appears.
- A message list (empty on first open).
- A text input + send button.

## 2. Ask for something

Type "이 영상 영어로 더빙해줘" and send.

The client builds a `ChatRequestDto` (`vibi-mobile/shared/.../data/remote/dto/ChatDto.kt`) and POSTs to `/api/v2/chat`. The body has three top-level fields:

```jsonc
{
  "messages": [
    { "role": "user", "content": "이 영상 영어로 더빙해줘" }
  ],
  "projectContext": { /* compressed timeline snapshot — see below */ },
  "locale": "ko"
}
```

The `projectContext` is a serialized snapshot of every state the model could possibly need to resolve references in the user's request. `ProjectContextBuilder` (in `:shared/domain/chat/`) compresses `TimelineUiState` into:

| Field | What it carries |
|---|---|
| `segments[]` | id, type (VIDEO/IMAGE), order, duration, speed/volume |
| `subtitleClips[]`, `dubClips[]`, `bgmClips[]` | already-generated artifacts (id, lang, range) |
| `stems[]` | per-directive stem playback state |
| `separationDirectives[]` | already-separated ranges — `rangeStartMs/EndMs`, `numberOfSpeakers`, `durationMs` |
| `currentPlayheadMs`, `selectedClipId`, `selectedSegmentId` | what the user is looking at right now |
| `videoDurationMs` | so "끝까지" can be resolved without guessing |
| `isRangeSelecting`, `pendingRangeStartMs`, `pendingRangeEndMs` | when the user has dragged a range, this is the *truth* for "이 구간..." |

> The whole `chat-tools.md` spec the BFF injects as `systemInstruction` instructs Gemini to *never* invent IDs or timestamps not in `projectContext` — when a reference can't be resolved, the model is required to reply with `kind=text` and ask back rather than guess.

## 3. The response — `kind=proposal` vs `kind=text`

The BFF route (`vibi-bff/.../routes/ChatRoutes.kt`) calls Vertex AI Gemini with `tools[0].functionDeclarations` = the 15 vibi tools defined in `ChatToolDefs.kt`. Two response shapes come back:

- **`kind=text`** — used for read-only Q&A ("자막 몇 개야?") or follow-up questions ("어느 구간 말씀하시는 거예요?"). Just gets rendered in the message list.
- **`kind=proposal`** — a typed plan of 1–5 tool calls. Each step has a `name` (one of the 15 registered tools) and `args`. A ProposalCard renders:
  - Rationale (model-written, in user's language)
  - Step list (`generate_dub` · args: `targetLanguageCodes=["en"]`)
  - Cost hint when relevant (slow tools — separation/captions/dub — get `(예상 ~N분)` appended)
  - Three buttons: **적용** · **수정** · **취소**

For "이 영상 영어로 더빙해줘", Gemini returns:

```jsonc
{
  "kind": "proposal",
  "steps": [
    { "name": "generate_dub", "args": { "targetLanguageCodes": ["en"] } }
  ],
  "rationale": "영어로 자동 더빙합니다. (예상 ~2분)"
}
```

> **`tool_code` fallback** — Gemini 2.5 Flash occasionally ignores `functionDeclarations` and dumps a `tool_code` markdown block with `print(default_api.generate_dub(targetLanguageCodes=["en"]))` instead. `GeminiClient.recoverToolCallsFromText` regex-restores that into a structured proposal so the client never sees the raw text. Two formats are recognized — Python literal kwargs and YAML pseudo-tool-code.

## 4. Tap 적용

This is where chat differs from a direct UI tap.

```kotlin
// vibi-mobile/shared/.../ui/chat/ChatViewModel.kt
fun applyProposal(steps: List<ToolCallDto>, vm: TimelineViewModel) {
    val placeholderId = "..." // generate id for the "⏳ 처리 중" message
    state.update { it.pushSystem(placeholderId, "⏳ 처리 중") }
    viewModelScope.launch {
        val result = dispatcher.dispatch(steps, vm)
        state.update { it.replaceMessage(placeholderId, result.toSummary()) }
    }
}
```

Three things matter here:

1. **Suspend chain, not parallel launches.** `ChatToolDispatcher.dispatch(steps, vm)` is `suspend`, and so are all the `applyXxxFromChat` methods on `TimelineViewModel`. Steps run one after another, awaiting completion before moving on. This is what lets multi-step proposals like "이 구간 음원분리 후 background stem 미선택 → 자막 생성" work without racing — `awaitSeparationCompleteForChat` blocks until the directive is materialized before the next step starts.

2. **Dedicated `applyXxxFromChat` path, not the UI handler.** Each chat tool routes through `apply*FromChat` rather than the same `onXxx` the UI taps would call. The chat path skips the UI's confirmation dialogs, range-mode guards, and panel auto-opens that would either silently fail under a dispatcher coroutine or fire stray UI events. Calling the regular UI handler from chat is a known anti-pattern — it just silently no-ops.

3. **In-place "처리 중" replacement.** The placeholder message lets the user dismiss the panel and still see the running operation reflected on the timeline (progress overlays, status updates). When the dispatcher returns, the same message id is **replaced** in place with the result summary — not appended — so the chat log stays clean.

## 5. The destructive-edit warning

Try a different command: with captions or dubbing already generated, type "처음 5초 잘라줘".

The proposal that comes back includes an extra paragraph in the rationale:

> ⚠ 이 편집을 적용하면 기존 영어 자막 1개와 한국어 더빙 1개가 초기화됩니다. 진행할까요?

The model is instructed by `chat-tools.md` to detect structural segment edits (`delete_segment_range` / `duplicate_segment_range` / `update_segment_speed`) and append this warning whenever `subtitleClips` / `dubClips` / `separationDirectives` / `bgmClips` are non-empty — because those structural edits shift the timeline length and invalidate every downstream artifact.

The warning lives in the rationale, not as a separate dialog — vibi's design treats the ProposalCard as the unified confirmation surface. The user reads it, decides, taps 적용 or 취소. `update_segment_volume` is exempt (mix change, not structural).

## 6. Separation overlap negotiation

Another behavior worth seeing in action: try "8초~15초 구간 보컬만 남겨줘" *after* you've already separated 0s–10s.

Instead of a proposal, you get `kind=text`:

> 이미 0s–10s 구간이 분리되어 있어 8s–15s 와 겹칩니다. 세 가지 선택지가 있어요:
>
> A. 기존 분리를 삭제하고 8s–15s 로 새로 분리 (예상 ~7분, 기존 결과 잃음)
> B. 겹치지 않는 부분만 분리: 10s–15s (예상 ~5분, 기존 결과 보존) ← 추천
> C. 더 짧게 쪼개 분리
>
> 어떻게 할까요?

The model derives the overlap from `projectContext.separationDirectives[]` and applies the cost-optimal ordering **B > C > A** prescribed by `chat-tools.md`. You pick one, the model emits a single-step proposal, you tap 적용. Same `applyXxxFromChat` path runs.

## 7. Where the chat lands in code

A request-to-effect map:

```
ChatPanel (UI)
  → ChatViewModel.send(text)
     → ChatRepository.chat(ChatRequestDto)
        → BffApi.chat() → POST /api/v2/chat
                            → ChatRoutes (vibi-bff) → GeminiClient.chat()
                              → Vertex AI generateContent
                            ← ChatResponseDto { kind, steps?, rationale? }
     ← ChatResponseDto
  ← ProposalCard rendered

  user taps 적용
  → ChatViewModel.applyProposal(steps, timelineVm)
     → ChatToolDispatcher.dispatch(steps, vm) [suspend]
        → vm.applyDeleteRangeFromChat(...) | applyGenerateDubFromChat(...) | ...
           → existing GenerateAutoDubUseCase / StartSeparationUseCase / ... use-cases
              (same code path the panel UI uses, just without UI ceremony)
```

`ProjectContextBuilder` + `ChatToolDispatcher` + the per-tool `applyXxxFromChat` methods are the entire client-side chat surface. The 15 tool definitions and the system instruction live in `vibi-bff/src/main/resources/chat-tools.md` — one file, both sides agree.

---

## To reconstruct the same flow in your own app

A "natural language edits a typed timeline" pattern in three pieces:

1. **A spec file** the BFF injects as `systemInstruction` — tool definitions + behavior rules. One file is the single source of truth for both sides.
2. **A context builder** that serializes whatever the model needs to resolve references — never let the model invent IDs or timestamps.
3. **A dispatcher** with a dedicated `applyXxxFromChat` entry per tool — bypasses the UI's guard rails but reuses the same domain use-cases. Suspend, not parallel.

Key BFF endpoint reference: [`../reference/bff-api.md#chat-gemini-function-calling`](../reference/bff-api.md#chat-gemini-function-calling).

---

## Up next

- BFF side of the same flow (request/response shape, tool list, fallback regex): [`../reference/bff-api.md#chat-gemini-function-calling`](../reference/bff-api.md#chat-gemini-function-calling)
- The full tool spec (verbatim from `systemInstruction`): `vibi-bff/src/main/resources/chat-tools.md`
- The non-chat way to drive the same edits: [`tutorial-auto-dub.md`](./tutorial-auto-dub.md) · [`tutorial-stem-separation.md`](./tutorial-stem-separation.md)
