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

import type { CanvasNode, NodeColorName } from "@/types/canvas";
import { NODE_COLORS } from "@/types/canvas";
import { NodeShapeVisual } from "./node-shape-visual";
import { NodeColorToolbar } from "./node-color-toolbar";

/** Minimum node size — prevents nodes from collapsing to unusable dimensions. */
const MIN_NODE_WIDTH = 80;
const MIN_NODE_HEIGHT = 40;

const LABEL_PLACEHOLDER = "Label";

/**
 * Connectable points — sit above the shape (z-20) so side/bottom handles
 * are not covered by the visual or NodeResizer. Hidden until hover/select.
 */
const HANDLE_CLASS =
  "!z-20 !h-2.5 !w-2.5 !rounded-full !border !border-border-default !bg-white !opacity-0 !transition-opacity !duration-150 group-hover:!opacity-100 group-focus-within:!opacity-100";

/**
 * Font size scales with node dimensions and shrinks when there is more
 * text so longer labels still fit without overflowing awkwardly.
 */
function computeLabelFontSize(
  width: number,
  height: number,
  text: string,
): number {
  const minDim = Math.min(width, height);
  // Base size tracks the smaller edge of the node.
  const base = Math.max(10, Math.min(22, minDim * 0.2));

  const charCount = Math.max(text.trim().length || 1, 1);
  // Approximate characters per line from usable width.
  const charsPerLine = Math.max(4, Math.floor((width * 0.75) / (base * 0.55)));
  const estimatedLines = Math.max(1, Math.ceil(charCount / charsPerLine));

  // Cap by available height for the estimated line count.
  const maxByHeight = (height * 0.72) / estimatedLines;
  // Cap by width for dense single-line content.
  const maxByWidth = (width * 0.85) / Math.min(charCount, charsPerLine) / 0.55;

  const size = Math.min(base, maxByHeight, maxByWidth);
  return Math.round(Math.max(10, Math.min(22, size)) * 10) / 10;
}

/**
 * Custom React Flow node: per-shape visuals, resize handles when selected,
 * color toolbar, four connectable points, and double-click inline label editing.
 * All dimension, color, and label updates flow through the collaborative node state.
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

  const fontSize = computeLabelFontSize(nodeWidth, nodeHeight, label);

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

  const handleColorSelect = useCallback(
    (color: NodeColorName) => {
      updateNodeData(id, { color });
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

  const handleVisibilityClass = selected
    ? `${HANDLE_CLASS} !opacity-100`
    : HANDLE_CLASS;

  return (
    <div
      className="group relative"
      style={{ width: nodeWidth, height: nodeHeight }}
      onDoubleClick={isEditing ? undefined : startEditing}
    >
      {selected && (
        <NodeColorToolbar
          activeColor={colorPair.name}
          onSelect={handleColorSelect}
        />
      )}

      <NodeResizer
        isVisible={selected}
        minWidth={MIN_NODE_WIDTH}
        minHeight={MIN_NODE_HEIGHT}
        color="var(--border-subtle)"
        // Thicker edge lines + larger corner grips so resize is easy to grab
        lineClassName="!border-border-subtle/70"
        lineStyle={{ borderWidth: 2 }}
        handleClassName="!rounded-sm !border-2 !border-border-subtle !bg-bg-elevated !opacity-95"
        handleStyle={{ width: 14, height: 14 }}
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
        fontSize={fontSize}
        emptyPlaceholder={LABEL_PLACEHOLDER}
      />

      {/*
        Four connectable points after the shape so they stack above the
        visual. ConnectionMode.Loose treats sources as valid targets, so
        every side can start or end a connection.
      */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        isConnectable
        className={handleVisibilityClass}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        isConnectable
        className={handleVisibilityClass}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        isConnectable
        className={handleVisibilityClass}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        isConnectable
        className={handleVisibilityClass}
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
            className="nodrag nopan nowheel max-h-full w-full resize-none overflow-hidden border-0 bg-transparent text-center font-medium outline-none placeholder:opacity-40"
            style={{
              color: colorPair.text,
              fontSize,
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
