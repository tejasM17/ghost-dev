/**
 * Shared schemas for AI task status signals and room chat (Liveblocks feeds, UI).
 * Kept free of generation logic — payload shape only.
 */

import { z } from "zod";

/** Stable Liveblocks feed id for shared AI activity status. */
export const AI_STATUS_FEED_ID = "ai-status-feed" as const;

/** Stable Liveblocks feed id for collaborative sidebar chat (not AI status). */
export const AI_CHAT_FEED_ID = "ai-chat" as const;

/** Lifecycle phases for design / spec generation status messages. */
export const AI_STATUS_PHASES = [
  "start",
  "processing",
  "complete",
  "error",
] as const;

export type AiStatusPhase = (typeof AI_STATUS_PHASES)[number];

/**
 * Payload stored on each message in the `ai-status-feed` Liveblocks feed.
 * Generic enough for design generation now and spec generation later.
 *
 * - `message` — primary status line shown in the UI
 * - `text` — optional alternate/detail line (preferred when present)
 * - `phase` — coarse lifecycle signal for spinners / completion
 * - `at` — optional client-side timestamp (ms)
 * - `kind` — optional generator kind (design | spec | other)
 */
export interface AiStatusFeedPayload {
  phase: AiStatusPhase;
  message: string;
  text?: string;
  at?: number;
  kind?: "design" | "spec" | "other";
}

/** Roles allowed on collaborative sidebar chat messages. */
export const AI_CHAT_ROLES = ["user", "assistant", "system"] as const;

export type AiChatRole = (typeof AI_CHAT_ROLES)[number];

/**
 * Payload stored on each message in the `ai-chat` Liveblocks feed.
 * Separate from `ai-status-feed` — human (and later AI) chat only.
 */
export const aiChatFeedMessageSchema = z.object({
  sender: z.string().min(1),
  role: z.enum(AI_CHAT_ROLES),
  content: z.string().min(1),
  timestamp: z.number(),
});

export type AiChatFeedPayload = z.infer<typeof aiChatFeedMessageSchema>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAiStatusPhase(value: unknown): value is AiStatusPhase {
  return (
    typeof value === "string" &&
    (AI_STATUS_PHASES as readonly string[]).includes(value)
  );
}

/**
 * Validate an unknown feed message `data` field before displaying it.
 * Returns the typed payload or `null` when invalid.
 */
export function parseAiStatusFeedPayload(
  data: unknown,
): AiStatusFeedPayload | null {
  if (!isRecord(data)) return null;

  const { phase, message, text, at, kind } = data;

  if (!isAiStatusPhase(phase)) return null;
  if (typeof message !== "string" || message.length === 0) return null;
  if (text !== undefined && typeof text !== "string") return null;
  if (at !== undefined && typeof at !== "number") return null;
  if (
    kind !== undefined &&
    kind !== "design" &&
    kind !== "spec" &&
    kind !== "other"
  ) {
    return null;
  }

  const payload: AiStatusFeedPayload = { phase, message };
  if (text !== undefined) payload.text = text;
  if (at !== undefined) payload.at = at;
  if (kind !== undefined) payload.kind = kind;
  return payload;
}

/**
 * Validate an unknown `ai-chat` feed message `data` field before rendering.
 * Returns the typed payload or `null` when invalid.
 */
export function parseAiChatFeedPayload(
  data: unknown,
): AiChatFeedPayload | null {
  const result = aiChatFeedMessageSchema.safeParse(data);
  return result.success ? result.data : null;
}

/** Display text for a validated status payload (prefers optional `text`). */
export function aiStatusDisplayText(payload: AiStatusFeedPayload): string {
  const trimmed = payload.text?.trim();
  if (trimmed) return trimmed;
  return payload.message;
}

/** Whether the latest status means generation is still in progress. */
export function isAiGenerationActive(
  payload: AiStatusFeedPayload | null,
): boolean {
  if (!payload) return false;
  return payload.phase === "start" || payload.phase === "processing";
}
