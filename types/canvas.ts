import type { Edge, Node } from "@xyflow/react";

/**
 * The 8 node color pairs defined in `context/ui-context.md`. Each pair
 * is a dark fill paired with a vivid text color tuned for readability on
 * the dark canvas. The first pair is the default.
 */
export const NODE_COLORS = [
  { fill: "#1F1F1F", text: "#EDEDED", name: "neutral" },
  { fill: "#10233D", text: "#52A8FF", name: "blue" },
  { fill: "#2E1938", text: "#BF7AF0", name: "purple" },
  { fill: "#331B00", text: "#FF990A", name: "orange" },
  { fill: "#3C1618", text: "#FF6166", name: "red" },
  { fill: "#3A1726", text: "#F75F8F", name: "pink" },
  { fill: "#0F2E18", text: "#62C073", name: "green" },
  { fill: "#062822", text: "#0AC7B4", name: "teal" },
] as const;

export type NodeColorName = (typeof NODE_COLORS)[number]["name"];

/**
 * The 6 supported node shapes defined in `context/ui-context.md`.
 * rectangle, pill, and circle use CSS styling; diamond, hexagon, and
 * cylinder render as scaling inline SVGs.
 */
export const NODE_SHAPES = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
] as const;

export type NodeShape = (typeof NODE_SHAPES)[number];

/**
 * Data attached to every node in the collaborative canvas. `label` is
 * the user-visible text on the node, `color` is the palette entry, and
 * `shape` is one of NODE_SHAPES. The keys are kept narrow on purpose —
 * extra fields will land here as the editor grows.
 */
export interface CanvasNodeData extends Record<string, unknown> {
  label: string;
  color: NodeColorName;
  shape: NodeShape;
}

/**
 * A node on the collaborative canvas. The `type` is the registered
 * custom-node type ("canvasNode") and `data` matches CanvasNodeData.
 */
export type CanvasNode = Node<CanvasNodeData, "canvasNode">;

/**
 * Data attached to every edge in the collaborative canvas. Kept
 * permissive for now — `kind` distinguishes data flow vs control flow
 * once the renderer needs it.
 */
export interface CanvasEdgeData extends Record<string, unknown> {
  label?: string;
}

/**
 * An edge on the collaborative canvas. The `type` is the registered
 * custom-edge type ("canvasEdge").
 */
export type CanvasEdge = Edge<CanvasEdgeData, "canvasEdge">;
