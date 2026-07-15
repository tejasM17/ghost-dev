import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

/** List projects owned by the current user. */
export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ projects });
}

/** Create a project owned by the current user. Missing name defaults to "Untitled Project". */
export async function POST(request: Request) {
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

  return NextResponse.json({ project }, { status: 201 });
}
