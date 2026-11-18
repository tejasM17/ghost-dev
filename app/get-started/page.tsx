import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Bot,
  Check,
  FileText,
  GitBranch,
  Layers3,
  MousePointer2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BrandMark } from "@/components/brand/brand-mark";

const capabilities = [
  {
    icon: Layers3,
    title: "Start from a pattern",
    description:
      "Import a ready-made monolith, microservices, event-driven, or serverless architecture, then shape it for your system.",
  },
  {
    icon: Bot,
    title: "Design with AI",
    description:
      "Describe what you are building. Ghost maps your prompt into architecture nodes and connections on the canvas.",
  },
  {
    icon: Users,
    title: "Refine together",
    description:
      "Invite collaborators into the same live workspace. See presence and cursors as your team edits the design.",
  },
  {
    icon: FileText,
    title: "Ship a clear spec",
    description:
      "Turn the finished graph into a Markdown technical specification you can review and download.",
  },
];

const steps = [
  ["01", "Describe", "Set the system context and tell the AI what you want to design."],
  ["02", "Map it", "Generate a connected architecture, or add shapes and services yourself."],
  ["03", "Collaborate", "Bring your team into the canvas to discuss and refine the system."],
  ["04", "Document", "Generate a Markdown spec from the design and keep it with your project."],
];

export const metadata = {
  title: "Get started | Ghost AI",
  description:
    "Explore how Ghost AI turns system ideas into collaborative architecture diagrams and technical specifications.",
};

