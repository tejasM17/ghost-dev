"use client";

import { useEffect, useRef, useState } from "react";

import type { CanvasEdge, CanvasNode } from "@/types/canvas";

interface UseCanvasLoadOptions {
  projectId: string;
  /** Current Liveblocks room nodes. */
  nodes: CanvasNode[];
  /** Current Liveblocks room edges. */
  edges: CanvasEdge[];
  /**
   * Apply loaded snapshot into collaborative storage. Only called when
   * the room is empty and a saved blob exists with content.
   */
  onLoad: (snapshot: { nodes: CanvasNode[]; edges: CanvasEdge[] }) => void;
}

interface UseCanvasLoadResult {
  /** True while checking/fetching saved canvas. */
  isLoading: boolean;
  /**
   * True once the empty-room check (and optional load) has finished.
   * Autosave should wait for this so it does not race hydration.
   */
  isReady: boolean;
  error: string | null;
}

/**
 * On editor mount: if the Liveblocks room has no nodes or edges and the
 * project has a saved canvas blob, fetch and load it. If the room already
 * has content, skip load entirely so active collaboration is not overwritten.
 */
export function useCanvasLoad({
  projectId,
  nodes,
  edges,
  onLoad,
}: UseCanvasLoadOptions): UseCanvasLoadResult {
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attemptedRef = useRef(false);
  const onLoadRef = useRef(onLoad);
  onLoadRef.current = onLoad;

  useEffect(() => {
    attemptedRef.current = false;
    setIsLoading(true);
    setIsReady(false);
    setError(null);
  }, [projectId]);

  useEffect(() => {
    if (!projectId || attemptedRef.current) return;
    attemptedRef.current = true;

    let cancelled = false;

    async function run() {
      // Room already has collaborative content — never overwrite.
      if (nodes.length > 0 || edges.length > 0) {
        if (!cancelled) {
          setIsLoading(false);
          setIsReady(true);
        }
        return;
      }

      try {
        const response = await fetch(`/api/projects/${projectId}/canvas`, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          // 403/401/404: treat as no loadable snapshot.
          if (response.status === 401 || response.status === 403) {
            throw new Error("Not authorized to load canvas");
          }
          // Soft-fail other errors so the empty room remains usable.
          if (!cancelled) {
            setIsLoading(false);
            setIsReady(true);
          }
          return;
        }

        const data = (await response.json()) as {
          nodes?: CanvasNode[];
          edges?: CanvasEdge[];
          canvasJsonPath?: string | null;
        };

        const loadedNodes = Array.isArray(data.nodes) ? data.nodes : [];
        const loadedEdges = Array.isArray(data.edges) ? data.edges : [];

        // Nothing stored (or empty snapshot) — leave the room empty.
        if (
          !data.canvasJsonPath ||
          (loadedNodes.length === 0 && loadedEdges.length === 0)
        ) {
          if (!cancelled) {
            setIsLoading(false);
            setIsReady(true);
          }
          return;
        }

        // Re-check room emptiness at apply time is not possible without
        // live refs; we only load when mount saw empty storage.
        if (!cancelled) {
          onLoadRef.current({ nodes: loadedNodes, edges: loadedEdges });
          setIsLoading(false);
          setIsReady(true);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load canvas",
          );
          setIsLoading(false);
          setIsReady(true);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
    // Intentionally only re-run when projectId changes; nodes/edges at
    // first paint decide whether load is skipped.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  return { isLoading, isReady, error };
}
