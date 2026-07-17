"use client";

import {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type ErrorInfo,
  type ReactNode,
} from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useEdges,
  useNodes,
  useReactFlow,
  type DefaultEdgeOptions,
  type EdgeTypes,
  type NodeTypes,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import "@liveblocks/react-flow/styles.css";

import type {
  CanvasEdge,
  CanvasNode,
  NodeColorName,
  NodeShape,
} from "@/types/canvas";
import { NODE_COLORS } from "@/types/canvas";
import { ShapePanel, type ShapeDragPayload } from "./shape-panel";
import { CanvasNodeRenderer } from "./canvas-node";
import { CanvasEdgeRenderer } from "./canvas-edge";
import { CanvasControls } from "./canvas-controls";
import { LiveCursors, useCursorPresence } from "./live-cursors";
import { PresenceAvatars } from "./presence-avatars";
import { StarterTemplatesModal } from "./starter-templates-modal";
import {
  cloneTemplateWithFreshIds,
  type CanvasTemplate,
} from "./starter-templates";
import {
  useCanvasAutosave,
  type CanvasSaveStatus,
} from "@/hooks/use-canvas-autosave";
import { useCanvasLoad } from "@/hooks/use-canvas-load";

/** Default style for newly created edges — light stroke, rounded ends, arrow. */
const DEFAULT_EDGE_OPTIONS: DefaultEdgeOptions = {
  type: "canvasEdge",
  style: {
    stroke: "#f8fafc",
    strokeWidth: 1.5,
    strokeLinecap: "round",
  },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 16,
    height: 16,
    color: "#f8fafc",
  },
  data: {
    label: "",
  },
};

interface CanvasProps {
  roomId: string;
  /** Controlled open state for the starter templates import modal. */
  templatesOpen?: boolean;
  onTemplatesOpenChange?: (open: boolean) => void;
  /** Notifies the shell when autosave status changes (for the Save button). */
  onSaveStatusChange?: (status: CanvasSaveStatus) => void;
  /** Exposes manual save to the workspace navbar Save button. */
  onSaveReady?: (saveNow: () => void) => void;
}

/**
 * Client-side collaborative canvas for a project.
 *
 * Wires up Liveblocks (auth + room) and React Flow (`useLiveblocksFlow`)
 * together so nodes and edges sync between every collaborator. Also
 * hydrates from Vercel Blob when the room is empty and debounced-autosaves
 * canvas JSON through the project canvas API.
 */
export function Canvas({
  roomId,
  templatesOpen = false,
  onTemplatesOpenChange,
  onSaveStatusChange,
  onSaveReady,
}: CanvasProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{ cursor: null, thinking: false }}
      >
        <CanvasErrorBoundary>
          <ClientSideSuspense fallback={<CanvasLoading />}>
            <ReactFlowProvider>
              <CollaborativeFlow
                projectId={roomId}
                templatesOpen={templatesOpen}
                onTemplatesOpenChange={onTemplatesOpenChange}
                onSaveStatusChange={onSaveStatusChange}
                onSaveReady={onSaveReady}
              />
            </ReactFlowProvider>
          </ClientSideSuspense>
        </CanvasErrorBoundary>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

interface CanvasErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface CanvasErrorBoundaryState {
  error: Error | null;
}

/**
 * Local error boundary used to catch Liveblocks connection issues
 * (auth failure, room ID changed, full room) and any runtime errors
 * thrown while mounting the canvas tree.
 */
class CanvasErrorBoundary extends Component<
  CanvasErrorBoundaryProps,
  CanvasErrorBoundaryState
> {
  state: CanvasErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): CanvasErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Canvas error boundary caught:", error, info);
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    const { children, fallback } = this.props;
    if (error) {
      if (fallback) {
        return fallback(error, this.reset);
      }
      return <CanvasError message={error.message} onRetry={this.reset} />;
    }
    return children;
  }
}

/**
 * Counter for generating unique node IDs.
 */
let nodeIdCounter = 0;

/**
 * Generate a unique node ID using the shape name, timestamp, and a counter.
 */
function generateNodeId(shape: NodeShape): string {
  const timestamp = Date.now();
  nodeIdCounter += 1;
  return `${shape}-${timestamp}-${nodeIdCounter}`;
}

interface CollaborativeFlowProps {
  projectId: string;
  templatesOpen: boolean;
  onTemplatesOpenChange?: (open: boolean) => void;
  onSaveStatusChange?: (status: CanvasSaveStatus) => void;
  onSaveReady?: (saveNow: () => void) => void;
}

/**
 * The actual React Flow surface, rendered after Liveblocks has connected
 * and the storage layer is ready (via Suspense).
 */
