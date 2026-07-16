"use client";

import { useCallback, useEffect, useState } from "react";
import { Circle, Diamond, Square, Hexagon, Cylinder, Pill } from "lucide-react";

import type { NodeShape } from "@/types/canvas";
import { NODE_COLORS } from "@/types/canvas";
import { NodeShapeVisual } from "./node-shape-visual";

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
export const SHAPES: ShapeDefinition[] = [
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

interface DragPreviewState {
  shape: NodeShape;
  width: number;
  height: number;
  x: number;
  y: number;
}

/**
 * ShapePanel - a floating pill-shaped toolbar at the bottom-center
 * of the canvas with draggable shape icons. While dragging, shows a
 * ghost preview of the shape attached to the cursor.
 */
export function ShapePanel() {
  const [preview, setPreview] = useState<DragPreviewState | null>(null);

  const clearPreview = useCallback(() => {
    setPreview(null);
  }, []);

  useEffect(() => {
    if (!preview) return;

    const onDragOver = (e: DragEvent) => {
      // Keep preview pinned to the cursor while dragging over the page
      setPreview((prev) =>
        prev
          ? { ...prev, x: e.clientX, y: e.clientY }
          : prev,
      );
    };

    const onDragEnd = () => {
      clearPreview();
    };

    const onDrop = () => {
      clearPreview();
    };

    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragend", onDragEnd);
    window.addEventListener("drop", onDrop);

    return () => {
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragend", onDragEnd);
      window.removeEventListener("drop", onDrop);
    };
  }, [preview, clearPreview]);

  const handleDragStart = (
    e: React.DragEvent<HTMLButtonElement>,
    shape: NodeShape,
    width: number,
    height: number,
  ): void => {
    const payload: ShapeDragPayload = { shape, width, height };
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "copy";

    // Hide the browser's default drag image so only our ghost shows
    const empty = document.createElement("div");
    empty.style.width = "1px";
    empty.style.height = "1px";
    empty.style.opacity = "0";
    document.body.appendChild(empty);
    e.dataTransfer.setDragImage(empty, 0, 0);
    requestAnimationFrame(() => {
      document.body.removeChild(empty);
    });

    setPreview({
      shape,
      width,
      height,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const defaultColor = NODE_COLORS[0];

  return (
    <>
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

      {preview && (
        <div
          className="pointer-events-none fixed z-[100]"
          style={{
            left: preview.x,
            top: preview.y,
            transform: "translate(-50%, -50%)",
          }}
        >
          <NodeShapeVisual
            shape={preview.shape}
            fill={defaultColor.fill}
            borderColor={defaultColor.text}
            textColor={defaultColor.text}
            label=""
            width={preview.width}
            height={preview.height}
            ghost
          />
        </div>
      )}
    </>
  );
}
