# Progress Tracker

Keep this file short. Read feature specs + code for detail.

## Phase

- **Feature 21** — Completed
- Next: feature 22 (TBD)

## Stack (quick)

| Layer | Tech |
| --- | --- |
| App | Next.js 16 + TypeScript |
| UI | Tailwind v4 + shadcn (dark-only tokens in `globals.css`) |
| Auth | Clerk (`proxy.ts` middleware) |
| DB | Prisma 7 + PostgreSQL (`lib/prisma.ts`, `prisma/models/`) |
| Canvas | Liveblocks + React Flow (`@liveblocks/react-flow`) |
| Blob | Vercel Blob (`@vercel/blob`) — canvas JSON snapshots |
| Types | `types/canvas.ts` — `CanvasNode` / `CanvasEdge` |

## Done (features 01–21)

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

## Feature 21 (current)

- Reused `Project.canvasJsonPath` for blob URL metadata (Prisma only)
- Installed `@vercel/blob`; canvas JSON at `canvas/{projectId}.json`
- `PUT/GET /api/projects/[projectId]/canvas` — auth via project access, Blob + Prisma
- Debounced autosave hook (`hooks/use-canvas-autosave.ts`) — status: idle/saving/saved/error
- Empty-room hydrate from blob (`hooks/use-canvas-load.ts`); skips if room has nodes/edges
- Navbar Save indicator shows saving / saved / error

## Bugfixes (shared projects + sidebar)

- Invite UI: stop calling `.toISOString()` on JSON `createdAt` strings (`hooks/use-share-dialog.ts`)
- Collaborator email lookups always lowercased (`lib/auth.ts`, `lib/project-access.ts`, collaborators API)
- Liveblocks ID-token rooms: `updateRoom` grants `room:write` on every auth; invite/remove sync room `usersAccesses`
- Project sidebar: 3-dot menu `stopPropagation` so rename/delete does not open the canvas

## Architecture invariants

- RSC by default; `"use client"` only for interactivity / realtime
- Project metadata in Postgres; live graph in Liveblocks; canvas snapshots in Vercel Blob
- Auth + ownership checked on every mutation API
- UI tokens only (`bg-base`, `text-copy-*`, etc.) — no raw color utilities
- Canvas types stay shared: `types/canvas.ts`
- Do not invent features — follow `context/feature-specs/*` and user context

## Bugfixes (Liveblocks canvas issues 2–8)

- Delete/Backspace: use Liveblocks `onDelete` (not `type: "remove"` changes — those are no-ops in `@liveblocks/react-flow`); RF `deleteKeyCode={null}`
- Drop places node centered on cursor; removed React Flow `fitView` auto-zoom on first drop
- Connection handles stacked above shape with z-index; visible when selected
- `img.clerk.com` in `next.config.js` `images.remotePatterns`
- Workspace navbar had no UserButton already (UserButton on presence strip / editor home only)
- Create project dialog UI polish (`create-project-dialog.tsx`)

## Open

- None

## Context files (read order for new work)

1. `project-overview.md`
2. `architecture-context.md`
3. `ui-context.md`
4. `code-standards.md`
5. `ai-workflow-rules.md`
6. This tracker + the active feature spec
