# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Feature 05 (Prisma schema & data layer) — completed

## Current Goal

- Define the immediate goles here

## Completed

- feature 01: Design system (shadcn/ui + lucide-react) — Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea components installed with dark-only theme with tailwind v4.
- feature 02: Editor chrome — `EditorNavbar` (top bar with sidebar toggle) and `ProjectSidebar` (floating left overlay with Projects header, Tabs for My Projects / Shared, and full-width New Project button). shadcn `Dialog` is now wired to the project's design tokens and ready for future use.
- feature 03: Auth — Clerk wired into the Next.js app. `ClerkProvider` wraps the root layout using the `dark` theme from `@clerk/ui/themes` with appearance variables mapped to `globals.css` tokens. Sign-in (`/sign-in/[[...sign-in]]`) and sign-up (`/sign-up/[[...sign-up]]`) use a two-panel layout (compact logo + tagline + feature list on the left, centered Clerk form on the right; form-only on small screens). `proxy.ts` at the project root runs `clerkMiddleware` with public routes `/sign-in(.*)` and `/sign-up(.*)`, protecting everything else by default. The root `/` redirects authenticated users to `/editor` and unauthenticated users to `/sign-in`. `<UserButton />` is added to the editor navbar's right section. `npm run build` passes; no new lint errors.
- feature 04: Project dialogs & editor home — `useProjectDialogs` hook (in `hooks/use-project-dialogs.ts`) owns the mock project list and centralizes dialog/form/loading state. Mock data lives in `lib/mock-projects.ts` with a shared `slugify` helper and per-project `role: "owner" | "collaborator"`. The editor home view (`components/editor/editor-home.tsx`) renders the heading, description, and a `New Project` button — no card. Three dialogs: `CreateProjectDialog` (name input with live slug preview using `slugify`), `RenameProjectDialog` (prefilled name, current name in the description, auto-focus + select, Enter submits via form `onSubmit`), and `DeleteProjectDialog` (destructive confirm button, no input). The sidebar now lists mock projects per tab; owned rows expose a `MoreHorizontal` menu with Rename / Delete, collaborator rows show no actions. A mobile-only backdrop scrim is rendered behind the sidebar on `md:hidden` and closes the sidebar on tap. `npm run build` passes; no new lint errors.
- feature 05: Prisma schema & data layer — schema split: `prisma/schema.prisma` keeps the datasource + generator blocks, `prisma/models/project.prisma` defines the models. `Project` carries `ownerId`, `name`, optional `description`, `ProjectStatus` enum (`DRAFT` / `ARCHIVED`) defaulting to `DRAFT`, optional `canvasJsonPath` blob reference, and `createdAt` / `updatedAt` timestamps; indexes on `ownerId` and `createdAt`. `ProjectCollaborator` carries `projectId` (FK to `Project` with `onDelete: Cascade`), `email`, and `createdAt`; unique constraint on `(projectId, email)`; indexes on `email` and `(projectId, createdAt)`. `lib/prisma.ts` is a cached singleton — in dev, stashed on `globalThis` to survive HMR — that branches on `DATABASE_URL`: `prisma+postgres://` uses Prisma Accelerate (`accelerateUrl` + `withAccelerate()` extension), anything else uses `PrismaPg` driver adapter. Generated client lives in `app/generated/prisma` and is gitignored. Initial migration `20260715063438_init_project_models` applied. `npm run build` passes; no new lint errors (the two pre-existing shadcn `interface` warnings in `components/ui/input.tsx` and `components/ui/textarea.tsx` are unchanged).

## In Progress

- None

## Next Up

- feature 06: TBD

## Open Questions

- Not yet

## Architecture Decisions

- shadcn/ui over Tailwind v4 (CSS-based token config via @theme inline in globals.css, no tailwind.config.js).

- Dark-only theme: all shadcn :root variables set to dark values directly — no .dark class switching.

- Do not modify generated components/ui/* files after shadcn installation.

## Session Notes

- Add context needed to resume work in the next session.
- 2026-07-14: feature 03 auth pages UI refined to match the reference layout — 50/50 grid, brand panel on the left with logo + headline + three icon-chipped feature rows + footer copyright, form panel on the right with a rounded-3xl `bg-bg-elevated` card housing the Clerk form and a contextual "Don't have an account? / Sign up" link below. Left panel uses `bg-bg-surface` so it differentiates from the base. Brand wordmark is "Ghost dev" (matches the screenshot). Geist Sans is the body default from `--font-geist-sans`; no new fonts added.
- 2026-07-15: feature 04 implemented exactly per spec. Dialog state is centralized in `useProjectDialogs` (no `useReducer`; small surface, `useState` + `useTransition` is enough). The dialog form pattern (controlled name value, ref-based auto-focus on open) means the hook owns the field state, so the dialog components stay presentational. Slug preview uses the same `slugify` helper that mutation uses, so the preview matches the stored value. Mobile backdrop is a sibling `<button>` rendered before the `<aside>` and only enabled on `md:hidden` — clicking it calls `onClose`, which is the same prop the X button uses. Two pre-existing lint errors in `components/ui/input.tsx` and `components/ui/textarea.tsx` (empty `extends React.HTMLAttributes` interfaces from shadcn) are unchanged — those files are protected foundation components.
- 2026-07-15: feature 05 implemented exactly per spec. Schema split mirrors the planned "one file per aggregate" pattern from the context files (the spec's `prisma/models/project.prisma` becomes the home for project-related models, leaving `schema.prisma` as a thin shell with just `generator` + `datasource`). `ProjectCollaborator` was modelled with the `project` relation field plus the FK column — Prisma only requires one side, but having the typed `project` field on the child model means callers can `include: { project: true }` and get a typed return without a second query. The unique constraint on `(projectId, email)` is the project's hard rule (one row per email per project), so it's enforced at the DB layer. The Accelerate branch installs `@prisma/extension-accelerate` (the spec listed it as "Already installed" but the package wasn't in `package.json` — added it) and wires `withAccelerate()` to the base `PrismaClient` constructed with `accelerateUrl`. The non-Accelerate branch uses `new PrismaPg({ connectionString })` per the v7 driver-adapter workflow (`datasourceUrl` does not exist on `PrismaClient` in v7). Both branches return the same `PrismaClient` type so the consumer import is unchanged.
