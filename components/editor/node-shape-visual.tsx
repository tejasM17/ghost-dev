"use client";

import type { NodeShape } from "@/types/canvas";

interface NodeShapeVisualProps {
  shape: NodeShape;
  fill: string;
  borderColor: string;
  textColor: string;
  label: string;
  width: number;
  height: number;
  /** When true, used as a floating drag ghost (no interaction styles). */
  ghost?: boolean;
  /**
   * Centered placeholder shown when `label` is empty.
   * Drag ghosts pass no placeholder so empty previews stay blank.
   */
  emptyPlaceholder?: string;
}

/**
 * Shared visual for canvas nodes and the shape-panel drag preview.
 * CSS shapes: rectangle, pill, circle.
 * SVG shapes: diamond, hexagon, cylinder (scale with width/height).
 */
export function NodeShapeVisual({
  shape,
  fill,
  borderColor,
  textColor,
  label,
  width,
  height,
  ghost = false,
  emptyPlaceholder,
}: NodeShapeVisualProps) {
  const opacity = ghost ? 0.55 : 1;

  const displayText = label || emptyPlaceholder || "";
  const isPlaceholder = !label && Boolean(emptyPlaceholder);

  const labelEl = displayText ? (
    <span
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-2 text-center text-sm font-medium"
      style={{ color: textColor, opacity: isPlaceholder ? 0.4 : 1 }}
    >
      {displayText}
    </span>
  ) : null;

  if (shape === "rectangle" || shape === "pill" || shape === "circle") {
    const radius =
      shape === "circle"
        ? "9999px"
        : shape === "pill"
          ? "9999px"
          : "8px";

    return (
      <div
        className="relative box-border border-2"
        style={{
          width,
          height,
          backgroundColor: fill,
          borderColor,
          borderRadius: radius,
          opacity,
        }}
      >
        {labelEl}
      </div>
    );
  }

  return (
    <div className="relative" style={{ width, height, opacity }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0 block"
        preserveAspectRatio="none"
        aria-hidden
      >
        {shape === "diamond" && (
          <polygon
            points={`${width / 2},1 ${width - 1},${height / 2} ${width / 2},${height - 1} 1,${height / 2}`}
            fill={fill}
            stroke={borderColor}
            strokeWidth={2}
          />
        )}
        {shape === "hexagon" && (
          <polygon
            points={hexagonPoints(width, height)}
            fill={fill}
            stroke={borderColor}
            strokeWidth={2}
          />
        )}
        {shape === "cylinder" && <CylinderPath width={width} height={height} fill={fill} borderColor={borderColor} />}
      </svg>
      {labelEl}
    </div>
  );
}

function hexagonPoints(w: number, h: number): string {
  const inset = w * 0.22;
  return [
    `${inset},1`,
    `${w - inset},1`,
    `${w - 1},${h / 2}`,
    `${w - inset},${h - 1}`,
    `${inset},${h - 1}`,
    `1,${h / 2}`,
  ].join(" ");
}

function CylinderPath({
  width,
  height,
  fill,
  borderColor,
}: {
  width: number;
  height: number;
  fill: string;
  borderColor: string;
}) {
  const rx = width / 2 - 1;
  const cx = width / 2;
  const ellipseRy = Math.min(height * 0.12, 14);
  const topY = ellipseRy + 1;
  const bottomY = height - ellipseRy - 1;

  return (
    <>
      {/* Body */}
      <path
        d={`
          M 1 ${topY}
          L 1 ${bottomY}
          A ${rx} ${ellipseRy} 0 0 0 ${width - 1} ${bottomY}
          L ${width - 1} ${topY}
          A ${rx} ${ellipseRy} 0 0 0 1 ${topY}
          Z
        `}
        fill={fill}
        stroke={borderColor}
        strokeWidth={2}
      />
      {/* Top ellipse */}
      <ellipse
        cx={cx}
        cy={topY}
        rx={rx}
        ry={ellipseRy}
        fill={fill}
        stroke={borderColor}
        strokeWidth={2}
      />
    </>
  );
}
