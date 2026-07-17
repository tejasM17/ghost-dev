"use client";

import { useEffect, useState } from "react";
import { useEventListener } from "@liveblocks/react/suspense";
import { AlertCircle, Bot, CheckCircle2, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface StatusEntry {
  id: string;
  phase: "start" | "processing" | "complete" | "error";
  message: string;
  at: number;
}

const MAX_VISIBLE = 4;
const AUTO_DISMISS_MS = 12_000;

/**
 * Shared AI status feed: listens for `AI_STATUS` room events broadcast by
 * the design-agent task and shows progress to all participants.
 */
export function AiStatusFeed() {
  const [entries, setEntries] = useState<StatusEntry[]>([]);

  useEventListener(({ event }) => {
    if (!event || typeof event !== "object") return;
    if (!("type" in event) || event.type !== "AI_STATUS") return;

    const { phase, message, at } = event;
    if (
      typeof phase !== "string" ||
      typeof message !== "string" ||
      typeof at !== "number"
    ) {
      return;
    }

    const id = `${at}-${Math.random().toString(36).slice(2, 8)}`;
    setEntries((prev) => {
      const next = [...prev, { id, phase, message, at }];
      return next.slice(-MAX_VISIBLE);
    });
  });

  useEffect(() => {
    if (entries.length === 0) return;

    const latest = entries[entries.length - 1];
    if (latest.phase !== "complete" && latest.phase !== "error") {
      return;
    }

    const timer = window.setTimeout(() => {
      setEntries((prev) => prev.filter((e) => e.id !== latest.id));
    }, AUTO_DISMISS_MS);

    return () => window.clearTimeout(timer);
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <div
      className="pointer-events-none absolute bottom-24 left-1/2 z-30 flex w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 flex-col gap-2"
      aria-live="polite"
      aria-label="AI design status"
    >
      {entries.map((entry) => (
        <StatusCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}

function StatusCard({ entry }: { entry: StatusEntry }) {
  const isError = entry.phase === "error";
  const isComplete = entry.phase === "complete";
  const isBusy = entry.phase === "start" || entry.phase === "processing";

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start gap-2.5 rounded-2xl border px-3 py-2.5 shadow-lg backdrop-blur-md",
        isError && "border-state-error/40 bg-bg-elevated/95",
        isComplete && "border-state-success/40 bg-bg-elevated/95",
        isBusy && "border-border-default bg-bg-surface/95",
      )}
    >
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-bg-subtle">
        {isBusy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-ai-text" />
        ) : isComplete ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-state-success" />
        ) : isError ? (
          <AlertCircle className="h-3.5 w-3.5 text-state-error" />
        ) : (
          <Bot className="h-3.5 w-3.5 text-accent-ai-text" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
          Ghost AI
        </p>
        <p className="text-sm text-text-primary">{entry.message}</p>
      </div>
    </div>
  );
}
