"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { CanvasEdge, CanvasNode } from "@/types/canvas";

export type CanvasSaveStatus = "idle" | "saving" | "saved" | "error";

interface UseCanvasAutosaveOptions {
  /** Project id used in the canvas API path. */
  projectId: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  /**
   * When false, autosave is paused (e.g. while hydrating from blob so we
   * do not re-save the just-loaded snapshot as a new write).
   */
  enabled?: boolean;
  /** Debounce window in ms. Default 1500. */
  debounceMs?: number;
  /** How long "Saved" / "Error" stay visible before returning to "Save". */
  statusResetMs?: number;
}

interface UseCanvasAutosaveResult {
  status: CanvasSaveStatus;
  /** Last error message when status is "error". */
  error: string | null;
  /**
   * Force an immediate save (skips debounce). Always runs a write so the
   * navbar Save button shows Saving → Saved/Error feedback.
   */
  saveNow: () => void;
}

/**
 * Debounced autosave for collaborative canvas nodes/edges.
 * PUTs the latest graph to /api/projects/[projectId]/canvas and tracks
 * saving / saved / error status for the editor UI.
 */
export function useCanvasAutosave({
  projectId,
  nodes,
  edges,
  enabled = true,
  debounceMs = 1500,
  statusResetMs = 2000,
}: UseCanvasAutosaveOptions): UseCanvasAutosaveResult {
  const [status, setStatus] = useState<CanvasSaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // Keep latest graph in a ref so the debounced flush always writes
  // the current snapshot, not a stale closure.
  const snapshotRef = useRef({ nodes, edges });
  snapshotRef.current = { nodes, edges };

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const inFlightRef = useRef(false);
  const pendingRef = useRef(false);
  const pendingForceRef = useRef(false);
  // Skip the first effect run so mount does not immediately save empty state
  // before load hydration has a chance to run.
  const hasMountedRef = useRef(false);
  const lastSerializedRef = useRef<string | null>(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const clearStatusReset = useCallback(() => {
    if (statusResetTimerRef.current) {
      clearTimeout(statusResetTimerRef.current);
      statusResetTimerRef.current = null;
    }
  }, []);

  const scheduleStatusReset = useCallback(() => {
    clearStatusReset();
    statusResetTimerRef.current = setTimeout(() => {
      statusResetTimerRef.current = null;
      setStatus("idle");
    }, statusResetMs);
  }, [clearStatusReset, statusResetMs]);

  const persist = useCallback(
    async (options?: { force?: boolean }) => {
      const force = options?.force === true;

      if (!projectId) return;
      // Autosave waits for hydration; manual Save always proceeds.
      if (!force && !enabledRef.current) return;

      const payload = snapshotRef.current;
      const serialized = JSON.stringify({
        nodes: payload.nodes,
        edges: payload.edges,
      });

      // Autosave no-op when nothing changed. Manual save always runs.
      if (!force && serialized === lastSerializedRef.current) {
        return;
      }

      if (inFlightRef.current) {
        pendingRef.current = true;
        pendingForceRef.current = pendingForceRef.current || force;
        return;
      }

      inFlightRef.current = true;
      clearStatusReset();
      setStatus("saving");
      setError(null);

      try {
        const response = await fetch(`/api/projects/${projectId}/canvas`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: serialized,
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(data?.error ?? `Save failed (${response.status})`);
        }

        lastSerializedRef.current = serialized;
        setStatus("saved");
        scheduleStatusReset();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to save canvas";
        setError(message);
        setStatus("error");
        scheduleStatusReset();
      } finally {
        inFlightRef.current = false;
        if (pendingRef.current) {
          const nextForce = pendingForceRef.current;
          pendingRef.current = false;
          pendingForceRef.current = false;
          void persist({ force: nextForce });
        }
      }
    },
    [projectId, clearStatusReset, scheduleStatusReset],
  );

  const saveNow = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    void persist({ force: true });
  }, [persist]);

  // Debounce on nodes/edges changes.
  useEffect(() => {
    if (!enabled || !projectId) return;

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      // Seed last-serialized so we only autosave after real edits.
      lastSerializedRef.current = JSON.stringify({ nodes, edges });
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void persist({ force: false });
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [nodes, edges, enabled, projectId, debounceMs, persist]);

  // Reset mount/seed when project changes.
  useEffect(() => {
    hasMountedRef.current = false;
    lastSerializedRef.current = null;
    clearStatusReset();
    setStatus("idle");
    setError(null);
  }, [projectId, clearStatusReset]);

  useEffect(() => {
    return () => {
      clearStatusReset();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [clearStatusReset]);

  return { status, error, saveNow };
}
