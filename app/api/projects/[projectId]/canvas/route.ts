import { get, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUserId, getProjectWithAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

interface CanvasSnapshot {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

const canvasNodeSchema = z
  .object({
    id: z.string().min(1),
    position: z.object({ x: z.number(), y: z.number() }),
    data: z.record(z.string(), z.unknown()),
  })
  .passthrough();

const canvasEdgeSchema = z
  .object({
    id: z.string().min(1),
    source: z.string().min(1),
    target: z.string().min(1),
  })
  .passthrough();

const canvasSnapshotSchema = z.object({
  nodes: z.array(canvasNodeSchema),
  edges: z.array(canvasEdgeSchema),
});

/**
 * Validate canvas JSON body. Accepts an object with `nodes` and `edges`
 * arrays; anything else is rejected.
 */
function parseCanvasBody(body: unknown): CanvasSnapshot | null {
  const parsed = canvasSnapshotSchema.safeParse(body);
  if (!parsed.success) return null;
  return {
    nodes: parsed.data.nodes as CanvasNode[],
    edges: parsed.data.edges as CanvasEdge[],
  };
}

/**
 * PUT /api/projects/[projectId]/canvas
 *
 * Upload the latest canvas JSON to Vercel Blob and store the blob URL on
 * the Prisma project record (`canvasJsonPath`).
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;

    const project = await getProjectWithAccess(projectId);
    if (!project) {
      // getProjectWithAccess returns null for both no-session and no access.
      const userId = await getCurrentUserId();
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: unknown = null;
    try {
      body = await request.json();
    } catch {
      body = null;
    }

    const snapshot = parseCanvasBody(body);
    if (!snapshot) {
      return NextResponse.json(
        { error: "Invalid canvas payload. Expected { nodes, edges }." },
        { status: 400 },
      );
    }

    const pathname = `canvas/${projectId}.json`;
    const blob = await put(pathname, JSON.stringify(snapshot), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: { canvasJsonPath: blob.url },
      select: { updatedAt: true },
    });

    return NextResponse.json({
      saved: true,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    console.error("[PUT /api/projects/.../canvas]", error);
    return NextResponse.json(
      { error: "Failed to save canvas" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/projects/[projectId]/canvas
 *
 * Read the project's saved blob URL from Prisma, fetch the canvas JSON
 * from Vercel Blob, and return it to the editor.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;

    const project = await getProjectWithAccess(projectId);
    if (!project) {
      const userId = await getCurrentUserId();
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const record = await prisma.project.findUnique({
      where: { id: projectId },
      select: { canvasJsonPath: true },
    });

    if (!record?.canvasJsonPath) {
      return NextResponse.json({
        nodes: [] as CanvasNode[],
        edges: [] as CanvasEdge[],
        hasSnapshot: false,
      });
    }

    try {
      const result = await get(record.canvasJsonPath, {
        access: "private",
        useCache: false,
      });

      if (!result || result.statusCode !== 200 || !result.stream) {
        return NextResponse.json(
          { error: "Failed to fetch canvas blob" },
          { status: 502 },
        );
      }

      const text = await new Response(result.stream).text();
      let data: unknown = null;
      try {
        data = JSON.parse(text) as unknown;
      } catch {
        return NextResponse.json(
          { error: "Invalid canvas blob contents" },
          { status: 502 },
        );
      }

      const snapshot = parseCanvasBody(data);
      if (!snapshot) {
        return NextResponse.json(
          { error: "Invalid canvas blob contents" },
          { status: 502 },
        );
      }

      return NextResponse.json({
        nodes: snapshot.nodes,
        edges: snapshot.edges,
        hasSnapshot: true,
      });
    } catch {
      return NextResponse.json(
        { error: "Failed to load canvas blob" },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("[GET /api/projects/.../canvas]", error);
    return NextResponse.json(
      { error: "Failed to load canvas" },
      { status: 500 },
    );
  }
}
