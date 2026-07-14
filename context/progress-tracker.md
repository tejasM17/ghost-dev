# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Feature 03 (TDB)

## Current Goal

- Define the immediate implementation goal here

## Completed

- feature 01: Design system (shadcn/ui + lucide-react) — Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea components installed with dark-only theme with tailwind v4.
- feature 02: Editor chrome — `EditorNavbar` (top bar with sidebar toggle) and `ProjectSidebar` (floating left overlay with Projects header, Tabs for My Projects / Shared, and full-width New Project button). shadcn `Dialog` is now wired to the project's design tokens and ready for future use.

## In Progress

- None

## Next Up

- feature 03: TBD

## Open Questions

- Not yet

## Architecture Decisions

- shadcn/ui over Tailwind v4 (CSS-based token config via @theme inline in globals.css, no tailwind.config.js).

- Dark-only theme: all shadcn :root variables set to dark values directly — no .dark class switching.

- Do not modify generated components/ui/* files after shadcn installation.

## Session Notes

- Add context needed to resume work in the next session.
