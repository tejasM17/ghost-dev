import { tasks } from "@trigger.dev/sdk";
import { NextResponse } from "next/server";

import { getCurrentUserId, getProjectWithAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { designAgentTask } from "@/src/trigger/design-agent";

interface DesignBody {
  prompt?: unknown;
  roomId?: unknown;
  projectId?: unknown;
}

interface DesignRequest {
  prompt: string;
  roomId: string;
  projectId: string;
}

/**
 * Parse and validate the design trigger body.
 * Requires non-empty prompt, roomId, and projectId strings.
 */
function parseDesignBody(body: unknown): DesignRequest | null {
  if (body === null || typeof body !== "object") return null;
  const { prompt, roomId, projectId } = body as DesignBody;
  if (typeof prompt !== "string" || prompt.trim().length === 0) return null;
  if (typeof roomId !== "string" || roomId.trim().length === 0) return null;
  if (typeof projectId !== "string" || projectId.trim().length === 0) {
    return null;
  }
  return {
    prompt: prompt.trim(),
    roomId: roomId.trim(),
    projectId: projectId.trim(),
  };
}

/**
 * POST /api/ai/design
 *
 * Trigger the design-agent background task for an authorized project.
 * Persists a TaskRun ownership record and returns the Trigger.dev run id.
 * roomId must equal projectId (Liveblocks room id is the project id).
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

    const input = parseDesignBody(body);
    if (!input) {
      return NextResponse.json(
        {
          error:
            "Invalid payload. Expected { prompt, roomId, projectId } as non-empty strings.",
        },
        { status: 400 },
      );
    }

    // Prevent triggering design against a different room than the project
    // the caller was authorized for (room id === project id in this app).
    if (input.roomId !== input.projectId) {
      return NextResponse.json(
        { error: "roomId must match projectId" },
        { status: 400 },
      );
    }

    const project = await getProjectWithAccess(input.projectId);
    if (!project) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const handle = await tasks.trigger<typeof designAgentTask>("design-agent", {
      prompt: input.prompt,
      roomId: project.id,
    });

    await prisma.taskRun.create({
      data: {
        runId: handle.id,
        projectId: project.id,
        userId,
      },
    });

    return NextResponse.json({ runId: handle.id });
  } catch (error) {
    console.error("[POST /api/ai/design]", error);
    return NextResponse.json(
      { error: "Failed to start design generation" },
      { status: 500 },
    );
  }
}
