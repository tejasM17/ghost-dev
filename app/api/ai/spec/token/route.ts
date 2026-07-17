import { auth } from "@trigger.dev/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const tokenRequestSchema = z.object({
  runId: z.string().min(1),
});

/**
 * POST /api/ai/spec/token
 *
 * Issue a Trigger.dev public access token scoped to a single generate-spec
 * run, after verifying the caller owns the matching TaskRun record.
 * Token expiration is 1 hour.
 */
export async function POST(request: Request) {
  try {
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

    const parsed = tokenRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload. Expected { runId } as a non-empty string." },
        { status: 400 },
      );
    }

    const { runId } = parsed.data;

    const taskRun = await prisma.taskRun.findUnique({
      where: { runId },
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
      expirationTime: "1hr",
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error("[POST /api/ai/spec/token]", error);
    return NextResponse.json(
      { error: "Failed to issue spec run token" },
      { status: 500 },
    );
  }
}
