"use client";

import { memo, useMemo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

import { NODE_COLORS, type NodeColorName, type NodeShape } from "@/types/canvas";

/**
 * Data attached to canvas nodes.
 */
interface CanvasNodeData {
  label: string;
  color: NodeColorName;
  shape: NodeShape;
}

/**
 * Basic canvas node renderer. For this unit, renders every shape as a
 * simple bordered rectangle with the label centered. Shape-specific
 * visuals will be added later.
 */
function CanvasNode({ data, selected }: NodeProps) {
  const { label, color, shape } = data as unknown as CanvasNodeData;

  // Get color from palette
  const colorPair = useMemo(() => {
    return NODE_COLORS.find((c) => c.name === color) ?? NODE_COLORS[0];
  }, [color]);

  // Basic shape styles - for now, all shapes render as bordered rectangles
  // Shape-specific rendering will be added in future features
  const shapeStyles = useMemo(() => {
    const baseStyles = {
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: shape === "circle" ? "9999px" : shape === "pill" ? "9999px" : "8px",
      backgroundColor: colorPair.fill,
      border: `2px ${selected ? "var(--accent-primary)" : colorPair.fill}`,
      boxShadow: selected
        ? `0 0 0 2px var(--accent-primary), 0 4px 12px rgba(0,0,0,0.3)`
        : "none",
    };
    return baseStyles;
  }, [colorPair.fill, selected, shape]);

  return (
    <div style={shapeStyles}>
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-text-muted !border-border-default !h-3 !w-3"
      />
      <span
        className="px-3 py-1 text-sm font-medium text-center"
        style={{ color: colorPair.text }}
      >
        {label || "Node"}
      </span>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-text-muted !border-border-default !h-3 !w-3"
      />
    </div>
  );
}

/**
 * Memoized custom node component for React Flow.
 */
export const CanvasNodeComponent = memo(CanvasNode, (prev, next) => {
  return (
    prev.data.label === next.data.label &&
    prev.data.color === next.data.color &&
    prev.data.shape === next.data.shape &&
    prev.selected === next.selected
  );
});

CanvasNodeComponent.displayName = "CanvasNode";