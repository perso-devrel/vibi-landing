# Tutorial — Edit by talking: the chat assistant

vibi's chat assistant lets the user describe edits in natural language ("5초~10초 구간을 2배속으로", "BGM 음량 50%로 줄여", "삽입한 음원에서 보컬만 분리해줘"). Gemini turns the request into a typed plan of tool calls; the user agrees in chat ("응", "진행해줘"), and vibi auto-applies the change — no buttons, no extra ceremony.

This tutorial walks the same flow from a different angle than `tutorial-stem-separation.md` — instead of tapping panels, you let the model translate intent into the same underlying use-cases. By the end:

- You'll see how `projectContext` + the `chat-tools.md` spec turn an LLM into a typed editor.
- You'll know what happens between "응 적용해줘" and the timeline actually changing.
- You'll have intuition for the cost/race-avoidance gotchas baked into the design.

Prerequisite: [`getting-started.md`](./getting-started.md) is done, BFF and the mobile app are alive, you're signed in, and you have a video uploaded. Reading [`tutorial-stem-separation.md`](./tutorial-stem-separation.md) first is helpful — the chat surface routes to the **same** use-cases that tutorial drives directly.

> **What the chat can drive (current surface):** segment delete / duplicate / volume / speed, audio separation, stem volume, BGM move / volume / range alignment. 9 tools total. Auto-subtitles / auto-dub / lipsync were removed from the BFF (commit `52f8d7c`) and are no longer reachable from the chat — even though some leftover prompt chips and dispatcher branches still mention them.

---

## 1. Open the chat

In TimelineScreen, the chat FAB sits near the bottom-right corner. It's visible in the **편집·음원** step (`TimelineStep.EditAudio`) and hidden while:

- The **자막/더빙** step (`TimelineStep.SubtitleDub`) is active — that step has its own panel.
- A bottom sheet (separation, BGM trim, detail edit) is already up.
- The user is mid-range-selecting or in segment-edit mode.

When the panel is closed, an unread dot on the FAB indicates new assistant messages — including system-emitted completion notices like "음원 분리 완료" that the chat ViewModel collects from `TimelineViewModel.chatAssistantEvents`.

Tap the FAB. A `ModalBottomSheet` rises with:

- A "자주 쓰는 명령" row of context-aware example chips (`buildPrompts` in `ChatPanel.kt`). These adapt to your project — if BGM is present, "삽입한 음원에서 보컬만 분리해줘" appears; with segments loaded, "5초~10초 구간을 2배속으로" appears; "어떤 편집을 할 수 있는지 알려줘" is a special chip that answers locally (no Gemini call) from a hard-coded capability guide.
- A message list (empty on first open).
- A text input + 전송 button.

> The chip list currently still includes "자막 자동으로 생성해줘" / "영어로 자동 더빙해줘" entries from when those features existed. Picking them will surface a Gemini reply but the underlying tools no longer ship — treat those chips as stale until they're removed.

## 2. Ask for something

Type **"5초~10초 구간을 2배속으로"** and send.

The client builds a `ChatRequestDto` (`vibi-mobile/shared/.../data/remote/dto/ChatDto.kt`) and POSTs to `/api/v2/chat`. The body has three top-level fields:

```jsonc
{
  "messages": [
    { "role": "user", "content": "5초~10초 구간을 2배속으로" }
  ],
  "projectContext": { /* compressed timeline snapshot — see below */ },
  "locale": "ko"
}
```

The `projectContext` is a serialized snapshot of every state the model could possibly need to resolve references in the user's request. `ProjectContextBuilder` (in `:shared/domain/chat/`) compresses `TimelineUiState` into:

| Field | What it carries |
|---|---|
| `segments[]` | id, type (VIDEO/IMAGE), order, duration, speed/volume |
| `bgmClips[]` | already-inserted BGM (id, range, volume, speedScale) |
| `separationDirectives[]` | already-separated ranges — `rangeStartMs/EndMs`, `numberOfSpeakers`, `durationMs` |
| `processingSeparations[]` | in-flight separations (chat keeps WF-4-C in mind) |
| `separationStems[]` | per-directive stem state |
| `currentPlayheadMs`, `selectedClipId`, `selectedSegmentId` | what the user is looking at right now |
| `videoDurationMs` | so "끝까지" resolves without guessing |
| `isRangeSelecting`, `pendingRangeStartMs`, `pendingRangeEndMs` | when the user has dragged a range, this is the *truth* for "이 구간..." |

