import Link from "next/link";
import { Sparkles, Users, FileText } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  signUpHref?: string;
}

export function AuthLayout({ children, signUpHref = "/sign-up" }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen w-full grid-cols-1 bg-bg-base text-text-primary lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between border-r border-border-default bg-bg-surface px-12 py-12 lg:flex lg:px-16">
        <BrandHeader />

        <BrandPitch />

        <BrandFooter />
      </aside>

      <main className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-border-default bg-bg-elevated p-8 shadow-2xl sm:p-10">
            {children}
          </div>

          <p className="mt-6 text-center text-sm text-text-muted">
            {signUpHref === "/sign-up" ? (
              <>
                Don&apos;t have an account?{" "}
                <Link
                  href={signUpHref}
                  className="font-medium text-accent-primary transition-colors hover:text-accent-primary/80"
                >
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link
                  href={signUpHref}
                  className="font-medium text-accent-primary transition-colors hover:text-accent-primary/80"
                >
                  Sign in
                </Link>
              </>
            )}
          </p>
        </div>
      </main>
    </div>
  );
}

function BrandHeader() {
  return (
    <div className="flex items-center gap-3">
      <LogoMark />
      <span className="text-base font-semibold tracking-tight text-text-primary">
        Ghost dev
      </span>
    </div>
  );
}

function BrandPitch() {
  return (
    <div className="max-w-md">
      <h1 className="text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-text-primary sm:text-5xl">
        Design systems at the speed of thought.
      </h1>

      <p className="mt-5 text-base leading-relaxed text-text-muted">
        Describe your architecture in plain English. Ghost dev maps it to a
        shared canvas your whole team can refine in real time.
      </p>

      <ul className="mt-10 space-y-6">
        <Feature
          icon={<Sparkles className="h-4 w-4" />}
          title="AI Architecture Generation"
          description="Describe your system, AI maps it to nodes and edges on a live canvas."
        />
        <Feature
          icon={<Users className="h-4 w-4" />}
          title="Real-time Collaboration"
          description="Live cursors, presence indicators, and shared node editing across your team."
        />
        <Feature
          icon={<FileText className="h-4 w-4" />}
          title="Instant Spec Generation"
          description="Export a complete Markdown technical spec directly from the canvas graph."
        />
      </ul>
    </div>
  );
}

function BrandFooter() {
  return (
    <p className="text-xs text-text-faint">
      © 2026 Ghost dev. All rights reserved.
    </p>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <li className="flex items-start gap-4">
      <span
        aria-hidden="true"
        className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border-default bg-bg-elevated text-accent-primary"
      >
        {icon}
      </span>
      <div>
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-text-muted">
          {description}
        </p>
      </div>
    </li>
  );
}

function LogoMark() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent-primary text-bg-base"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M4 6h6v6H4z" />
        <path d="M14 6h6v6h-6z" />
        <path d="M4 14h6v6H4z" />
        <path d="M14 14h6v6h-6z" />
        <path d="M10 9h4" />
        <path d="M9 10v4" />
      </svg>
    </span>
  );
}
