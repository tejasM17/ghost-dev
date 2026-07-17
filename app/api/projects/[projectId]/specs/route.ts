import { NextResponse } from "next/server";

import { getCurrentUserId, getProjectWithAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/projects/[projectId]/specs
 *
 * List ProjectSpec metadata for a project the caller can access.
 * Returns id, createdAt, and a display filename — never blob paths or content.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await getProjectWithAccess(projectId);
    if (!project) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Prefer completed specs only. Pending rows are created before blob upload
    // finishes and must not appear in the UI list.
    const rows = await prisma.projectSpec.findMany({
      where: {
        projectId,
        NOT: { filePath: "pending" },
      },
      select: {
        id: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const specs = rows.map((row) => ({
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      filename: `spec-${row.id}.md`,
    }));

    return NextResponse.json({ specs });
  } catch (error) {
    console.error("[GET /api/projects/[projectId]/specs]", error);
    return NextResponse.json(
      { error: "Failed to load specs" },
      { status: 500 },
    );
  }
}
