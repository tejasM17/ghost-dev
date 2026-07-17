"use client";

import { useEffect, useMemo } from "react";
import {
  useCreateFeed,
  useFeedMessages,
  useOthers,
} from "@liveblocks/react";
import { AlertCircle, Bot, CheckCircle2, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  AI_STATUS_FEED_ID,
  aiStatusDisplayText,
  isAiGenerationActive,
  parseAiStatusFeedPayload,
  type AiStatusFeedPayload,
} from "@/types/tasks";

/**
 * Ensures the shared `ai-status-feed` exists in the current room.
 * Safe to call multiple times — create is idempotent from the UI side.
 */
export function useEnsureAiStatusFeed(): void {
  const createFeed = useCreateFeed();

  useEffect(() => {
    void createFeed(AI_STATUS_FEED_ID).catch(() => {
      // Feed may already exist; ignore create races.
    });
  }, [createFeed]);
}

/**
 * Latest validated AI status from the Liveblocks `ai-status-feed`, plus
 * whether any participant (including Ghost AI) currently has `thinking`.
 *
 * Uses non-suspense `useFeedMessages` so a feed fetch timeout (common when
 * collaborators join before the feed is ready) does not crash the workspace.
 */
export function useAiActivityState(): {
  latest: AiStatusFeedPayload | null;
  isGenerating: boolean;
  displayText: string | null;
} {
  useEnsureAiStatusFeed();

  const { messages } = useFeedMessages(AI_STATUS_FEED_ID);
  const others = useOthers();

  const latest = useMemo(() => {
    if (!messages || messages.length === 0) return null;

    // Show only the most recent valid status message (spec: no full history).
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const parsed = parseAiStatusFeedPayload(messages[i]?.data);
      if (parsed) return parsed;
    }
    return null;
  }, [messages]);

  const someoneThinking = others.some(
    (other) => other.presence.thinking === true,
  );

  const isGenerating = isAiGenerationActive(latest) || someoneThinking;
  const displayText = latest ? aiStatusDisplayText(latest) : null;

  return { latest, isGenerating, displayText };
}

/**
 * Compact canvas toast for the latest AI status message (shared room feed).
 * Full history is intentionally not rendered.
 */
export function AiStatusFeed() {
  const { latest, displayText } = useAiActivityState();

  if (!latest || !displayText) return null;

  return (
    <div
      className="pointer-events-none absolute bottom-24 left-1/2 z-30 flex w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 flex-col gap-2"
      aria-live="polite"
      aria-label="AI design status"
    >
      <StatusCard phase={latest.phase} text={displayText} />
    </div>
  );
}

function StatusCard({
  phase,
  text,
}: {
  phase: AiStatusFeedPayload["phase"];
  text: string;
}) {
  const isError = phase === "error";
  const isComplete = phase === "complete";
  const isBusy = phase === "start" || phase === "processing";

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
        <p className="text-sm text-text-primary">{text}</p>
      </div>
    </div>
  );
}
