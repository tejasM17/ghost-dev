# Progress Tracker

Keep this file short. Read feature specs + code for detail.

## Phase

- **Feature 23** — Completed
- Next: feature 24 (TBD)

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
| Types | `types/canvas.ts` — `CanvasNode` / `CanvasEdge` |

## Done (features 01–23)

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
| 23 | Design agent logic | Gemini plan → `mutateFlow` canvas writes, AI presence + `AI_STATUS` feed |

## Feature 23 (current)

- `src/trigger/design-agent.ts` — full agent: Gemini (`@ai-sdk/google` + `generateObject`) plans canvas actions, applies them via `@liveblocks/react-flow/node` `mutateFlow`
- Supported actions: add/move/resize/update/delete node, add/delete edge
- Design constraints enforced in the model schema/prompt: `NODE_SHAPES`, `NODE_COLORS`, layout spacing
- AI presence via `liveblocks.setPresence` (cursor + `thinking`); cleared when the run ends
- Status feed via `liveblocks.broadcastEvent` (`AI_STATUS` phases: start / processing / complete / error)
- Client: `ai-status-feed.tsx` + thinking cues on cursors/avatars; `RoomEvent` typed in `liveblocks.config.ts`
- Errors publish status and clear presence without leaving the room in a broken presence state

## Bugfixes (shared projects + sidebar)

- currently have no Bugs Or Errors

## Architecture invariants

- RSC by default; `"use client"` only for interactivity / realtime
- Project metadata in Postgres; live graph in Liveblocks; canvas snapshots in Vercel Blob
- Auth + ownership checked on every mutation API
- UI tokens only (`bg-base`, `text-copy-*`, etc.) — no raw color utilities
- Canvas types stay shared: `types/canvas.ts`
- Do not invent features — follow `context/feature-specs/*` and user context

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
