# Progress Tracker

Keep this file short. Read feature specs + code for detail.

## Phase

- **Feature 27** — Completed
- Next: feature 28 (TBD)

## Stack (quick)

| Layer | Tech |
| --- | --- |
| App | Next.js 16 + TypeScript |
| UI | Tailwind v4 + shadcn (dark-only tokens in `globals.css`) |
| Auth | Clerk (`proxy.ts` middleware) |
| DB | Prisma 7 + PostgreSQL (`lib/prisma.ts`, `prisma/models/`) |
| Canvas | Liveblocks + React Flow (`@liveblocks/react-flow`) |
| Blob | Vercel Blob (`@vercel/blob`) — canvas JSON snapshots |
| Jobs | Trigger.dev (`src/trigger/`, `@trigger.dev/sdk`) |
| Types | `types/canvas.ts`, `types/tasks.ts` (AI status + chat feed schemas) |

## Done (features 01–27)

| # | Feature | Key locations |
| --- | --- | --- |
| 01 | Design system | `components/ui/*`, `app/globals.css` |
| 02 | Editor chrome | `editor-navbar.tsx`, `project-sidebar.tsx` |
| 03 | Auth | Clerk provider, `/sign-in`, `/sign-up`, `proxy.ts` |
| 04 | Project dialogs | create/rename/delete dialogs, mock → later wired |
| 05 | Prisma | `Project`, `ProjectCollaborator`, `lib/prisma.ts` |
| 06 | Project APIs | `app/api/projects/**` |
| 07 | Editor home wired | `hooks/use-project-actions.ts`, `app/editor/page.tsx` |
| 08 | Workspace shell | `app/editor/[roomId]`, `workspace-shell.tsx`, access checks |
| 09 | Share dialog | collaborators APIs, `share-dialog.tsx` |
| 10 | Liveblocks setup | `liveblocks.config.ts`, `POST /api/liveblocks-auth` |
| 11 | Base canvas | `canvas.tsx` + `useLiveblocksFlow` |
| 12 | Shape panel | `shape-panel.tsx` drag → drop create nodes |
| 13 | Node shapes | `node-shape-visual.tsx`, drag ghost |
| 14 | Node editing | resize, label edit, 4 handles — `canvas-node.tsx` |
| 15 | Color toolbar | `node-color-toolbar.tsx`, `NODE_COLORS` |
| 16 | Edge behavior | `canvas-edge.tsx` — smooth-step, arrows, labels |
| 17 | Canvas ergonomics | `canvas-controls.tsx`, `hooks/useKeyboardShortcuts.ts` |
| 18 | Starter templates | `starter-templates.ts`, `starter-templates-modal.tsx` |
| 19 | Presence avatars & cursors | `presence-avatars.tsx`, `live-cursors.tsx`, `liveblocks.config.ts` |
| 20 | AI sidebar shell | `ai-sidebar.tsx`, wired from `workspace-shell.tsx` |
| 21 | Canvas autosave | `PUT/GET /api/projects/[projectId]/canvas`, `use-canvas-autosave`, `use-canvas-load` |
| 22 | Design agent API | `POST /api/ai/design`, `POST /api/ai/design/token`, `TaskRun`, `src/trigger/design-agent.ts` |
| 23 | Design agent logic | Gemini plan → `mutateFlow` canvas writes, AI presence + status feed |
| 24 | AI presence state | Liveblocks feed `ai-status-feed`, sidebar thinking UI, cursor spinners |
| 25 | Sidebar chat feed | Liveblocks feed `ai-chat`, Zod validation, send via sidebar input |
| 26 | AI chat functional | design submit + `useRealtimeRun`, status strip, AI final chat message |
| 27 | Spec generation flow | `POST /api/ai/spec`, `POST /api/ai/spec/token`, `src/trigger/generate-spec.ts` |

## Feature 27 (done)

Verified against `context/feature-specs/27-spec-generation-flow.md`:

- **Trigger**: `POST /api/ai/spec` accepts `{ roomId, chatHistory, nodes, edges }`, auth + access via `roomId` (no client `projectId`), triggers `generate-spec`, creates `TaskRun`, returns `runId`
- **Token**: `POST /api/ai/spec/token` accepts `runId`, verifies TaskRun owner, issues Trigger public token scoped to that run with `expirationTime: "1hr"`
- **Task**: `src/trigger/generate-spec.ts` — Zod payload, Gemini Markdown via `@ai-sdk/google` + `generateText`, run `metadata` for status, returns plain Markdown in task output (no persistence)
- **Scope**: backend only — no frontend, no spec editor, no final spec storage
- **Key files**: `app/api/ai/spec/route.ts`, `app/api/ai/spec/token/route.ts`, `src/trigger/generate-spec.ts`

## Feature 26 (done)

Verified against `context/feature-specs/26-ai-chat-functional.md`:

- **Submit**: user msg → `ai-chat` feed → `POST /api/ai/design` with `{ prompt, roomId, projectId }` → store `runId` + `publicToken` (token from response or `POST /api/ai/design/token`)
- **Run tracking**: `useRealtimeRun(runId, { accessToken: publicToken })`; input disabled + button spinner while active
- **On complete/fail**: push assistant message to `ai-chat`, clear run state; API/network errors also as chat messages
- **Status strip**: latest text from `ai-status-feed` via `useAiActivityState`, only while run active
- **Canvas**: no manual node/edge sync — Liveblocks/`useLiveblocksFlow` only
- **UI**: user bubbles + submit use green `#62C073` (palette); AI bubbles dark elevated
- **Wiring**: `workspace-shell` passes `roomId` + `projectId` + `roomConnected` into `AiSidebar`
- **Scope**: frontend only (no backend/Trigger task changes)
- **Key files**: `components/editor/ai-sidebar.tsx`, `ai-chat-feed.tsx`, `ai-status-feed.tsx`

## Bugfixes (shared projects + sidebar)

- Collaborator "Feed messages fetch timeout" at `AiSidebar` / `RoomAwareArchitectTab`: ensure feeds on auth + non-suspense `useFeedMessages` so errors do not crash the tree

## Architecture invariants

- RSC by default; `"use client"` only for interactivity / realtime
- Project metadata in Postgres; live graph in Liveblocks; canvas snapshots in Vercel Blob
- Auth + ownership checked on every mutation API
- UI tokens only (`bg-base`, `text-copy-*`, etc.) — no raw color utilities
- Canvas types stay shared: `types/canvas.ts`
- Do not invent features — follow `context/feature-specs/*` and user context
- Chat feed (`ai-chat`) stays separate from status feed (`ai-status-feed`)
- Spec access is resolved from authenticated user + `roomId` (never client-supplied project IDs)

## Bugfixes (Liveblocks canvas issues 2–8)

- currently have no Bugs Or Errors

## Open

- None

## Context files (read order for new work)

1. `project-overview.md`
2. `architecture-context.md`
3. `ui-context.md`
4. `code-standards.md`
5. `ai-workflow-rules.md`
6. This tracker + the active feature spec