/**
 * True when focus is in an editable field so Delete/Backspace should
 * type/delete text instead of removing canvas elements.
 */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    return true;
  }
  if (target.isContentEditable) return true;
  if (target.closest("[contenteditable='true'], [contenteditable='']")) {
    return true;
  }
  return false;
}

function CollaborativeFlow({
  projectId,
  templatesOpen,
  onTemplatesOpenChange,
  onSaveStatusChange,
  onSaveReady,
}: CollaborativeFlowProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const selectedNodes = useNodes<CanvasNode>();
  const selectedEdges = useEdges<CanvasEdge>();
  const { onPointerMove: onCursorMove, onPointerLeave: onCursorLeave } =
    useCursorPresence();

  // `useLiveblocksFlow` returns the synced nodes/edges plus change
  // handlers. With `suspense: true`, `nodes` and `edges` are guaranteed
  // to be defined here.
  const {
    nodes,
    edges,
    onNodesChange: lbOnNodesChange,
    onEdgesChange,
    onConnect,
    onDelete,
  } = useLiveblocksFlow<CanvasNode, CanvasEdge>({
    suspense: true,
    nodes: { initial: [] },
    edges: { initial: [] },
  });

  // Wrap Liveblocks' onNodesChange to also apply locally for instant feedback
  const onNodesChange = useCallback(
    (changes: NodeChange<CanvasNode>[]) => {
      lbOnNodesChange(changes);
    },
    [lbOnNodesChange],
  );

  /**
   * Delete / Backspace removes selected nodes and edges through Liveblocks
   * storage (not React Flow's built-in deleteKeyCode), so all clients sync.
   *
   * Important: `@liveblocks/react-flow` intentionally no-ops `type: "remove"`
   * in onNodesChange/onEdgesChange. Actual deletion must go through `onDelete`.
   */
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      if (isEditableTarget(event.target)) return;

      const nodesToRemove = selectedNodes.filter((n) => n.selected);
      const selectedToRemove = selectedEdges.filter((e) => e.selected);

      if (nodesToRemove.length === 0 && selectedToRemove.length === 0) return;

      event.preventDefault();

      // Include edges attached to deleted nodes (same as React Flow's delete).
      const removedNodeIds = new Set(nodesToRemove.map((n) => n.id));
      const edgesById = new Map<string, CanvasEdge>();
      for (const edge of selectedToRemove) {
        edgesById.set(edge.id, edge);
      }
      for (const edge of edges) {
        if (
          removedNodeIds.has(edge.source) ||
          removedNodeIds.has(edge.target)
        ) {
          edgesById.set(edge.id, edge);
        }
      }

      onDelete({
        nodes: nodesToRemove,
        edges: Array.from(edgesById.values()),
      });
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedNodes, selectedEdges, edges, onDelete]);

  /**
   * Apply a full graph snapshot into collaborative storage (blob hydrate
   * or template import). When `replace` is true, clears existing elements
   * first; when false (blob load into empty room), only adds.
   */
  const applySnapshot = useCallback(
    (
      nextNodes: CanvasNode[],
      nextEdges: CanvasEdge[],
      options?: { replace?: boolean },
    ) => {
      const replace = options?.replace ?? false;

      if (replace) {
        if (edges.length > 0) {
          onEdgesChange(
            edges.map((edge) => ({ type: "remove" as const, id: edge.id })),
          );
        }
        if (nodes.length > 0) {
          onNodesChange(
            nodes.map((node) => ({ type: "remove" as const, id: node.id })),
          );
        }
      }

      if (nextNodes.length > 0) {
        onNodesChange(
          nextNodes.map((node) => ({ type: "add" as const, item: node })),
        );
      }
      if (nextEdges.length > 0) {
        onEdgesChange(
          nextEdges.map((edge) => ({ type: "add" as const, item: edge })),
        );
      }

      window.setTimeout(() => {
        void fitView({ duration: 200, padding: 0.15 });
      }, 50);
    },
    [edges, nodes, onEdgesChange, onNodesChange, fitView],
  );

  const handleBlobLoad = useCallback(
    (snapshot: { nodes: CanvasNode[]; edges: CanvasEdge[] }) => {
      applySnapshot(snapshot.nodes, snapshot.edges, { replace: false });
    },
    [applySnapshot],
  );

  const { isReady: canvasLoadReady } = useCanvasLoad({
    projectId,
    nodes,
    edges,
    onLoad: handleBlobLoad,
  });

  const { status: saveStatus, saveNow } = useCanvasAutosave({
    projectId,
    nodes,
    edges,
    enabled: canvasLoadReady,
  });

  useEffect(() => {
    onSaveStatusChange?.(saveStatus);
  }, [saveStatus, onSaveStatusChange]);

  useEffect(() => {
    onSaveReady?.(saveNow);
  }, [saveNow, onSaveReady]);

  /**
   * Replace the entire collaborative graph with a starter template.
   * Clears existing nodes/edges first, then adds the template graph and
   * fits the view once the new elements are in place.
   */
  const handleImportTemplate = useCallback(
    (template: CanvasTemplate) => {
      const { nodes: nextNodes, edges: nextEdges } =
        cloneTemplateWithFreshIds(template);
      applySnapshot(nextNodes, nextEdges, { replace: true });
    },
    [applySnapshot],
  );

  // Memoized type maps — stable refs so React Flow does not remount nodes/edges
  const nodeTypes = useMemo<NodeTypes>(
    () => ({
      canvasNode: CanvasNodeRenderer,
    }),
    [],
  );

  const edgeTypes = useMemo<EdgeTypes>(
    () => ({
      canvasEdge: CanvasEdgeRenderer,
    }),
    [],
  );

  // Handle drag over to allow dropping
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  // Handle drop to create a new node
  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();

      // Read the shape payload from data transfer
      const payloadData = e.dataTransfer.getData("application/json");
      if (!payloadData) return;

      let payload: ShapeDragPayload;
      try {
        payload = JSON.parse(payloadData);
      } catch {
        return;
      }

      // Cursor position in flow space, then offset so the node is centered
      // on the cursor (matches the centered drag ghost in ShapePanel).
      const cursorFlow = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });
      const position = {
        x: cursorFlow.x - payload.width / 2,
        y: cursorFlow.y - payload.height / 2,
      };

      // Default to the first color in the palette
      const defaultColor: NodeColorName = NODE_COLORS[0].name;

      // Create the new node
      const newNode: CanvasNode = {
        id: generateNodeId(payload.shape),
        type: "canvasNode",
        position,
        data: {
          label: "",
          color: defaultColor,
          shape: payload.shape,
        },
        width: payload.width,
        height: payload.height,
      };

      // Add the node to the collaborative canvas using Liveblocks storage
      onNodesChange([
        {
          type: "add",
          item: newNode,
        },
      ]);
    },
    [screenToFlowPosition, onNodesChange],
  );

  return (
    <div
      ref={wrapperRef}
      className="absolute inset-0"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        onMouseMove={onCursorMove}
        onMouseLeave={onCursorLeave}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
        // No automatic fitView — keeps viewport stable on first drop.
        // Template import and blob hydrate call fitView explicitly.
        deleteKeyCode={null}
        connectionMode={ConnectionMode.Loose}
        proOptions={{ hideAttribution: true }}
        className="!bg-transparent"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={18}
          size={1}
          color="var(--border-subtle)"
        />
      </ReactFlow>

      <LiveCursors />
      <PresenceAvatars />

      {/* Zoom + undo/redo bar (bottom-left); shape palette (bottom-center) */}
      <CanvasControls />
      <ShapePanel />

      {onTemplatesOpenChange ? (
        <StarterTemplatesModal
          open={templatesOpen}
          onOpenChange={onTemplatesOpenChange}
          onImport={handleImportTemplate}
        />
      ) : null}
    </div>
  );
}

