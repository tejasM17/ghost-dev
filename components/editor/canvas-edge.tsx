"use client";

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type SyntheticEvent,
} from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";

import type { CanvasEdge } from "@/types/canvas";

/** Default edge stroke from ui-context — light on the dark canvas. */
const EDGE_STROKE = "#f8fafc";
/** Visible stroke width — edges stay visually secondary to nodes. */
const EDGE_STROKE_WIDTH = 1.5;
/** Invisible hit area wider than the stroke for easier hover/click. */
const EDGE_INTERACTION_WIDTH = 24;
/** Dimmed rest opacity; full when hovered or selected. */
const EDGE_OPACITY_REST = 0.45;
const EDGE_OPACITY_ACTIVE = 1;

const LABEL_HINT = "Label";

/**
 * Custom canvas edge: right-angle (smooth-step) routing, arrow markers,
 * wider interaction hit area, and double-click inline label editing.
 * Label updates flow through collaborative edge data via updateEdgeData.
 */
function CanvasEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
  markerEnd,
  style,
}: EdgeProps<CanvasEdge>) {
  const { updateEdgeData } = useReactFlow();

  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const label = data?.label ?? "";
  const hasLabel = label.trim().length > 0;
  const isActive = Boolean(selected || isHovered);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Focus the input when editing starts
  useEffect(() => {
    if (!isEditing) return;
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    const len = el.value.length;
    el.setSelectionRange(len, len);
  }, [isEditing]);

  const commitAndClose = useCallback(() => {
    setIsEditing(false);
  }, []);

  const startEditing = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsEditing(true);
  }, []);

  const handleLabelChange = useCallback(
    (value: string) => {
      updateEdgeData(id, { label: value });
    },
    [id, updateEdgeData],
  );

  const handleInputKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      // Save + close on Enter or Escape (spec: save on blur, Enter, or Escape)
      if (e.key === "Enter" || e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        commitAndClose();
        inputRef.current?.blur();
        return;
      }
      // Keep typing from bubbling to canvas shortcuts
      e.stopPropagation();
    },
    [commitAndClose],
  );

  // Block pointer events from panning/selecting the canvas while interacting
  // with the label control.
  const stopPointer = useCallback((e: SyntheticEvent) => {
    e.stopPropagation();
  }, []);

  const opacity = isActive ? EDGE_OPACITY_ACTIVE : EDGE_OPACITY_REST;

  // Show label chrome when editing, when there is a saved label, or as a
  // faint hint on an active (hovered/selected) unlabeled edge.
  const showLabelUi = isEditing || hasLabel || isActive;

  return (
    <>
      <g
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={startEditing}
      >
        <BaseEdge
          id={id}
          path={edgePath}
          markerEnd={markerEnd}
          interactionWidth={EDGE_INTERACTION_WIDTH}
          style={{
            ...style,
            // Keep stroke settings authoritative over any partial style
            // from defaultEdgeOptions / collaborators.
            stroke: EDGE_STROKE,
            strokeWidth: EDGE_STROKE_WIDTH,
            strokeLinecap: "round",
            opacity,
          }}
        />
      </g>

      {showLabelUi && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan nowheel pointer-events-auto absolute"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onDoubleClick={isEditing ? stopPointer : startEditing}
            onMouseDown={stopPointer}
            onPointerDown={stopPointer}
          >
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                className="nodrag nopan nowheel max-w-[220px] rounded-full border border-border-default bg-bg-elevated/95 px-2.5 py-0.5 text-center text-[11px] font-medium text-text-primary outline-none ring-1 ring-accent-primary/40 placeholder:text-text-faint"
                style={{
                  // Grow with label text; field-sizing for modern browsers,
                  // ch-based min width as a reliable fallback.
                  fieldSizing: "content",
                  minWidth: `${Math.max(label.length, LABEL_HINT.length, 4)}ch`,
                  width: "auto",
                }}
                value={label}
                placeholder={LABEL_HINT}
                spellCheck={false}
                aria-label="Edge label"
                onChange={(e) => handleLabelChange(e.target.value)}
                onKeyDown={handleInputKeyDown}
                onBlur={commitAndClose}
                onMouseDown={stopPointer}
                onPointerDown={stopPointer}
              />
            ) : hasLabel ? (
              <button
                type="button"
                className="nodrag nopan nowheel max-w-[220px] truncate rounded-full border border-border-default bg-bg-elevated/90 px-2.5 py-0.5 text-[11px] font-medium text-text-secondary shadow-sm backdrop-blur-sm transition-colors hover:border-border-subtle hover:text-text-primary"
                onDoubleClick={startEditing}
                onMouseDown={stopPointer}
                onPointerDown={stopPointer}
                aria-label={`Edge label: ${label}`}
              >
                {label}
              </button>
            ) : (
              // Faint hint when the edge is active but has no label yet
              <button
                type="button"
                className="nodrag nopan nowheel rounded-full border border-border-default/50 bg-bg-elevated/60 px-2.5 py-0.5 text-[11px] font-medium text-text-faint backdrop-blur-sm"
                onDoubleClick={startEditing}
                onClick={startEditing}
                onMouseDown={stopPointer}
                onPointerDown={stopPointer}
                aria-label="Add edge label"
              >
                {LABEL_HINT}
              </button>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

/**
 * Memoized canvas edge renderer for performance.
 */
export const CanvasEdgeRenderer = memo(CanvasEdgeComponent);

CanvasEdgeRenderer.displayName = "CanvasEdgeRenderer";
