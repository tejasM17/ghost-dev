import { tasks } from "@trigger.dev/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUserId, getProjectWithAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { generateSpecTask } from "@/src/trigger/generate-spec";

/**
 * Chat history entry sent from the client for spec context.
 * Kept permissive so design-chat and future shapes both validate.
 */
const chatHistoryEntrySchema = z.object({
  role: z.enum(["user", "assistant", "system"]).optional(),
  content: z.string(),
  sender: z.string().optional(),
  timestamp: z.number().optional(),
});

/**
 * Minimal node/edge shapes for canvas snapshot validation.
 * Full React Flow fields are allowed via passthrough-style records.
 */
const canvasNodeSchema = z
  .object({
    id: z.string().min(1),
    type: z.string().optional(),
    position: z
      .object({
        x: z.number(),
        y: z.number(),
      })
      .optional(),
    data: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

const canvasEdgeSchema = z
  .object({
    id: z.string().min(1),
    source: z.string().min(1),
    target: z.string().min(1),
    type: z.string().optional(),
    data: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

const specRequestSchema = z.object({
  roomId: z.string().min(1),
  chatHistory: z.array(chatHistoryEntrySchema).default([]),
  nodes: z.array(canvasNodeSchema),
  edges: z.array(canvasEdgeSchema),
});

export type SpecRequestBody = z.infer<typeof specRequestSchema>;

/**
 * POST /api/ai/spec
 *
 * Trigger the generate-spec background task for an authorized project.
 * Project access is resolved from roomId (not a client-supplied projectId).
 * Persists a TaskRun ownership record and returns the Trigger.dev run id.
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

    const parsed = specRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            "Invalid payload. Expected { roomId, chatHistory, nodes, edges } with valid shapes.",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { roomId, chatHistory, nodes, edges } = parsed.data;

    // roomId is the project id in this app; never trust a client projectId.
    const project = await getProjectWithAccess(roomId);
    if (!project) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Always bind the task to the authorized project id (ignore client drift).
    const handle = await tasks.trigger<typeof generateSpecTask>(
      "generate-spec",
      {
        projectId: project.id,
        roomId: project.id,
        chatHistory,
        nodes,
        edges,
      },
    );

    await prisma.taskRun.create({
      data: {
        runId: handle.id,
        projectId: project.id,
        userId,
      },
    });

    return NextResponse.json({ runId: handle.id });
  } catch (error) {
    console.error("[POST /api/ai/spec]", error);
    return NextResponse.json(
      { error: "Failed to start spec generation" },
      { status: 500 },
    );
  }
}
