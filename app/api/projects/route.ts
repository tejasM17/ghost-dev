import { NextResponse } from "next/server";

import { getCurrentUser, getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAllProjects } from "@/lib/projects";

/** Default project name when the create request omits one. */
const DEFAULT_PROJECT_NAME = "Untitled Project";

/**
 * Parse a `name` field out of an unknown JSON body. Trims it, treats empty
 * strings as "missing", and surfaces a `null` for the caller to default.
 */
function readName(body: unknown): string | null {
  if (body === null || typeof body !== "object") return null;
  const raw = (body as Record<string, unknown>).name;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * List projects the current user can open: owned + shared (collaborator).
 * Returns both arrays so clients can render "My Projects" and "Shared".
 */
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { owned, shared } = await getAllProjects(
      currentUser.userId,
      currentUser.email,
    );

    return NextResponse.json({
      projects: owned,
      owned,
      shared,
    });
  } catch (error) {
    console.error("[GET /api/projects]", error);
    return NextResponse.json(
      { error: "Failed to list projects" },
      { status: 500 },
    );
  }
}

/** Create a project owned by the current user. Missing name defaults to "Untitled Project". */
export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Body is optional — POST /api/projects with no body is still valid.
    let body: unknown = null;
    try {
      body = await request.json();
    } catch {
      body = null;
    }

    const name = readName(body) ?? DEFAULT_PROJECT_NAME;

    const project = await prisma.project.create({
      data: {
        ownerId: userId,
        name,
      },
    });

    // Best-effort: pre-create Liveblocks room with owner write access so the
    // first editor open does not race room provisioning.
    try {
      const { liveblocks } = await import("@/lib/liveblocks");
      await liveblocks.getOrCreateRoom(project.id, {
        defaultAccesses: [],
        usersAccesses: {
          [userId]: ["room:write"],
        },
      });
    } catch (error) {
      console.error("Failed to pre-create Liveblocks room on project create", error);
    }

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/projects]", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 },
    );
  }
}
