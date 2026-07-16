"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

import type { CanvasNode } from "@/types/canvas";
import { NODE_COLORS } from "@/types/canvas";

/**
 * Basic canvas node renderer. For this initial implementation, renders
 * every shape as a simple bordered rectangle with the label centered.
 * Shape-specific visuals will be added in later features.
 */
function CanvasNodeComponent({ data }: NodeProps<CanvasNode>) {
  const { label, color: colorName, shape } = data;

  // Get the color pair for this node
  const colorPair = NODE_COLORS.find((c) => c.name === colorName) ?? NODE_COLORS[0];

  return (
    <div
      className="flex items-center justify-center rounded-lg border-2 px-4 py-2"
      style={{
        backgroundColor: colorPair.fill,
        borderColor: colorPair.text,
        minWidth: "80px",
        minHeight: "40px",
      }}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border !border-border-default"
      />

      <span
        className="text-center text-sm font-medium"
        style={{ color: colorPair.text }}
      >
        {label || shape}
      </span>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border !border-border-default"
      />
    </div>
  );
}

/**
 * Memoized canvas node renderer for performance.
 */
export const CanvasNodeRenderer = memo(CanvasNodeComponent);

CanvasNodeRenderer.displayName = "CanvasNodeRenderer";