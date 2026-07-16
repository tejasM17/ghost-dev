"use client";

import { useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Undo2,
  Redo2,
} from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import {
  useCanRedo,
  useCanUndo,
  useRedo,
  useUndo,
} from "@liveblocks/react";

import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

const ZOOM_DURATION_MS = 200;

/**
 * Floating pill control bar at the bottom-left of the canvas.
 * Zoom group (out / fit / in) + history group (undo / redo), separated
 * by a thin divider. Zoom uses the React Flow instance; undo/redo use
 * Liveblocks room history.
 */
export function CanvasControls() {
  const reactFlow = useReactFlow();
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  useKeyboardShortcuts({ reactFlow, undo, redo });

  const handleZoomIn = useCallback(() => {
    void reactFlow.zoomIn({ duration: ZOOM_DURATION_MS });
  }, [reactFlow]);

  const handleZoomOut = useCallback(() => {
    void reactFlow.zoomOut({ duration: ZOOM_DURATION_MS });
  }, [reactFlow]);

  const handleFitView = useCallback(() => {
    void reactFlow.fitView({ duration: ZOOM_DURATION_MS, padding: 0.15 });
  }, [reactFlow]);

  return (
    <div className="pointer-events-none fixed bottom-6 left-6 z-50">
      <div
        className="pointer-events-auto flex items-center gap-1 rounded-full border border-border-default bg-bg-surface/95 px-1.5 py-1.5 shadow-xl backdrop-blur-md"
        role="toolbar"
        aria-label="Canvas controls"
      >
        {/* Zoom controls */}
        <ControlButton
          label="Zoom out"
          onClick={handleZoomOut}
          shortcut="-"
        >
          <ZoomOut className="h-4 w-4" />
        </ControlButton>
        <ControlButton
          label="Fit view"
          onClick={handleFitView}
        >
          <Maximize2 className="h-4 w-4" />
        </ControlButton>
        <ControlButton
          label="Zoom in"
          onClick={handleZoomIn}
          shortcut="+"
        >
          <ZoomIn className="h-4 w-4" />
        </ControlButton>

        {/* Divider between zoom and history */}
        <div
          className="mx-0.5 h-5 w-px shrink-0 bg-border-default"
          aria-hidden
        />

        {/* History controls */}
        <ControlButton
          label="Undo"
          onClick={undo}
          disabled={!canUndo}
          shortcut="⌘Z"
        >
          <Undo2 className="h-4 w-4" />
        </ControlButton>
        <ControlButton
          label="Redo"
          onClick={redo}
          disabled={!canRedo}
          shortcut="⌘⇧Z"
        >
          <Redo2 className="h-4 w-4" />
        </ControlButton>
      </div>
    </div>
  );
}

interface ControlButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  shortcut?: string;
  children: React.ReactNode;
}

function ControlButton({
  label,
  onClick,
  disabled = false,
  shortcut,
  children,
}: ControlButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={shortcut ? `${label} (${shortcut})` : label}
      className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary disabled:pointer-events-none disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-text-secondary"
    >
      {children}
    </button>
  );
}
