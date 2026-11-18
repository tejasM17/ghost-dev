import Link from "next/link";
import { ArrowRight, Bot, FileText, Layers3, Users } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";

type AuthMode = "sign-in" | "sign-up";

interface AuthLayoutProps {
  children: React.ReactNode;
  mode: AuthMode;
}

const authCopy = {
  "sign-in": {
    eyebrow: "WELCOME BACK",
    title: "Pick up where your team left off.",
    description: "Return to your architecture projects, continue a shared design, and keep decisions moving with your team.",
    prompt: "Your projects and collaborators are right where you left them.",
    linkHref: "/sign-up",
    linkLabel: "Create an account",
    footerPrompt: "New to Ghost AI?",
  },
  "sign-up": {
    eyebrow: "START DESIGNING",
    title: "Bring your next system into focus.",
    description: "Create a workspace for your architecture, invite your team, and turn your first idea into a design you can build from.",
    prompt: "Your first project is the start of a clearer system design.",
    linkHref: "/sign-in",
    linkLabel: "Sign in instead",
    footerPrompt: "Already have a Ghost AI account?",
  },
} satisfies Record<AuthMode, {
  eyebrow: string;
  title: string;
  description: string;
  prompt: string;
  linkHref: string;
  linkLabel: string;
  footerPrompt: string;
}>;

const features = [
  { icon: Layers3, label: "Starter architecture patterns" },
  { icon: Bot, label: "AI-assisted system design" },
  { icon: Users, label: "Live team collaboration" },
  { icon: FileText, label: "Technical specs from your canvas" },
];

export function AuthLayout({ children, mode }: AuthLayoutProps) {
  const copy = authCopy[mode];

  return (
    <main className="grid min-h-screen w-full bg-bg-base text-text-primary lg:grid-cols-[1.05fr_0.95fr]">
      <aside className="relative hidden min-h-screen flex-col justify-between overflow-hidden border-r border-border-default bg-bg-surface px-12 py-10 lg:flex xl:px-16">
        <div className="pointer-events-none absolute -left-40 top-1/4 size-[28rem] rounded-full bg-accent-primary/5 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <BrandHeader />
          <Link href="/get-started" className="text-sm text-text-muted transition hover:text-text-primary">Explore Ghost AI</Link>
        </div>

        <div className="relative mx-auto grid w-full max-w-xl gap-12 py-16 xl:grid-cols-[1fr_0.8fr] xl:items-center">
          <section>
            <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-accent-primary">
              <span className="size-1.5 rounded-full bg-accent-primary" />{copy.eyebrow}
            </p>
            <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.04em] text-text-primary xl:text-5xl">{copy.title}</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-text-muted">{copy.description}</p>
            <ul className="mt-9 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {features.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3 text-sm text-text-secondary">
                  <span className="grid size-8 place-items-center rounded-xl border border-border-default bg-bg-elevated text-accent-primary"><Icon className="size-4" /></span>
                  {label}
                </li>
              ))}
            </ul>
          </section>
          <ArchitecturePreview prompt={copy.prompt} />
        </div>

        <footer className="relative flex items-center justify-between text-xs text-text-faint">
          <span>Ghost AI · Collaborative system design</span>
          <Link href="/get-started" className="inline-flex items-center gap-1.5 transition hover:text-text-secondary">Learn more <ArrowRight className="size-3" /></Link>
        </footer>
      </aside>

      <section className="flex min-h-screen flex-col items-center justify-center px-5 py-10 sm:px-10">
        <div className="mb-8 flex w-full max-w-md items-center justify-between lg:hidden">
          <BrandHeader />
          <Link href="/get-started" className="text-sm text-text-muted transition hover:text-text-primary">About Ghost AI</Link>
        </div>
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-border-default bg-bg-elevated p-6 shadow-2xl shadow-black/20 sm:p-9">
            <div className="mb-7">
              <p className="text-xs font-semibold tracking-[0.18em] text-accent-primary">{copy.eyebrow}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">{mode === "sign-in" ? "Sign in to Ghost AI" : "Create your workspace"}</h2>
              <p className="mt-2 text-sm leading-6 text-text-muted">{mode === "sign-in" ? "Continue designing with your team." : "Start mapping your system with your team."}</p>
            </div>
            {children}
          </div>
          <p className="mt-6 text-center text-sm text-text-muted">
            {copy.footerPrompt}{" "}
            <Link href={copy.linkHref} className="font-medium text-accent-primary transition hover:text-accent-primary/80">{copy.linkLabel}</Link>
          </p>
          <p className="mt-3 text-center text-xs text-text-faint">After authentication, you&apos;ll continue to your editor.</p>
        </div>
      </section>
    </main>
  );
}

function BrandHeader() {
  return (
    <Link href="/get-started" className="inline-flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-accent-primary text-bg-base"><BrandMark /></span>
      <span className="text-base font-semibold tracking-tight">Ghost <span className="text-text-muted">AI</span></span>
    </Link>
  );
}

function ArchitecturePreview({ prompt }: { prompt: string }) {
  return (
    <div className="relative hidden rounded-3xl border border-border-default bg-bg-base/70 p-4 shadow-2xl shadow-black/20 xl:block">
      <div className="flex items-center justify-between border-b border-border-default pb-3">
        <div><p className="text-[10px] font-medium tracking-[0.16em] text-text-faint">SHARED PROJECT</p><p className="mt-1 text-xs font-medium">Architecture workspace</p></div>
        <div className="flex -space-x-2" aria-label="Collaborators active">
          {["A", "M", "J"].map((initial, index) => (
            <span key={initial} className={`grid size-7 place-items-center rounded-full border-2 border-bg-base text-[10px] font-semibold text-bg-base ${index === 1 ? "bg-accent-ai-text" : "bg-accent-primary"}`}>{initial}</span>
          ))}
        </div>
      </div>
      <div className="relative my-5 grid h-48 grid-cols-2 gap-3">
        <svg className="absolute inset-0 size-full" viewBox="0 0 220 170" fill="none" aria-hidden="true">
          <path d="M75 47h66M109 60v50M83 123h54" stroke="var(--border-subtle)" strokeWidth="2" strokeDasharray="4 5" />
          <path d="M131 43l9 4-9 4M105 101l4 9 4-9" stroke="var(--accent-primary)" strokeWidth="1.5" />
        </svg>
        <PreviewNode className="col-start-1 row-start-1" label="Web app" accent />
        <PreviewNode className="col-start-2 row-start-1" label="API service" ai />
        <PreviewNode className="col-start-1 row-start-3" label="Database" />
        <PreviewNode className="col-start-2 row-start-3" label="Queue" />
      </div>
      <div className="rounded-xl border border-border-default bg-bg-elevated px-3 py-2.5">
        <p className="text-[10px] font-medium tracking-[0.12em] text-accent-ai-text">AI DESIGN PROMPT</p>
        <p className="mt-1 text-xs leading-5 text-text-secondary">{prompt}</p>
      </div>
    </div>
  );
}

function PreviewNode({ label, className, accent = false, ai = false }: {
  label: string;
  className: string;
  accent?: boolean;
  ai?: boolean;
}) {
  const tone = accent
    ? "border-accent-primary/30 bg-accent-primary/10 text-accent-primary"
    : ai
      ? "border-accent-ai/30 bg-accent-ai/10 text-accent-ai-text"
      : "border-border-default bg-bg-elevated text-text-secondary";

  return <div className={`relative z-10 flex h-12 items-center justify-center self-center rounded-xl border px-2 text-[11px] font-medium ${tone} ${className}`}>{label}</div>;
}
