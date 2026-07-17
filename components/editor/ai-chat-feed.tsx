"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useCreateFeed,
  useCreateFeedMessage,
  useFeedMessages,
  useSelf,
} from "@liveblocks/react";

import {
  AI_CHAT_FEED_ID,
  parseAiChatFeedPayload,
  type AiChatFeedPayload,
} from "@/types/tasks";

/** Validated chat message plus Liveblocks message id for list keys. */
export interface AiChatMessage extends AiChatFeedPayload {
  id: string;
}

/**
 * Ensures the shared `ai-chat` feed exists in the current room.
 * Safe to call multiple times — create races are ignored.
 */
export function useEnsureAiChatFeed(): void {
  const createFeed = useCreateFeed();

  useEffect(() => {
    void createFeed(AI_CHAT_FEED_ID).catch(() => {
      // Feed may already exist; ignore create races.
    });
  }, [createFeed]);
}

/**
 * Room-scoped collaborative chat via Liveblocks `ai-chat` feed.
 * Uses non-suspense `useFeedMessages` so fetch timeouts/errors do not
 * crash the sidebar (important for collaborators joining a room).
 */
export interface PostAiChatMessageOptions {
  /** Defaults to `"user"`. Use `"assistant"` / `"system"` for AI replies and errors. */
  role?: AiChatFeedPayload["role"];
  /** Defaults to the current Liveblocks self name (or "Ghost AI" for assistant). */
  sender?: string;
  /**
   * When false, do not flip `isSending` / `sendError` (used for AI final replies
   * so they do not block the input spinner path). Default true for user sends.
   */
  trackSending?: boolean;
}

export function useAiChatFeed(): {
  messages: AiChatMessage[];
  isLoading: boolean;
  feedError: Error | null;
  sendError: string | null;
  isSending: boolean;
  sendMessage: (
    content: string,
    options?: PostAiChatMessageOptions,
  ) => Promise<boolean>;
} {
  useEnsureAiChatFeed();

  // Non-suspense: returns error/loading instead of throwing on timeout.
  const { messages: rawMessages, isLoading, error } = useFeedMessages(
    AI_CHAT_FEED_ID,
  );
  const createFeedMessage = useCreateFeedMessage();
  const self = useSelf();

  const [sendError, setSendError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const messages = useMemo((): AiChatMessage[] => {
    if (!rawMessages || rawMessages.length === 0) return [];

    const validated: AiChatMessage[] = [];
    for (const message of rawMessages) {
      const parsed = parseAiChatFeedPayload(message.data);
      if (!parsed) continue;
      validated.push({
        id: message.id,
        sender: parsed.sender,
        role: parsed.role,
        content: parsed.content,
        timestamp: parsed.timestamp,
      });
    }
    // Liveblocks returns messages in feed order; keep chronological display.
    return validated;
  }, [rawMessages]);

  const sendMessage = useCallback(
    async (
      content: string,
      options?: PostAiChatMessageOptions,
    ): Promise<boolean> => {
      const trimmed = content.trim();
      if (!trimmed) return false;

      const role = options?.role ?? "user";
      const trackSending = options?.trackSending ?? role === "user";
      const defaultSender =
        role === "assistant" || role === "system"
          ? "Ghost AI"
          : self?.info?.name?.trim() || "Someone";
      const sender = options?.sender?.trim() || defaultSender;

      if (trackSending) {
        setIsSending(true);
        setSendError(null);
      }

      const payload: AiChatFeedPayload = {
        sender,
        role,
        content: trimmed,
        timestamp: Date.now(),
      };

      try {
        await createFeedMessage(AI_CHAT_FEED_ID, { ...payload });
        return true;
      } catch {
        if (trackSending) {
          setSendError("Couldn’t send message. Try again.");
        }
        return false;
      } finally {
        if (trackSending) {
          setIsSending(false);
        }
      }
    },
    [createFeedMessage, self?.info?.name],
  );

  return {
    messages,
    isLoading: Boolean(isLoading),
    feedError: error ?? null,
    sendError,
    isSending,
    sendMessage,
  };
}
