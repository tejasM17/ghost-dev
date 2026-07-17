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
     * Realtime room events. AI design status is broadcast so every
     * collaborator can follow Ghost AI progress in the status feed.
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
  }
}

export {};
