"use client";

import { useEffect } from "react";
import type { ReactFlowInstance } from "@xyflow/react";

const ZOOM_DURATION_MS = 200;

interface UseKeyboardShortcutsOptions {
  /** React Flow instance used for zoom in / zoom out. */
  reactFlow: ReactFlowInstance;
  /** Liveblocks (or equivalent) undo handler. */
  undo: () => void;
  /** Liveblocks (or equivalent) redo handler. */
  redo: () => void;
}

/**
 * Returns true when the event target is an editable field so canvas
 * shortcuts do not fire while the user is typing a label.
 */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    return true;
  }

  if (target.isContentEditable) return true;

  // Also treat elements inside contenteditable hosts as typing targets
  if (target.closest("[contenteditable='true'], [contenteditable='']")) {
    return true;
  }

  return false;
}

/**
 * Window-level canvas keyboard shortcuts.
 *
 * - `+` / `=` zoom in
 * - `-` zoom out
 * - `Cmd/Ctrl + Z` undo
 * - `Cmd/Ctrl + Shift + Z` or `Cmd/Ctrl + Y` redo
 *
 * Shortcuts are ignored while focus is in an input, textarea, or editable field.
 */
export function useKeyboardShortcuts({
  reactFlow,
  undo,
  redo,
}: UseKeyboardShortcutsOptions): void {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (isEditableTarget(event.target)) return;

      const mod = event.metaKey || event.ctrlKey;
      const key = event.key;

      // Undo / redo (modifier combinations)
      if (mod && key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if (mod && key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
        return;
      }

      // Zoom (no modifiers — avoid stealing browser zoom / other chords)
      if (mod || event.altKey) return;

      if (key === "+" || key === "=") {
        event.preventDefault();
        void reactFlow.zoomIn({ duration: ZOOM_DURATION_MS });
        return;
      }

      if (key === "-") {
        event.preventDefault();
        void reactFlow.zoomOut({ duration: ZOOM_DURATION_MS });
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [reactFlow, undo, redo]);
}
