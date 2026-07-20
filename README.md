# Ghost AI

[Liveblocks](https://liveblocks.io/docs) · [Trigger.dev](https://trigger.dev/docs) · [Clerk](https://clerk.com/docs) · [Prisma](https://www.prisma.io/docs) · [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) · [Next.js](https://nextjs.org/docs)

Real-time collaborative system design workspace: prompt an AI agent onto a shared canvas, refine with collaborators, generate Markdown specs.

**Stack:** Next.js 16 · Clerk · Prisma + PostgreSQL · Liveblocks + React Flow · Trigger.dev · Vercel Blob · Google AI (Gemini)

## Local setup

### Prerequisites

- Node.js 20+
- PostgreSQL
- Accounts/keys for the services linked above, plus [Google AI](https://ai.google.dev)

### Install

```bash
npm install
```

`postinstall` runs `prisma generate`.

### Environment

Copy keys into `.env.local` (and `DATABASE_URL` in `.env` if Prisma CLI needs it):

```bash
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?schema=public"

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/editor
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/editor
NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL=/

# Liveblocks
LIVEBLOCKS_SECRET_KEY=
LIVEBLOCKS_PUBLIC_KEY=

# Trigger.dev
# Local: use the DEV secret (tr_dev_...) from the Trigger.dev dashboard → API keys.
# Production (Vercel/hosting): set the PROD secret (tr_prod_...) and run:
#   npx trigger.dev@latest deploy
# Never put tr_prod_ in .env.local while developing — runs will go to Production
# with no local worker and sit in "Pending version".
TRIGGER_SECRET_KEY=

# Vercel Blob (canvas snapshots + specs)
BLOB_READ_WRITE_TOKEN=

# Google AI (design + spec agents)
GOOGLE_AI_API_KEY=
```

### Database

```bash
npx prisma migrate dev
```

### Run

Two terminals:

```bash
# App
npm run dev
```

```bash
# Background tasks (design + spec generation)
npx trigger.dev@latest dev
```

Open [http://localhost:3000](http://localhost:3000).

Product/architecture notes: `context/project-overview.md`, `context/architecture-context.md`, `context/progress-tracker.md`.
