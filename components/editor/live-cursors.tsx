"use client";

import { useOthers, useUpdateMyPresence } from "@liveblocks/react/suspense";
import { useReactFlow, useViewport } from "@xyflow/react";
import { Loader2 } from "lucide-react";
import { useCallback, type MouseEvent } from "react";

/**
 * Renders remote collaborator cursors in flow space and exposes
 * mouse handlers to broadcast the local cursor via presence.
 */
export function LiveCursors() {
  const others = useOthers();
  const { x: vx, y: vy, zoom } = useViewport();

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {others.map((other) => {
        const cursor = other.presence.cursor;
        if (!cursor) return null;

        const screenX = cursor.x * zoom + vx;
        const screenY = cursor.y * zoom + vy;
        const color = other.info.color;
        const name = other.info.name || "Collaborator";
        const thinking = other.presence.thinking === true;

        return (
          <div
            key={other.connectionId}
            className="absolute left-0 top-0 will-change-transform"
            style={{
              transform: `translate(${screenX}px, ${screenY}px)`,
            }}
          >
            <CursorPointer color={color} />
            <div
              className="ml-3 mt-0.5 flex max-w-[12rem] items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-[11px] font-medium text-white shadow-md"
              style={{ backgroundColor: color }}
            >
              {thinking ? (
                <Loader2
                  className="h-3 w-3 shrink-0 animate-spin opacity-95"
                  aria-hidden
                />
              ) : null}
              <span className="truncate">{name}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Hook: broadcast cursor in flow coordinates on React Flow pointer events.
 */
export function useCursorPresence() {
  const updateMyPresence = useUpdateMyPresence();
  const { screenToFlowPosition } = useReactFlow();

  const onPointerMove = useCallback(
    (event: MouseEvent) => {
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      updateMyPresence({
        cursor: { x: position.x, y: position.y },
      });
    },
    [screenToFlowPosition, updateMyPresence],
  );

  const onPointerLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

  return { onPointerMove, onPointerLeave };
}

function CursorPointer({ color }: { color: string }) {
  return (
    <svg
      width="16"
      height="20"
      viewBox="0 0 16 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-sm"
      aria-hidden
    >
      <path
        d="M0.5 0.5L0.5 16.5L4.5 12.5L7.5 19.5L10.5 18L7.5 11.5H14.5L0.5 0.5Z"
        fill={color}
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="0.75"
      />
    </svg>
  );
}
