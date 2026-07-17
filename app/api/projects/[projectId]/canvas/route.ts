import { get, put } from "@vercel/blob";
import { NextResponse } from "next/server";

import { getCurrentUserId, getProjectWithAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

interface CanvasBody {
  nodes?: unknown;
  edges?: unknown;
}

interface CanvasSnapshot {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

/**
 * Validate canvas JSON body. Accepts an object with `nodes` and `edges`
 * arrays; anything else is rejected.
 */
function parseCanvasBody(body: unknown): CanvasSnapshot | null {
  if (body === null || typeof body !== "object") return null;
  const { nodes, edges } = body as CanvasBody;
  if (!Array.isArray(nodes) || !Array.isArray(edges)) return null;
  return {
    nodes: nodes as CanvasNode[],
    edges: edges as CanvasEdge[],
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
    select: { id: true, canvasJsonPath: true, updatedAt: true },
  });

  return NextResponse.json({
    canvasJsonPath: updated.canvasJsonPath,
    updatedAt: updated.updatedAt,
  });
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
      canvasJsonPath: null,
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
      canvasJsonPath: record.canvasJsonPath,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load canvas blob" },
      { status: 502 },
    );
  }
}
