"use client";

import { Lock } from "lucide-react";
import Link from "next/link";

/**
 * AccessDenied component shown when a user doesn't have access to a project.
 * Displays a centered layout with a lock icon, message, and link back to editor.
 */
export function AccessDenied() {
  return (
    <div className="flex h-full w-full items-center justify-center px-6">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bg-elevated">
          <Lock className="h-8 w-8 text-text-muted" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-text-primary">
          Access Denied
        </h1>
        <p className="text-sm text-text-muted">
          You don&apos;t have access to this project. It may not exist or you
          may not be invited as a collaborator.
        </p>
        <Link
          href="/editor"
          className="mt-2 text-sm font-medium text-accent-primary hover:underline"
        >
          ← Back to Editor
        </Link>
      </div>
    </div>
  );
}