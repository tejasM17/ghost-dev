import type { AiChatFeedPayload, AiStatusFeedPayload } from "@/types/tasks";

declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null;
      thinking: boolean;
    };

    Storage: Record<string, never>;

    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar: string;
        color: string;
      };
    };

    /**
     * Legacy room events (optional). Primary shared AI status uses the
     * Liveblocks feed `ai-status-feed` with {@link FeedMessageData}.
     */
    RoomEvent:
      | {
          type: "AI_STATUS";
          phase: "start" | "processing" | "complete" | "error";
          message: string;
          at: number;
        };

    ThreadMetadata: Record<string, never>;
    RoomInfo: Record<string, never>;

    /** Metadata on Liveblocks feeds (unused for room feeds). */
    FeedMetadata: Record<string, never>;

    /**
     * Payload on feed messages. Room uses two feeds with distinct shapes:
     * - `ai-status-feed` → AiStatusFeedPayload
     * - `ai-chat` → AiChatFeedPayload
     * Always validate with the matching parser before rendering.
     */
    FeedMessageData: AiStatusFeedPayload | AiChatFeedPayload;
  }
}

export {};