export default function GetStartedPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-bg-base text-text-primary">
      <header className="border-b border-border-default/70">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
          <Link href="/get-started" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span className="grid size-8 place-items-center rounded-xl bg-accent-primary text-bg-base">
              <BrandMark className="size-5" />
            </span>
            Ghost<span className="text-text-muted">AI</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/sign-in" className="px-3 py-2 text-sm text-text-secondary transition hover:text-text-primary">
              Sign in
            </Link>
            <Button asChild className="rounded-xl bg-accent-primary px-4 text-bg-base hover:bg-accent-primary/90">
              <Link href="/sign-up">Get started <ArrowRight className="ml-2 size-4" /></Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 pb-24 pt-20 lg:grid-cols-[1fr_0.9fr] lg:px-10 lg:pb-32 lg:pt-28">
        <div className="pointer-events-none absolute -left-48 top-0 size-[30rem] rounded-full bg-accent-dim opacity-30 blur-3xl" />
        <div className="relative">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border-default bg-bg-surface px-3 py-1.5 text-xs text-text-secondary">
            <span className="size-1.5 rounded-full bg-accent-primary" />
            A shared workspace for system design
          </div>
          <h1 className="max-w-2xl text-5xl font-semibold leading-[1.08] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
            From a system idea to a design your team can <span className="text-accent-primary">build from.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-text-muted">
            Ghost AI gives your team one place to map services, explore architecture with AI, work through decisions together, and turn the result into a technical spec.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Button asChild size="lg" className="h-12 rounded-xl bg-accent-primary px-6 text-bg-base hover:bg-accent-primary/90">
              <Link href="/sign-up">Create your workspace <ArrowRight className="ml-2 size-4" /></Link>
            </Button>
            <Link href="/sign-in" className="text-sm text-text-secondary transition hover:text-text-primary">
              Already have an account? <span className="text-accent-primary">Sign in</span>
            </Link>
          </div>
          <p className="mt-5 text-xs text-text-faint">Sign up or sign in to continue to your editor.</p>
        </div>

        <div aria-label="Illustration of a connected system design" className="relative mx-auto w-full max-w-xl">
          <div className="absolute inset-8 rounded-full bg-accent-ai/10 blur-3xl" />
          <div className="relative rounded-3xl border border-border-default bg-bg-surface/90 p-4 shadow-2xl shadow-black/30 sm:p-6">
            <div className="flex items-center justify-between border-b border-border-default pb-4">
              <div>
                <p className="text-xs text-text-faint">PROJECT / SYSTEM DESIGN</p>
                <p className="mt-1 text-sm font-medium">Commerce platform</p>
              </div>
              <div className="flex -space-x-2" aria-label="Three collaborators">
                {[["A", "bg-accent-ai"], ["M", "bg-accent-primary"], ["J", "bg-state-success"]].map(([initial, color]) => (
                  <span key={initial} className={`grid size-7 place-items-center rounded-full border-2 border-bg-surface text-[10px] font-semibold text-bg-base ${color}`}>{initial}</span>
                ))}
              </div>
            </div>
            <div className="relative mt-5 grid min-h-72 grid-cols-3 grid-rows-3 gap-3 sm:min-h-80 sm:gap-4">
              <svg className="pointer-events-none absolute inset-0 size-full" viewBox="0 0 480 300" fill="none" aria-hidden="true">
                <path d="M115 70H220M260 78L325 140M118 86L160 218M240 105V210M350 173L280 228M190 235H270" stroke="var(--border-subtle)" strokeWidth="2" strokeDasharray="5 6" />
                <path d="M199 70h22m-6-5 6 5-6 5" stroke="var(--accent-primary)" strokeWidth="2" />
              </svg>
              <div className="relative col-start-1 row-start-1 flex h-16 items-center gap-2 self-center rounded-xl border border-accent-primary/30 bg-accent-dim px-3 text-xs text-accent-primary sm:h-20"><MousePointer2 className="size-4" /> Web app</div>
              <div className="relative col-start-2 row-start-1 flex h-16 items-center gap-2 self-center rounded-xl border border-accent-ai/40 bg-accent-ai/10 px-3 text-xs text-accent-ai-text sm:h-20"><Bot className="size-4" /> API service</div>
              <div className="relative col-start-3 row-start-2 flex h-16 items-center gap-2 self-center rounded-xl border border-border-default bg-bg-elevated px-3 text-xs text-text-secondary sm:h-20"><Layers3 className="size-4" /> Queue</div>
              <div className="relative col-start-2 row-start-3 flex h-16 items-center gap-2 self-center rounded-xl border border-border-default bg-bg-elevated px-3 text-xs text-text-secondary sm:h-20"><GitBranch className="size-4" /> Database</div>
              <div className="relative col-start-1 row-start-3 flex h-16 items-center justify-center self-center rounded-xl border border-state-success/30 bg-state-success/10 px-2 text-xs text-state-success sm:h-20"><Check className="mr-1 size-4" /> Designed</div>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl border border-border-default bg-bg-elevated px-3 py-2.5 text-xs">
              <span className="flex items-center gap-2 text-text-muted"><span className="size-1.5 animate-pulse rounded-full bg-accent-primary" /> Shared canvas is live</span>
              <span className="text-text-faint">AI assistant ready</span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border-default bg-bg-surface/50">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-primary">One connected workflow</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">The pieces of system design, working together.</h2>
            <p className="mt-4 leading-7 text-text-muted">Go from a blank canvas or a starter pattern to a shared, documented architecture—all inside the project workspace.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {capabilities.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="rounded-2xl border-border-default bg-bg-surface transition duration-200 hover:-translate-y-1 hover:border-accent-primary/40">
                <CardContent className="p-6">
                  <span className="grid size-11 place-items-center rounded-xl border border-accent-primary/20 bg-accent-dim text-accent-primary"><Icon className="size-5" /></span>
                  <h3 className="mt-5 font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-text-muted">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-primary">How it works</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">A clear path from prompt to plan.</h2>
            <p className="mt-4 leading-7 text-text-muted">Your architecture stays at the center. AI helps you move faster; your team stays in control of the design.</p>
          </div>
          <div className="divide-y divide-border-default border-y border-border-default">
            {steps.map(([number, title, detail]) => (
              <div key={number} className="grid gap-3 py-5 sm:grid-cols-[3.5rem_9rem_1fr] sm:items-center">
                <span className="font-mono text-xs text-accent-primary">{number}</span>
                <h3 className="font-medium">{title}</h3>
                <p className="text-sm leading-6 text-text-muted">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 lg:px-10 lg:pb-24">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 rounded-3xl border border-accent-primary/20 bg-accent-dim p-8 sm:p-12 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-primary">Make the system visible</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Bring your next architecture into focus.</h2>
            <p className="mt-4 leading-7 text-text-secondary">Create a project, invite your collaborators, and turn the first idea into a design you can discuss and document.</p>
          </div>
          <Button asChild size="lg" className="h-12 shrink-0 rounded-xl bg-accent-primary px-6 text-bg-base hover:bg-accent-primary/90">
            <Link href="/sign-up">Get started <ArrowRight className="ml-2 size-4" /></Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border-default">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-6 text-xs text-text-faint sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <span>Ghost AI · Collaborative system design</span>
          <Link href="/sign-in" className="inline-flex items-center gap-2 transition hover:text-text-secondary">Already a member? Sign in <ArrowDown className="size-3 -rotate-45" /></Link>
        </div>
      </footer>
    </main>
  );
}
