import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Remove a collaborator. Only the owner may remove.
 */
export async function DELETE(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ projectId: string; collaboratorId: string }>;
  },
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, collaboratorId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, ownerId: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Only owner can remove collaborators
  if (project.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Find the collaborator
  const collaborator = await prisma.projectCollaborator.findUnique({
    where: { id: collaboratorId },
    select: { id: true, projectId: true, email: true },
  });

  if (!collaborator || collaborator.projectId !== projectId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.projectCollaborator.delete({
    where: { id: collaboratorId },
  });

  // Revoke Liveblocks room access for the removed collaborator when we
  // can resolve their Clerk user ID. Best-effort — DB membership is source
  // of truth and auth will refuse tokens without a collaborator row.
  try {
    const { clerkClient } = await import("@clerk/nextjs/server");
    const { liveblocks } = await import("@/lib/liveblocks");
    const clerk = await clerkClient();
    const list = await clerk.users.getUserList({
      emailAddress: [collaborator.email.toLowerCase()],
      limit: 1,
    });
    const removedId = (list as unknown as { data: { id: string }[] }).data?.[0]
      ?.id;
    if (removedId) {
      await liveblocks.updateRoom(project.id, {
        usersAccesses: {
          [removedId]: null,
        },
      });
    }
  } catch (error) {
    console.error("Failed to revoke Liveblocks access on remove", error);
  }

  return new NextResponse(null, { status: 204 });
}