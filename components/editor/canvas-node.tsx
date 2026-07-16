"use client";

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type FocusEvent,
} from "react";
import {
  Handle,
  NodeResizer,
  Position,
  useReactFlow,
  type NodeProps,
} from "@xyflow/react";

import type { CanvasNode } from "@/types/canvas";
import { NODE_COLORS } from "@/types/canvas";
import { NodeShapeVisual } from "./node-shape-visual";

/** Minimum node size — prevents nodes from collapsing to unusable dimensions. */
const MIN_NODE_WIDTH = 80;
const MIN_NODE_HEIGHT = 40;

const LABEL_PLACEHOLDER = "Label";

const HANDLE_CLASS =
  "!h-2 !w-2 !rounded-full !border !border-border-default !bg-white";

/**
 * Custom React Flow node: per-shape visuals, resize handles when selected,
 * four connectable points, and double-click inline label editing.
 * All dimension and label updates flow through the collaborative node state.
 */
function CanvasNodeComponent({
  id,
  data,
  selected,
  width,
  height,
}: NodeProps<CanvasNode>) {
  const { label, color: colorName, shape } = data;
  const { updateNodeData } = useReactFlow<CanvasNode>();

  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const colorPair =
    NODE_COLORS.find((c) => c.name === colorName) ?? NODE_COLORS[0];

  const nodeWidth = width ?? 160;
  const nodeHeight = height ?? 80;

  // Subtle border at rest; brighter when selected
  const borderColor = selected
    ? colorPair.text
    : `${colorPair.text}55`;

  // Focus the textarea when editing starts
  useEffect(() => {
    if (!isEditing) return;
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    // Place caret at end without scrolling the canvas
    const len = el.value.length;
    el.setSelectionRange(len, len);
  }, [isEditing]);

  const startEditing = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsEditing(true);
  }, []);

  const handleLabelChange = useCallback(
    (value: string) => {
      updateNodeData(id, { label: value });
    },
    [id, updateNodeData],
  );

  const handleTextareaKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Escape closes editing; stop propagation so the canvas doesn't
      // treat Escape as a global shortcut while typing.
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setIsEditing(false);
        textareaRef.current?.blur();
      }
      // Keep Enter for newlines inside the textarea; do not bubble to RF.
      e.stopPropagation();
    },
    [],
  );

  const handleTextareaBlur = useCallback((_e: FocusEvent<HTMLTextAreaElement>) => {
    setIsEditing(false);
  }, []);

  // Block pointer events from starting a node drag / canvas pan while editing.
  const stopPointer = useCallback((e: MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div
      className="relative"
      style={{ width: nodeWidth, height: nodeHeight }}
      onDoubleClick={isEditing ? undefined : startEditing}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={MIN_NODE_WIDTH}
        minHeight={MIN_NODE_HEIGHT}
        color="var(--border-subtle)"
        lineClassName="!border-border-subtle/80"
        handleClassName="!h-1.5 !w-1.5 !rounded-[1px] !border !border-border-subtle !bg-bg-elevated"
      />

      {/* Four connectable points — one per side */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className={HANDLE_CLASS}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className={HANDLE_CLASS}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className={HANDLE_CLASS}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className={HANDLE_CLASS}
      />

      <NodeShapeVisual
        shape={shape}
        fill={colorPair.fill}
        borderColor={borderColor}
        textColor={colorPair.text}
        // Hide the static label while the textarea is open so they don't stack
        label={isEditing ? "" : label}
        width={nodeWidth}
        height={nodeHeight}
        emptyPlaceholder={LABEL_PLACEHOLDER}
      />

      {isEditing && (
        <div
          className="nodrag nopan nowheel absolute inset-0 z-20 flex items-center justify-center p-2"
          onMouseDown={stopPointer}
          onPointerDown={stopPointer}
          onDoubleClick={stopPointer}
        >
          <textarea
            ref={textareaRef}
            className="nodrag nopan nowheel max-h-full w-full resize-none overflow-hidden border-0 bg-transparent text-center text-sm font-medium outline-none placeholder:opacity-40"
            style={{
              color: colorPair.text,
              // Grow with content so multi-line text stays visually centered
              fieldSizing: "content",
            }}
            value={label}
            placeholder={LABEL_PLACEHOLDER}
            rows={1}
            spellCheck={false}
            onChange={(e) => handleLabelChange(e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            onBlur={handleTextareaBlur}
            onMouseDown={stopPointer}
            onPointerDown={stopPointer}
            aria-label="Node label"
          />
        </div>
      )}
    </div>
  );
}

/**
 * Memoized canvas node renderer for performance.
 */
export const CanvasNodeRenderer = memo(CanvasNodeComponent);

CanvasNodeRenderer.displayName = "CanvasNodeRenderer";
