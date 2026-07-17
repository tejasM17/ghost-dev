"use client";

import type { ReactNode } from "react";
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";

interface LiveblocksRoomProps {
  roomId: string;
  children: ReactNode;
  /** Fallback while the room / auth handshake is in flight. */
  fallback?: ReactNode;
}

/**
 * Shared Liveblocks auth + room boundary for the workspace.
 * Canvas, AI sidebar, and status feed all need the same room context.
 */
export function LiveblocksRoom({
  roomId,
  children,
  fallback = null,
}: LiveblocksRoomProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{ cursor: null, thinking: false }}
      >
        <ClientSideSuspense fallback={fallback}>{children}</ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
