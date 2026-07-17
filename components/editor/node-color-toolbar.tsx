"use client";

import { useCallback, type MouseEvent } from "react";

import { NODE_COLORS, type NodeColorName } from "@/types/canvas";

interface NodeColorToolbarProps {
  /** Currently active palette entry name on the node. */
  activeColor: NodeColorName;
  /** Called when the user picks a swatch. */
  onSelect: (color: NodeColorName) => void;
}

/**
 * Floating color toolbar shown above a selected canvas node.
 * One swatch per predefined NODE_COLORS pair; selecting a swatch updates
 * both fill and text color via the parent (collaborative node data).
 */
export function NodeColorToolbar({
  activeColor,
  onSelect,
}: NodeColorToolbarProps) {
  const stopPointer = useCallback((e: MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div
      className="nodrag nopan nowheel absolute left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-xl border border-border-default bg-bg-elevated/95 px-2 py-1.5 shadow-lg backdrop-blur-sm"
      style={{ bottom: "calc(100% + 10px)" }}
      onMouseDown={stopPointer}
      onPointerDown={stopPointer}
      onClick={stopPointer}
      role="toolbar"
      aria-label="Node color"
    >
      {NODE_COLORS.map((pair) => {
        const isActive = pair.name === activeColor;

        return (
          <button
            key={pair.name}
            type="button"
            className="nodrag nopan relative h-4 w-4 shrink-0 rounded-full border transition-[box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:ring-offset-bg-elevated"
            style={{
              backgroundColor: pair.fill,
              borderColor: isActive ? pair.text : "var(--border-subtle)",
              boxShadow: isActive
                ? `0 0 0 1.5px ${pair.text}, 0 0 4px 0 ${pair.text}99`
                : undefined,
            }}
            onMouseDown={stopPointer}
            onPointerDown={stopPointer}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onSelect(pair.name);
            }}
            onMouseEnter={(e) => {
              // Tight glow using the pair's text color — controlled, not blurry.
              e.currentTarget.style.boxShadow = isActive
                ? `0 0 0 1.5px ${pair.text}, 0 0 5px 0 ${pair.text}`
                : `0 0 0 1px ${pair.text}aa, 0 0 5px 0 ${pair.text}cc`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = isActive
                ? `0 0 0 1.5px ${pair.text}, 0 0 4px 0 ${pair.text}99`
                : "";
            }}
            aria-label={`Color ${pair.name}`}
            aria-pressed={isActive}
            title={pair.name}
          />
        );
      })}
    </div>
  );
}
