import { Liveblocks } from "@liveblocks/node";

/**
 * Fixed 8-color cursor palette. The same palette is used by both the
 * auth route (which attaches a `color` to the user info) and the
 * client-side color picker (which would surface the same color in the
 * UI). Keeping the source of truth in one module makes it easy to
 * evolve later.
 */
const CURSOR_PALETTE = [
  "#00c8d4", // cyan   — matches the brand accent
  "#6457f9", // indigo — matches the AI accent
  "#34d399", // green
  "#fbbf24", // amber
  "#f75f8f", // pink
  "#52A8FF", // blue
  "#FF990A", // orange
  "#FF6166", // red
] as const;

/**
 * Deterministically map a user ID to a color from the fixed palette. The
 * same user ID always produces the same color across clients and reloads,
 * so a collaborator's cursor color is stable for everyone in the room.
 */
export function getUserColor(userId: string): string {
  // FNV-1a-ish 32-bit hash. Stable, branchless, and good enough to spread
  // user IDs across the palette without a real crypto requirement.
  let hash = 0x811c9dc5;
  for (let i = 0; i < userId.length; i++) {
    hash ^= userId.charCodeAt(i);
    // 32-bit multiply (FNV prime)
    hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0;
  }

  const index = hash % CURSOR_PALETTE.length;
  return CURSOR_PALETTE[index];
}

/**
 * Cached Liveblocks node client. The SDK accepts a `secret` at construction
 * and we re-use the same instance for every auth request, so the secret is
 * read once per process. In dev, the instance is stashed on `globalThis` to
 * survive HMR reloads — same pattern as `lib/prisma.ts`.
 */
const globalForLiveblocks = globalThis as unknown as {
  liveblocks: Liveblocks | undefined;
};

export const liveblocks =
  globalForLiveblocks.liveblocks ??
  new Liveblocks({
    secret: process.env.LIVEBLOCKS_SECRET_KEY ?? "",
  });

if (process.env.NODE_ENV !== "production") {
  globalForLiveblocks.liveblocks = liveblocks;
}