> The whole `chat-tools.md` spec the BFF injects as `systemInstruction` instructs Gemini to *never* invent IDs or timestamps not in `projectContext` — when a reference can't be resolved, the model is required to reply with `kind=text` and ask back rather than guess.

## 3. The two response shapes — `kind=text` vs `kind=proposal`

The BFF route (`vibi-bff/.../routes/ChatRoutes.kt`) calls Vertex AI Gemini with `tools[0].functionDeclarations` = the **9 tools** defined in `ChatToolDefs.kt`. Two response shapes come back:

- **`kind=text`** — used for read-only Q&A ("BGM 몇 개 있어?"), follow-up questions ("어느 구간 말씀하시는 거예요?"), and **confirm gates** ("5s–10s 구간 2배속으로 적용할까요?"). Just gets rendered in the message bubble list.
- **`kind=proposal`** — a typed plan of 1–5 tool calls. Each step has a `name` (one of the 9 registered tools) and `args`. The chat panel shows the rationale; the dispatch fires automatically without an 적용 button.

For "5초~10초 구간을 2배속으로", Gemini first replies with a text confirmation:

```
5s–10s 구간을 2배속으로 적용할게요. 진행할까요?
```

Reply "응" or "진행해줘". The next assistant turn comes back as a proposal:

```jsonc
{
  "kind": "proposal",
  "steps": [
    {
      "name": "update_segment_speed",
      "args": { "segmentId": "seg-…", "speedScale": 2.0, "startMs": 5000, "endMs": 10000 }
    }
  ],
  "rationale": "5s–10s 구간을 2배속으로 변경합니다."
}
```

The user doesn't tap anything — vibi auto-applies (see § 4).

> **`tool_code` fallback** — Gemini 2.5 Flash occasionally ignores `functionDeclarations` and dumps a `tool_code` markdown block with `print(default_api.update_segment_speed(...))` instead. `GeminiClient.recoverToolCallsFromText` regex-restores that into a structured proposal so the client never sees the raw text. Two formats are recognized — Python literal kwargs and YAML pseudo-tool-code.

## 4. Auto-apply — no buttons

This is where chat differs from a direct UI tap.

```kotlin
// vibi-mobile/cmp/.../ui/timeline/TimelineScreen.kt — sketch
LaunchedEffect(chatState.pending) {
    val proposal = chatState.pending ?: return@LaunchedEffect
    chatVm.applyProposal(proposal.steps, timelineVm)
}
```

Three things matter here:

1. **No ProposalCard.** The chat used to render a `[적용 / 수정 / 취소]` button card under each proposal; that surface was removed and replaced with the natural-language confirm gate in § 3. The model itself asks "진행할까요?" and reads the next user turn as the consent signal.

2. **Suspend chain, not parallel launches.** `ChatToolDispatcher.dispatch(steps, vm)` is `suspend`, and so are all the `applyXxxFromChat` methods on `TimelineViewModel`. Steps run one after another, awaiting completion before moving on. This is what lets multi-step proposals like "이 구간 음원 분리 후 background stem 음소거" work without racing — `awaitSeparationCompleteForChat` blocks until the directive is materialized before the next step starts.

3. **Dedicated `applyXxxFromChat` path, not the UI handler.** Most chat tools route through `apply*FromChat` rather than the same `onXxx` the UI taps would call — that bypasses the UI's range-mode guards, confirmation dialogs, and panel auto-opens that would either silently no-op under a dispatcher coroutine or fire stray UI events. A handful of tools that map cleanly to a state-only mutation (`move_bgm_clip`, `update_bgm_volume`, `update_subtitle_text`) still call the general `onXxx` handler — those are safe because their handlers don't depend on UI mode.

The "⏳ 처리 중" placeholder gets pushed to the message log when dispatch starts; the same message id is **replaced** in place with the result summary when dispatch finishes — not appended — so the chat log stays clean and the user can close the panel mid-operation.

## 5. The destructive-edit warning

Try a different command: with separation or BGM already in place, type "처음 5초 잘라줘".

The text-confirm that comes back includes an extra paragraph:

> ⚠ 이 편집을 적용하면 기존 음원 분리 1구간과 BGM 2개가 초기화됩니다. 진행할까요?

The model is instructed by `chat-tools.md` (workflow **WF-1**) to detect structural segment edits (`delete_segment_range` / `duplicate_segment_range` / `update_segment_speed`) and append this warning whenever `separationDirectives` / `bgmClips` are non-empty — because those structural edits shift the timeline length and invalidate every downstream artifact.

