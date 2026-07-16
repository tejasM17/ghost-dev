"use client";

import { useCallback, useRef, useState } from "react";
import {
  Square,
  Diamond,
  Circle,
  Pill,
  Cylinder,
  Hexagon,
  type LucideIcon,
} from "lucide-react";

import type { NodeShape } from "@/types/canvas";

/**
 * Shape definitions with their icons and default sizes.
 * Default sizes follow the spec: rectangles wider than tall, circles square,
 * diamonds slightly larger for labels.
 */
const SHAPES: Array<{
  name: NodeShape;
  icon: LucideIcon;
  width: number;
  height: number;
}> = [
  { name: "rectangle", icon: Square, width: 180, height: 100 },
  { name: "diamond", icon: Diamond, width: 140, height: 140 },
  { name: "circle", icon: Circle, width: 120, height: 120 },
  { name: "pill", icon: Pill, width: 180, height: 80 },
  { name: "cylinder", icon: Cylinder, width: 100, height: 120 },
  { name: "hexagon", icon: Hexagon, width: 140, height: 120 },
];

/**
 * Shape panel payload transferred via drag-and-drop.
 */
export interface ShapePanelPayload {
  shape: NodeShape;
  width: number;
  height: number;
}

/**
 * Floating pill-shaped toolbar at the bottom-center of the canvas.
 * Contains draggable icon buttons for each supported shape.
 */
export function ShapePanel() {
  return (
    <div className="pointer-events-auto fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-full border border-border-default bg-bg-surface px-2 py-2 shadow-xl">
        {SHAPES.map((shape) => (
          <ShapeButton
            key={shape.name}
            name={shape.name}
            Icon={shape.icon}
            width={shape.width}
            height={shape.height}
          />
        ))}
      </div>
    </div>
  );
}

interface ShapeButtonProps {
  name: NodeShape;
  Icon: LucideIcon;
  width: number;
  height: number;
}

function ShapeButton({ name, Icon, width, height }: ShapeButtonProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      const payload: ShapePanelPayload = { shape: name, width, height };
      e.dataTransfer.setData("application/json", JSON.stringify(payload));
      e.dataTransfer.effectAllowed = "copy";
      setIsDragging(true);
    },
    [name, width, height],
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <button
      type="button"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        group flex h-11 w-11 items-center justify-center rounded-full
        transition-all duration-200
        ${
          isDragging
            ? "bg-accent-primary/20 scale-90"
            : "hover:bg-bg-elevated active:scale-95"
        }
      `}
      aria-label={`Add ${name} shape`}
      title={name.charAt(0).toUpperCase() + name.slice(1)}
    >
      <Icon
        className={`
          h-5 w-5 text-text-muted transition-colors duration-200
          group-hover:text-text-primary
          ${isDragging ? "text-accent-primary" : ""}
        `}
      />
    </button>
  );
}