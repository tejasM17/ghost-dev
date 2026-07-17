import { get } from "@vercel/blob";
import { NextResponse } from "next/server";

import { getCurrentUserId, getProjectWithAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/projects/[projectId]/specs/[specId]/download
 *
 * Authenticated download of a generated Markdown spec.
 * Validates project access and that the spec belongs to the project, then
 * streams the private Vercel Blob content as a downloadable attachment.
 * Never returns the raw Blob URL to the client.
 */
export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ projectId: string; specId: string }>;
  },
) {
  try {
    const { projectId, specId } = await params;

    if (!projectId || !specId) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await getProjectWithAccess(projectId);
    if (!project) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const spec = await prisma.projectSpec.findUnique({
      where: { id: specId },
      select: { id: true, projectId: true, filePath: true },
    });

    if (!spec || spec.projectId !== projectId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!spec.filePath || spec.filePath === "pending") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    try {
      const result = await get(spec.filePath, {
        access: "private",
        useCache: false,
      });

      if (!result || result.statusCode !== 200 || !result.stream) {
        return NextResponse.json(
          { error: "Failed to fetch spec blob" },
          { status: 502 },
        );
      }

      const body = await new Response(result.stream).text();
      const filename = `spec-${spec.id}.md`;

      return new NextResponse(body, {
        status: 200,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "private, no-store",
        },
      });
    } catch {
      return NextResponse.json(
        { error: "Failed to load spec blob" },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error(
      "[GET /api/projects/[projectId]/specs/[specId]/download]",
      error,
    );
    return NextResponse.json(
      { error: "Failed to download spec" },
      { status: 500 },
    );
  }
}
