# Progress Tracker

Keep this file short. Read feature specs + code for detail.

## Phase

- **Feature 18** — completed
- Next: feature 19 (TBD)

## Stack (quick)

| Layer | Tech |
| --- | --- |
| App | Next.js 16 + TypeScript |
| UI | Tailwind v4 + shadcn (dark-only tokens in `globals.css`) |
| Auth | Clerk (`proxy.ts` middleware) |
| DB | Prisma 7 + PostgreSQL (`lib/prisma.ts`, `prisma/models/`) |
| Canvas | Liveblocks + React Flow (`@liveblocks/react-flow`) |
| Types | `types/canvas.ts` — `CanvasNode` / `CanvasEdge` |

## Done (features 01–18)

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

## Feature 18 (current)

- Built-in templates: Microservices, CI/CD Pipeline, Event-Driven System
- Template data uses shared `CanvasNode` / `CanvasEdge` + `NODE_COLORS` palette
- Import modal: card grid with lightweight SVG previews (no React Flow)
- Navbar **Templates** button opens modal
- Import clears existing nodes/edges first, then adds template (replace, not merge)
- Fresh IDs on import; `fitView` after load; stays in Liveblocks collaborative state
- No template saving / custom templates / server persistence

## Architecture invariants

- RSC by default; `"use client"` only for interactivity / realtime
- Project metadata in Postgres; canvas graph in Liveblocks room storage
- Auth + ownership checked on every mutation API
- UI tokens only (`bg-base`, `text-copy-*`, etc.) — no raw color utilities
- Canvas types stay shared: `types/canvas.ts`
- Do not invent features — follow `context/feature-specs/*` and user context

## Open

- None

## Context files (read order for new work)

1. `project-overview.md`
2. `architecture-context.md`
3. `ui-context.md`
4. `code-standards.md`
5. `ai-workflow-rules.md`
6. This tracker + the active feature spec
