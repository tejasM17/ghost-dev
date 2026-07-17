# Progress Tracker

Keep this file short. Read feature specs + code for detail.

## Phase

- **Feature 25** — Completed
- Next: feature 26 (TBD)

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

## Done (features 01–25)

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

## Feature 25 (current)

- `types/tasks.ts` — `AI_CHAT_FEED_ID`, `aiChatFeedMessageSchema` / `parseAiChatFeedPayload` (sender, role, content, timestamp)
- Liveblocks feed id `ai-chat` (room-scoped; separate from `ai-status-feed`)
- `ai-chat-feed.tsx` — ensure feed, non-suspense `useFeedMessages`, `useCreateFeedMessage` send
- `ai-sidebar.tsx` — subscribe/render chat (sender, time, content); clear input on success; send error line
- `ai-status-feed.tsx` — switched to non-suspense feed hooks (avoids timeout crash)
- `POST /api/liveblocks-auth` — ensures `ai-status-feed` + `ai-chat` exist before clients connect
- `liveblocks.config.ts` — `FeedMessageData` union of status + chat payloads
- Scope: collaborative chat only (no AI replies / design task triggers)

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
