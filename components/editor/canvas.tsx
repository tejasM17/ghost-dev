"use client";

import {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type DragEvent,
  type ErrorInfo,
  type ReactNode,
} from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type NodeChange,
  type EdgeChange,
  type OnConnect,
  type OnDelete,
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
  CanvasNodeData,
  NodeShape,
} from "@/types/canvas";
import { NODE_COLORS, type NodeColorName } from "@/types/canvas";
import { ShapePanel, type ShapePanelPayload } from "./shape-panel";
import { CanvasNodeComponent } from "./canvas-node";

interface CanvasProps {
  roomId: string;
}

/**
 * Client-side collaborative canvas for a project.
 *
 * Wires up Liveblocks (auth + room) and React Flow (`useLiveblocksFlow`)
 * together so nodes and edges sync between every collaborator. This is
 * the foundation of the editor — node/edge rendering and persistence
 * land in later features.
 */
export function Canvas({ roomId }: CanvasProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{ cursor: null, isThinking: false }}
      >
        <CanvasErrorBoundary>
          <ClientSideSuspense fallback={<CanvasLoading />}>
            <CollaborativeFlow />
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
 * Generate a unique node ID using shape name, timestamp, and counter.
 */
function generateNodeId(shape: NodeShape): string {
  const timestamp = Date.now();
  return `${shape}-${timestamp}-${++nodeIdCounter}`;
}

/**
 * The actual React Flow surface, rendered after Liveblocks has connected
 * and the storage layer is ready (via Suspense).
 *
 * Note: This component is wrapped with ReactFlowProvider to allow using
 * useReactFlow() hook for coordinate conversion.
 */
function CollaborativeFlow() {
  // `useLiveblocksFlow` returns the synced nodes/edges plus change
  // handlers. With `suspense: true`, `nodes` and `edges` are guaranteed
  // to be defined here.
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    });

  return (
    <ReactFlowProvider>
      <FlowCanvas
        nodes={nodes}
        edges={edges}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onNodesChange={onNodesChange as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onEdgesChange={onEdgesChange as any}
        onConnect={onConnect}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onDelete={onDelete as any}
      />
    </ReactFlowProvider>
  );
}

/**
 * Inner component that has access to ReactFlow context via ReactFlowProvider.
 * This is where we can use useReactFlow() hook.
 */
function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onDelete,
}: {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  onNodesChange: (changes: NodeChange<CanvasNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<CanvasEdge>[]) => void;
  onConnect: OnConnect;
  onDelete: (params: { nodes: CanvasNode[]; edges: CanvasEdge[] }) => void;
}) {
  // Get the React Flow instance for coordinate conversion
  const { screenToFlowPosition } = useReactFlow();

  // Custom node types - memoized to keep references stable
  const nodeTypes = useMemo(
    () => ({ canvasNode: CanvasNodeComponent }),
    [],
  );

  // Handle drag over on the canvas wrapper
  const handleDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  // Handle drop on the canvas wrapper
  const handleDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      // Read the shape payload from dataTransfer
      const payloadData = event.dataTransfer.getData("application/json");
      if (!payloadData) return;

      try {
        const payload: ShapePanelPayload = JSON.parse(payloadData);
        const { shape, width, height } = payload;

        // Convert screen position to canvas coordinates
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        // Create new node - use CanvasNode type from types/canvas
        const newNode: CanvasNode = {
          id: generateNodeId(shape),
          type: "canvasNode",
          position,
          data: {
            label: "",
            color: NODE_COLORS[0].name as NodeColorName,
            shape,
          },
          measured: {
            width,
            height,
          },
        };

        // Add the node via onNodesChange with add change
        const addChange: NodeChange<CanvasNode> = {
          type: "add",
          item: newNode,
        };
        onNodesChange([addChange]);
      } catch (error) {
        console.error("Failed to parse shape payload:", error);
      }
    },
    [screenToFlowPosition, onNodesChange],
  );

  return (
    <div
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
        nodeTypes={nodeTypes}
        fitView
        connectionMode={ConnectionMode.Loose}
        proOptions={{ hideAttribution: true }}
        className="!bg-transparent"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="var(--border-subtle)"
        />
        <MiniMap
          pannable
          zoomable
          className="!bg-bg-surface/80 !rounded-lg"
          nodeColor="var(--text-muted)"
          maskColor="rgba(8, 8, 9, 0.6)"
        />
      </ReactFlow>
      <ShapePanel />
    </div>
  );
}

/**
 * Loading state shown inside the Liveblocks Suspense boundary.
 * Uses transparent background to blend with the infinite canvas.
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
    <div className="flex h-full items-center justify-center bg-transparent">
      <div className="flex flex-col items-center gap-3">
        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-bg-surface/50">
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
 * page with a clear next step. Uses transparent background for infinite canvas look.
 */
function CanvasError({ message, onRetry }: CanvasErrorProps) {
  return (
    <div className="flex h-full items-center justify-center bg-transparent">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="rounded-2xl border border-state-error/30 bg-bg-surface/80 p-6 backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-text-primary">
            Canvas unavailable
          </h3>
          <p className="mt-2 text-sm text-text-muted">{message}</p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-xl bg-bg-surface/80 px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-bg-elevated backdrop-blur-sm"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
