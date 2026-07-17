import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RenameBody {
  name?: unknown;
}

function readName(body: unknown): string | null {
  if (body === null || typeof body !== "object") return null;
  const raw = (body as RenameBody).name;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Rename a project. Only the owner may rename. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, ownerId: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (project.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const name = readName(body);
  if (!name) {
    return NextResponse.json(
      { error: "Project name is required" },
      { status: 400 },
    );
  }

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { name },
  });

  return NextResponse.json({ project: updated });
}

/** Delete a project. Only the owner may delete. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, ownerId: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (project.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.project.delete({ where: { id: projectId } });

  // Best-effort: drop the Liveblocks room so deleted projects cannot be
  // re-joined with a stale room id. DB is source of truth; auth will 403.
  try {
    const { liveblocks } = await import("@/lib/liveblocks");
    await liveblocks.deleteRoom(projectId);
  } catch (error) {
    console.error("Failed to delete Liveblocks room on project delete", error);
  }

  return new NextResponse(null, { status: 204 });
}
