# Progress Tracker

Keep this file short. Read feature specs + code for detail.

## Phase

- **Feature 29** — Completed
- Next: feature 30 (TBD)

## Stack (quick)

| Layer | Tech |
| --- | --- |
| App | Next.js 16 + TypeScript |
| UI | Tailwind v4 + shadcn (dark-only tokens in `globals.css`) |
| Auth | Clerk (`proxy.ts` middleware) |
| DB | Prisma 7 + PostgreSQL (`lib/prisma.ts`, `prisma/models/`) |
| Canvas | Liveblocks + React Flow (`@liveblocks/react-flow`) |
| Blob | Vercel Blob (`@vercel/blob`) — canvas JSON + Markdown specs |
| Jobs | Trigger.dev (`src/trigger/`, `@trigger.dev/sdk`) |
| Types | `types/canvas.ts`, `types/tasks.ts` (AI status + chat feed schemas) |

## Done (features 01–29)

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
| 28 | Spec persistence + download | `ProjectSpec`, blob upload in `generate-spec`, download route |
| 29 | Spec UI integration | Specs tab list/preview/download in AI sidebar |

## Bugfixes
- Hide third-party branding UI: Clerk "Development mode" / "Secured by clerk" footer (`app/layout.tsx` appearance) and Liveblocks "Powered by" badge (`#liveblocks-badge` in `app/globals.css`)

## Architecture invariants

- RSC by default; `"use client"` only for interactivity / realtime
- Project metadata in Postgres; live graph in Liveblocks; canvas snapshots + specs in Vercel Blob
- Auth + ownership checked on every mutation API
- UI tokens only (`bg-base`, `text-copy-*`, etc.) — no raw color utilities
- Canvas types stay shared: `types/canvas.ts`
- Do not invent features — follow `context/feature-specs/*` and user context
- Chat feed (`ai-chat`) stays separate from status feed (`ai-status-feed`)
- Spec access is resolved from authenticated user + `roomId` (never client-supplied project IDs)
- Spec download routes re-check project access and never expose private Blob URLs
- Spec list returns metadata only; preview content is fetched on demand via the download route

## Open

- None

## Context files (read order for new work)

1. `project-overview.md`
2. `architecture-context.md`
3. `ui-context.md`
4. `code-standards.md`
5. `ai-workflow-rules.md`
6. This tracker + the active feature spec
