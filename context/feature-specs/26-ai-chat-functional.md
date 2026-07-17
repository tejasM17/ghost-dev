Wire up the AI sidebar so users can submit design prompts, track AI run status
in real time, and reflect AI-driven canvas updates through Liveblocks.

### Implementation

1. Submit from AI sidebar

- On submit:
  - push the user message to the `ai-chat` feed
  - call `POST /api/ai/design` with `{ prompt, roomId }`
  - read `{ runId, publicToken }` from the response
- store `runId` and `publicToken` in local state

2. Run status tracking

- Use `useRealtimeRun(runId, { accessToken: publicToken })`
- While the run is active:
  - disable the chat input
  - show a loading state (spinner in the button is enough)
- When the run completes:
  - push a final AI message to `ai-chat`
  - reset loading + run state

3. Canvas updates (realtime)

- Do not manually update nodes/edges
- Rely on Liveblocks (`useLiveblocksFlow`) to reflect changes in real time
- AI updates to nodes, edges, and presence should appear automatically

4. Status display

- Read the latest message from `ai-status-feed`
- Show a compact status strip above the input only when a run is active

### UI Details

- Use existing design tokens from `global.css` (do not introduce new colors)
- Follow `ui-context.md` for layout and visual consistency

Chat bubbles

- User: green accent background (`#62C073`), readable contrast text
- AI: dark background, light text

Submit button

- Enabled: green accent (`#62C073`)
- Disabled: dimmed state
- While running: show spinner

Status strip

- Compact bar above input
- Dark base + green accent
- Subtle animated indicator is fine

General

- Use Tailwind + shadcn/ui only
- Keep current layout intact
- Show errors as messages in `ai-chat` feed

### Scope Limits

- Do not implement backend or Trigger.dev logic
- Do not fetch final graph data
- Do not redesign the sidebar
- Do not hardcode a new theme outside existing tokens
- Do not manually sync canvas state

---

### Notes

- Follow Liveblocks best practices for feeds (`ai-chat`, `ai-status-feed`)
- Keep everything collaborative, all updates should be visible across clients

---

### Check When Done

- Submitting a prompt calls `/api/ai/design` and returns a `runId`
- `useRealtimeRun` connects using the returned token
- Input is disabled while the run is active
- Status strip appears only during active runs
- Chat updates appear across multiple sessions
- No TypeScript or build errors
