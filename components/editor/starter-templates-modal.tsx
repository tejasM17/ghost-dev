"use client";

import { Download } from "lucide-react";

import { DialogPattern } from "@/components/editor/dialog-pattern";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NODE_COLORS } from "@/types/canvas";
import type { CanvasNode, NodeShape } from "@/types/canvas";
import {
  CANVAS_TEMPLATES,
  type CanvasTemplate,
} from "@/components/editor/starter-templates";

interface StarterTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (template: CanvasTemplate) => void;
}

/**
 * Dialog that lists built-in starter templates as cards with a lightweight
 * diagram preview. Choosing Import calls `onImport` then closes the modal.
 */
export function StarterTemplatesModal({
  open,
  onOpenChange,
  onImport,
}: StarterTemplatesModalProps) {
  const handleImport = (template: CanvasTemplate) => {
    onImport(template);
    onOpenChange(false);
  };

  return (
    <DialogPattern
      open={open}
      onOpenChange={onOpenChange}
      title="Import Template"
      description="Choose a starter template to pre-populate your canvas. Any existing nodes will be replaced — use ⌘Z to undo."
      className="max-h-[90vh] sm:max-w-4xl"
    >
      <ScrollArea className="max-h-[min(70vh,560px)] pr-1">
        <div className="grid gap-4 pb-1 sm:grid-cols-2 lg:grid-cols-3">
          {CANVAS_TEMPLATES.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onImport={() => handleImport(template)}
            />
          ))}
        </div>
      </ScrollArea>
    </DialogPattern>
  );
}

interface TemplateCardProps {
  template: CanvasTemplate;
  onImport: () => void;
}

function TemplateCard({ template, onImport }: TemplateCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border-default bg-bg-surface">
      <div className="border-b border-border-default bg-bg-base p-3">
        <TemplatePreview template={template} />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-1 flex-col gap-1.5">
          <h3 className="text-sm font-semibold text-text-primary">
            {template.name}
          </h3>
          <p className="text-xs leading-relaxed text-text-muted">
            {template.description}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full gap-2 rounded-xl border-border-default text-text-secondary hover:border-border-subtle hover:bg-bg-elevated hover:text-text-primary"
          onClick={onImport}
        >
          <Download className="h-3.5 w-3.5" />
          Import
        </Button>
      </div>
    </div>
  );
}

/** Fixed preview viewport size (CSS px). */
const PREVIEW_WIDTH = 260;
const PREVIEW_HEIGHT = 140;
const PREVIEW_PADDING = 16;

/**
 * Lightweight SVG diagram preview — no React Flow instance.
 * Fits template node bounds into a fixed viewport and draws edges + shapes.
 */
