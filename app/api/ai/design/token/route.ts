import { auth } from "@trigger.dev/sdk";
import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface TokenBody {
  runId?: unknown;
}

/**
 * Parse and validate the token request body.
 * Requires a non-empty runId string.
 */
function parseTokenBody(body: unknown): { runId: string } | null {
  if (body === null || typeof body !== "object") return null;
  const { runId } = body as TokenBody;
  if (typeof runId !== "string" || runId.trim().length === 0) return null;
  return { runId: runId.trim() };
}

/**
 * POST /api/ai/design/token
 *
 * Issue a Trigger.dev public access token scoped to a single run, after
 * verifying the caller owns the matching TaskRun record.
 */
export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const input = parseTokenBody(body);
  if (!input) {
    return NextResponse.json(
      { error: "Invalid payload. Expected { runId } as a non-empty string." },
      { status: 400 },
    );
  }

  const taskRun = await prisma.taskRun.findUnique({
    where: { runId: input.runId },
    select: { runId: true, userId: true },
  });

  if (!taskRun || taskRun.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const token = await auth.createPublicToken({
    scopes: {
      read: {
        runs: [taskRun.runId],
      },
    },
  });

  return NextResponse.json({ token });
}
