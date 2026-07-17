"use client";

import { useEffect, useMemo } from "react";
import {
  useCreateFeed,
  useFeedMessages,
  useOthers,
} from "@liveblocks/react";

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
 * Canvas status toast intentionally not rendered.
 * Spec 28: do not show AI status states on the canvas — only presence
 * cursors / thinking indicators. Status text remains available via
 * {@link useAiActivityState} for the AI sidebar strip.
 */