/**
 * Loading state shown inside the Liveblocks Suspense boundary. Matches
 * the editor's dark surface palette so it doesn't flash a light fallback.
 */
function CanvasLoading() {
  const [dots, setDots] = useState(1);

  useEffect(() => {
    const id = window.setInterval(() => {
      setDots((d) => (d % 3) + 1);
    }, 320);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex h-full items-center justify-center bg-bg-base">
      <div className="flex flex-col items-center gap-3">
        <div className="h-2 w-32 overflow-hidden rounded-full bg-bg-elevated">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-accent-primary" />
        </div>
        <p className="text-xs text-text-muted">
          Connecting to canvas{".".repeat(dots)}
        </p>
      </div>
    </div>
  );
}

interface CanvasErrorProps {
  message: string;
  onRetry: () => void;
}

/**
 * Fallback rendered when the Liveblocks connection cannot be established
 * (auth failure, room ID changed, full room, etc.). Keeps the user on the
 * page with a clear next step.
 */
function CanvasError({ message, onRetry }: CanvasErrorProps) {
  return (
    <div className="flex h-full items-center justify-center bg-bg-base">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="rounded-2xl border border-state-error/30 bg-bg-surface p-6">
          <h3 className="text-sm font-semibold text-text-primary">
            Canvas unavailable
          </h3>
          <p className="mt-2 text-sm text-text-muted">{message}</p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-xl bg-bg-elevated px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-bg-subtle"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
