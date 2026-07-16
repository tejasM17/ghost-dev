"use client";

import { Circle, Diamond, Square, Hexagon, Cylinder, Pill } from "lucide-react";

import type { NodeShape } from "@/types/canvas";

/**
 * Shape definition with default size and icon.
 */
interface ShapeDefinition {
  shape: NodeShape;
  icon: React.ComponentType<{ className?: string }>;
  defaultWidth: number;
  defaultHeight: number;
}

/**
 * The 6 supported shapes with their default dimensions.
 */
const SHAPES: ShapeDefinition[] = [
  { shape: "rectangle", icon: Square, defaultWidth: 180, defaultHeight: 80 },
  { shape: "diamond", icon: Diamond, defaultWidth: 120, defaultHeight: 120 },
  { shape: "circle", icon: Circle, defaultWidth: 100, defaultHeight: 100 },
  { shape: "pill", icon: Pill, defaultWidth: 160, defaultHeight: 60 },
  { shape: "cylinder", icon: Cylinder, defaultWidth: 100, defaultHeight: 100 },
  { shape: "hexagon", icon: Hexagon, defaultWidth: 120, defaultHeight: 100 },
];

/**
 * Drag payload passed when dragging a shape from the panel.
 */
export interface ShapeDragPayload {
  shape: NodeShape;
  width: number;
  height: number;
}

/**
 * Handles starting a drag operation with shape data.
 */
function handleDragStart(
  e: React.DragEvent<HTMLButtonElement>,
  shape: NodeShape,
  width: number,
  height: number,
): void {
  const payload: ShapeDragPayload = { shape, width, height };
  e.dataTransfer.setData("application/json", JSON.stringify(payload));
  e.dataTransfer.effectAllowed = "copy";
}

/**
 * ShapePanel - a floating pill-shaped toolbar at the bottom-center
 * of the canvas with draggable shape icons.
 */
export function ShapePanel() {
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-full border border-border-default bg-bg-surface/95 px-2 py-2 shadow-xl backdrop-blur-md">
        {SHAPES.map(({ shape, icon: Icon, defaultWidth, defaultHeight }) => (
          <button
            key={shape}
            type="button"
            draggable
            onDragStart={(e) =>
              handleDragStart(e, shape, defaultWidth, defaultHeight)
            }
            aria-label={`Add ${shape}`}
            className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition-all hover:bg-bg-elevated hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          >
            <Icon className="h-5 w-5" />
          </button>
        ))}
      </div>
    </div>
  );
}