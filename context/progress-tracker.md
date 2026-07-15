# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Feature 03 (auth)

## Current Goal

- (idle)

## Completed

- feature 01: Design system (shadcn/ui + lucide-react) — Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea components installed with dark-only theme with tailwind v4.
- feature 02: Editor chrome — `EditorNavbar` (top bar with sidebar toggle) and `ProjectSidebar` (floating left overlay with Projects header, Tabs for My Projects / Shared, and full-width New Project button). shadcn `Dialog` is now wired to the project's design tokens and ready for future use.
- feature 03: Auth — Clerk wired into the Next.js app. `ClerkProvider` wraps the root layout using the `dark` theme from `@clerk/ui/themes` with appearance variables mapped to `globals.css` tokens. Sign-in (`/sign-in/[[...sign-in]]`) and sign-up (`/sign-up/[[...sign-up]]`) use a two-panel layout (compact logo + tagline + feature list on the left, centered Clerk form on the right; form-only on small screens). `proxy.ts` at the project root runs `clerkMiddleware` with public routes `/sign-in(.*)` and `/sign-up(.*)`, protecting everything else by default. The root `/` redirects authenticated users to `/editor` and unauthenticated users to `/sign-in`. `<UserButton />` is added to the editor navbar's right section. `npm run build` passes; no new lint errors.

## In Progress

- None

## Next Up

- feature 04: TBD

## Open Questions

- Not yet

## Architecture Decisions

- shadcn/ui over Tailwind v4 (CSS-based token config via @theme inline in globals.css, no tailwind.config.js).

- Dark-only theme: all shadcn :root variables set to dark values directly — no .dark class switching.

- Do not modify generated components/ui/* files after shadcn installation.

## Session Notes

- Add context needed to resume work in the next session.
- 2026-07-14: feature 03 auth pages UI refined to match the reference layout — 50/50 grid, brand panel on the left with logo + headline + three icon-chipped feature rows + footer copyright, form panel on the right with a rounded-3xl `bg-bg-elevated` card housing the Clerk form and a contextual "Don't have an account? / Sign up" link below. Left panel uses `bg-bg-surface` so it differentiates from the base. Brand wordmark is "Ghost dev" (matches the screenshot). Geist Sans is the body default from `--font-geist-sans`; no new fonts added.