function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const bounds = computeBounds(template.nodes);
  const contentW = Math.max(bounds.width, 1);
  const contentH = Math.max(bounds.height, 1);

  const scale = Math.min(
    (PREVIEW_WIDTH - PREVIEW_PADDING * 2) / contentW,
    (PREVIEW_HEIGHT - PREVIEW_PADDING * 2) / contentH,
  );

  const offsetX =
    (PREVIEW_WIDTH - contentW * scale) / 2 - bounds.minX * scale;
  const offsetY =
    (PREVIEW_HEIGHT - contentH * scale) / 2 - bounds.minY * scale;

  const nodeMap = new Map(template.nodes.map((node) => [node.id, node]));

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${PREVIEW_WIDTH} ${PREVIEW_HEIGHT}`}
      className="block h-[140px] w-full"
      aria-hidden
    >
      {/* Edges as simple lines between node centers */}
      {template.edges.map((edge) => {
        const source = nodeMap.get(edge.source);
        const target = nodeMap.get(edge.target);
        if (!source || !target) return null;

        const s = nodeCenter(source, scale, offsetX, offsetY);
        const t = nodeCenter(target, scale, offsetX, offsetY);

        return (
          <line
            key={edge.id}
            x1={s.x}
            y1={s.y}
            x2={t.x}
            y2={t.y}
            stroke="var(--border-subtle)"
            strokeWidth={1.25}
            strokeLinecap="round"
          />
        );
      })}

      {/* Nodes using shape + palette fill */}
      {template.nodes.map((node) => {
        const color =
          NODE_COLORS.find((c) => c.name === node.data.color) ??
          NODE_COLORS[0];
        const w = (node.width ?? 160) * scale;
        const h = (node.height ?? 80) * scale;
        const x = node.position.x * scale + offsetX;
        const y = node.position.y * scale + offsetY;

        return (
          <PreviewShape
            key={node.id}
            shape={node.data.shape}
            x={x}
            y={y}
            width={w}
            height={h}
            fill={color.fill}
            stroke={color.text}
          />
        );
      })}
    </svg>
  );
}

interface Bounds {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

function computeBounds(nodes: CanvasNode[]): Bounds {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, width: 1, height: 1 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const w = node.width ?? 160;
    const h = node.height ?? 80;
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + w);
    maxY = Math.max(maxY, node.position.y + h);
  }

  return {
    minX,
    minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function nodeCenter(
  node: CanvasNode,
  scale: number,
  offsetX: number,
  offsetY: number,
): { x: number; y: number } {
  const w = (node.width ?? 160) * scale;
  const h = (node.height ?? 80) * scale;
  return {
    x: node.position.x * scale + offsetX + w / 2,
    y: node.position.y * scale + offsetY + h / 2,
  };
}

interface PreviewShapeProps {
  shape: NodeShape;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
}

/**
 * Draw a simplified node silhouette for the card preview.
 * Shapes mirror the canvas vocabulary without labels or handles.
 */
function PreviewShape({
  shape,
  x,
  y,
  width,
  height,
  fill,
  stroke,
}: PreviewShapeProps) {
  const strokeWidth = 1.25;

  if (shape === "circle") {
    return (
      <ellipse
        cx={x + width / 2}
        cy={y + height / 2}
        rx={width / 2}
        ry={height / 2}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        opacity={0.95}
      />
    );
  }

  if (shape === "pill") {
    const r = Math.min(width, height) / 2;
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={r}
        ry={r}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        opacity={0.95}
      />
    );
  }

  if (shape === "diamond") {
    const cx = x + width / 2;
    const cy = y + height / 2;
    const points = [
      `${cx},${y}`,
      `${x + width},${cy}`,
      `${cx},${y + height}`,
      `${x},${cy}`,
    ].join(" ");
    return (
      <polygon
        points={points}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        opacity={0.95}
      />
    );
  }

  if (shape === "hexagon") {
    const inset = width * 0.22;
    const points = [
      `${x + inset},${y}`,
      `${x + width - inset},${y}`,
      `${x + width},${y + height / 2}`,
      `${x + width - inset},${y + height}`,
      `${x + inset},${y + height}`,
      `${x},${y + height / 2}`,
    ].join(" ");
    return (
      <polygon
        points={points}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        opacity={0.95}
      />
    );
  }

  if (shape === "cylinder") {
    const cx = x + width / 2;
    const rx = width / 2;
    const ry = Math.min(height * 0.14, 8);
    const topY = y + ry;
    const bottomY = y + height - ry;

    return (
      <g opacity={0.95}>
        <path
          d={`
            M ${x} ${topY}
            L ${x} ${bottomY}
            A ${rx} ${ry} 0 0 0 ${x + width} ${bottomY}
            L ${x + width} ${topY}
            A ${rx} ${ry} 0 0 0 ${x} ${topY}
            Z
          `}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
        <ellipse
          cx={cx}
          cy={topY}
          rx={rx}
          ry={ry}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      </g>
    );
  }

  // rectangle (default)
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={4}
      ry={4}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      opacity={0.95}
    />
  );
}