The warning lives in the rationale of the confirm-text turn, not as a separate dialog — vibi's design treats the chat thread itself as the unified confirmation surface. The user reads it and types 응 / 아니. `update_segment_volume` is exempt (mix change, not structural).

## 6. Separation overlap negotiation

Another behavior worth seeing in action: try "8초~15초 구간 보컬만 남겨줘" *after* you've already separated 0s–10s.

Instead of jumping to a proposal, you get `kind=text` (workflow **WF-3**):

> 이미 0s–10s 구간이 분리되어 있어 8s–15s 와 겹칩니다. 세 가지 선택지가 있어요:
>
> A. 기존 분리를 삭제하고 8s–15s 로 새로 분리 (예상 ~7분, 기존 결과 잃음)
> B. 겹치지 않는 부분만 분리: 10s–15s (예상 ~5분, 기존 결과 보존) ← 추천
> C. 더 짧게 쪼개 분리
>
> 어떻게 할까요?

The model derives the overlap from `projectContext.separationDirectives[]` and applies the cost-optimal ordering **B > C > A** prescribed by `chat-tools.md`. You pick one in chat, the model emits a single-step proposal, vibi auto-applies — same `applyXxxFromChat` path runs.

## 7. Stem chain after separation (WF-4)

The "first ask the underlying separation, then mute a stem" flow:

- User: "이 구간 보컬만 남겨줘" (and there are no stems yet on that range)
- Model (WF-4-B): `kind=text` "분리가 필요합니다. 분리 후 배경음 음소거를 자동 적용할게요. (분리 약 ~3분) 진행할까요?"
- User: "응"
- Model: `kind=proposal` → `separate_audio_range(...)`. Auto-applied.
- vibi runs separation. When `chatAssistantEvents` emits the completion, the model is re-prompted with the refreshed `projectContext` containing the new stems.
- Model (auto-chain, no extra confirm): `kind=proposal` → `update_stem_volume(stemId="background", volume=0)`. Auto-applied.
- Model: "배경음 음소거 완료."

If a separation is already running (`processingSeparations[]` non-empty), WF-4-C kicks in: the model promises to apply the stem change when the job ends and **doesn't** start another separation.

## 8. Where the chat lands in code

A request-to-effect map:

```
ChatPanel (UI)
  → ChatViewModel.send(text, projectContext)
     → ChatRepository.chat(ChatRequestDto)
        → BffApi.chat() → POST /api/v2/chat
                            → ChatRoutes (vibi-bff) → GeminiClient.chat()
                              → Vertex AI generateContent
                            ← ChatResponseDto { kind, steps?, rationale? }
     ← ChatResponseDto, parked in chatState.pending if kind=proposal
  ← MessageBubble rendered

  TimelineScreen LaunchedEffect(chatState.pending) fires
  → ChatViewModel.applyProposal(steps, timelineVm)
     → ChatToolDispatcher.dispatch(steps, vm) [suspend]
        → vm.applyDeleteRangeFromChat(...) | applySeparateRangeFromChat(...) | …
           → existing StartSeparationUseCase / segment use-cases
              (same code path the panel UI uses, just without UI ceremony)
```

`ProjectContextBuilder` + `ChatToolDispatcher` + the per-tool `applyXxxFromChat` methods are the entire client-side chat surface. The 9 tool definitions and the system instruction live in `vibi-bff/src/main/resources/chat-tools.md` — one file, both sides agree.

---

## To reconstruct the same flow in your own app

A "natural language edits a typed timeline" pattern in three pieces:

1. **A spec file** the BFF injects as `systemInstruction` — tool definitions + behavior rules + workflows. One file is the single source of truth for both sides.
2. **A context builder** that serializes whatever the model needs to resolve references — never let the model invent IDs or timestamps.
3. **A dispatcher** with a dedicated `applyXxxFromChat` entry per tool — bypasses the UI's guard rails but reuses the same domain use-cases. Suspend, not parallel. Auto-apply on `kind=proposal`; let the model handle the confirm gate in natural language.

Key BFF endpoint reference: [`../reference/bff-api.md#chat-gemini-function-calling`](../reference/bff-api.md#chat-gemini-function-calling).

---

## Up next

- BFF side of the same flow (request/response shape, tool list, fallback regex): [`../reference/bff-api.md#chat-gemini-function-calling`](../reference/bff-api.md#chat-gemini-function-calling)
- The full tool spec (verbatim from `systemInstruction`): `vibi-bff/src/main/resources/chat-tools.md`
- The non-chat way to drive the same edits: [`tutorial-stem-separation.md`](./tutorial-stem-separation.md)
