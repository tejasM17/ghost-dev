import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { mutateFlow } from "@liveblocks/react-flow/node";
import { put } from "@vercel/blob";
import { logger, metadata, task } from "@trigger.dev/sdk";
import { generateText } from "ai";
import { z } from "zod";

import { liveblocks } from "@/lib/liveblocks";
import { prisma } from "@/lib/prisma";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

/**
 * Chat history entry for spec generation context.
 */
const chatHistoryEntrySchema = z.object({
  role: z.enum(["user", "assistant", "system"]).optional(),
  content: z.string(),
  sender: z.string().optional(),
  timestamp: z.number().optional(),
});

/**
 * Canvas node/edge snapshots supplied by the client at trigger time.
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

export const generateSpecPayloadSchema = z.object({
  projectId: z.string().min(1),
  roomId: z.string().min(1),
  chatHistory: z.array(chatHistoryEntrySchema).default([]),
  nodes: z.array(canvasNodeSchema),
  edges: z.array(canvasEdgeSchema),
});

export type GenerateSpecPayload = z.infer<typeof generateSpecPayloadSchema>;

/**
 * Spec generation task.
 *
 * Accepts the canvas graph and optional chat context, generates a Markdown
 * technical specification with Gemini, uploads it to Vercel Blob, stores
 * metadata on ProjectSpec, and surfaces progress via run metadata.
 */
export const generateSpecTask = task({
  id: "generate-spec",
  maxDuration: 3600,
  retry: {
    maxAttempts: 1,
  },
  run: async (payload: GenerateSpecPayload, { ctx }) => {
    const runId = ctx.run.id;

    const parsed = generateSpecPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      logger.error("generate-spec invalid payload", {
        runId,
        issues: parsed.error.flatten(),
      });
      metadata.set("status", "error");
      metadata.set("message", "Invalid task payload");
      throw new Error("Invalid generate-spec payload");
    }

    const { projectId, roomId, chatHistory, nodes, edges } = parsed.data;

    logger.log("generate-spec started", {
      projectId,
      roomId,
      runId,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      chatCount: chatHistory.length,
    });

    metadata.set("status", "start");
    metadata.set("message", "Starting technical spec generation…");
    metadata.set("kind", "spec");
    metadata.set("projectId", projectId);
    metadata.set("roomId", roomId);

    try {
      metadata.set("status", "processing");
      metadata.set("message", "Reading live canvas graph…");

      // Prefer the collaborative Liveblocks room (source of truth). Fall back
      // to the client snapshot when the room is empty or unreadable.
      const liveSnapshot = await readFlowSnapshot(roomId);
      const graphNodes =
        liveSnapshot.nodes.length > 0 ? liveSnapshot.nodes : nodes;
      const graphEdges =
        liveSnapshot.edges.length > 0 ? liveSnapshot.edges : edges;

      if (graphNodes.length === 0) {
        throw new Error(
          "Canvas is empty. Add architecture nodes before generating a spec.",
        );
      }

      metadata.set("message", "Analyzing architecture graph…");

      const compactGraph = compactCanvas(graphNodes, graphEdges);
      const compactChat = compactChatHistory(chatHistory);

      metadata.set("message", "Writing Markdown specification with Gemini…");

      const markdown = await generateSpecMarkdown({
        projectId,
        roomId,
        graph: compactGraph,
        chat: compactChat,
      });

      if (!markdown.trim()) {
        throw new Error("Gemini returned an empty specification");
      }

      metadata.set("message", "Saving specification…");

      const persisted = await persistSpecMarkdown({
        projectId,
        markdown,
      });

      metadata.set("status", "complete");
      metadata.set("message", "Specification ready.");
      metadata.set("charCount", markdown.length);
      metadata.set("specId", persisted.specId);

      logger.log("generate-spec complete", {
        projectId,
        roomId,
        runId,
        specId: persisted.specId,
        charCount: markdown.length,
      });

      return {
        ok: true as const,
        projectId,
        roomId,
        specId: persisted.specId,
        filePath: persisted.filePath,
        content: markdown,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown spec generation error";

      logger.error("generate-spec failed", {
        projectId,
        roomId,
        runId,
        message,
        error,
      });

      metadata.set("status", "error");
      metadata.set("message", `Spec generation failed: ${message}`);

      throw error;
    }
  },
});

interface CompactNode {
  id: string;
  label: string;
  shape?: string;
  color?: string;
  x?: number;
  y?: number;
}

interface CompactEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

interface CompactChatLine {
  role: string;
  content: string;
}

/**
 * Reduce canvas nodes/edges to fields useful for a technical write-up.
 */
function compactCanvas(
  nodes: z.infer<typeof canvasNodeSchema>[],
  edges: z.infer<typeof canvasEdgeSchema>[],
): { nodes: CompactNode[]; edges: CompactEdge[] } {
  const compactNodes: CompactNode[] = nodes.map((n) => {
    const data = (n.data ?? {}) as Record<string, unknown>;
    const label =
      typeof data.label === "string" && data.label.trim().length > 0
        ? data.label
        : n.id;
    const shape = typeof data.shape === "string" ? data.shape : undefined;
    const color = typeof data.color === "string" ? data.color : undefined;

    const entry: CompactNode = { id: n.id, label };
    if (shape) entry.shape = shape;
    if (color) entry.color = color;
    if (n.position) {
      entry.x = n.position.x;
      entry.y = n.position.y;
    }
    return entry;
  });

  const compactEdges: CompactEdge[] = edges.map((e) => {
    const data = (e.data ?? {}) as Record<string, unknown>;
    const label = typeof data.label === "string" ? data.label : undefined;
    const entry: CompactEdge = {
      id: e.id,
      source: e.source,
      target: e.target,
    };
    if (label) entry.label = label;
    return entry;
  });

  return { nodes: compactNodes, edges: compactEdges };
}

/**
 * Flatten chat history into short role/content lines for the prompt.
 */
function compactChatHistory(
  history: z.infer<typeof chatHistoryEntrySchema>[],
): CompactChatLine[] {
  const lines: CompactChatLine[] = [];
  for (const entry of history) {
    const content = entry.content.trim();
    if (!content) continue;
    lines.push({
      role: entry.role ?? "user",
      content,
    });
  }
  return lines;
}

/**
 * Read current collaborative nodes/edges without mutating them.
 * Mirrors design-agent so specs always reflect the live room graph.
 */
async function readFlowSnapshot(roomId: string): Promise<{
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}> {
  let nodes: CanvasNode[] = [];
  let edges: CanvasEdge[] = [];

  try {
    await mutateFlow<CanvasNode, CanvasEdge>(
      { client: liveblocks, roomId },
      (flow) => {
        nodes = flow.nodes.map((n) => ({
          ...n,
          position: { ...n.position },
          data: { ...n.data },
        })) as CanvasNode[];
        edges = flow.edges.map((e) => ({
          ...e,
          data: e.data ? { ...e.data } : e.data,
        })) as CanvasEdge[];
      },
    );
  } catch (error) {
    logger.warn("generate-spec could not read Liveblocks flow; using payload", {
      roomId,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  return { nodes, edges };
}

/**
 * Upload Markdown to private Vercel Blob and record metadata on ProjectSpec.
 * Follows the same pattern as canvas snapshots: Blob holds content, Prisma
 * stores the blob URL (`filePath`). Path: specs/{projectId}/{specId}.md
 */
async function persistSpecMarkdown(input: {
  projectId: string;
  markdown: string;
}): Promise<{ specId: string; filePath: string }> {
  // Create the row first so we have a stable specId for the blob pathname.
  const pending = await prisma.projectSpec.create({
    data: {
      projectId: input.projectId,
      // Temporary placeholder replaced immediately after upload.
      filePath: "pending",
    },
    select: { id: true },
  });

  const pathname = `specs/${input.projectId}/${pending.id}.md`;

  try {
    const blob = await put(pathname, input.markdown, {
      access: "private",
      contentType: "text/markdown; charset=utf-8",
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    const updated = await prisma.projectSpec.update({
      where: { id: pending.id },
      data: { filePath: blob.url },
      select: { id: true, filePath: true },
    });

    return { specId: updated.id, filePath: updated.filePath };
  } catch (error) {
    // Roll back orphan metadata if blob upload fails.
    await prisma.projectSpec
      .delete({ where: { id: pending.id } })
      .catch(() => {
        // Best-effort cleanup; original error is more important.
      });
    throw error;
  }
}

/**
 * Call Gemini to produce a Markdown technical specification.
 */
async function generateSpecMarkdown(input: {
  projectId: string;
  roomId: string;
  graph: { nodes: CompactNode[]; edges: CompactEdge[] };
  chat: CompactChatLine[];
}): Promise<string> {
  const apiKey =
    process.env.GOOGLE_AI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing GOOGLE_AI_API_KEY (or GOOGLE_GENERATIVE_AI_API_KEY)",
    );
  }

  const google = createGoogleGenerativeAI({ apiKey });

  const system = [
    "You are Ghost AI, a senior systems architect writing technical specifications.",
    "Given a collaborative architecture canvas (nodes + edges) and optional design chat,",
    "produce a clear, complete Markdown technical specification.",
    "",
    "Requirements:",
    "- Output ONLY Markdown (no surrounding code fences for the whole document).",
    "- Start with a title (# ...).",
    "- Include sections such as: Overview, Goals, Components, Data Flow,",
    "  Interfaces / APIs (inferred), Non-functional considerations, Open questions.",
    "- Ground the content in the provided nodes and edges; do not invent unrelated systems.",
    "- Use component labels from the canvas; mention connections via edge labels when present.",
    "- If chat history provides requirements or constraints, incorporate them.",
    "- Be concise but precise; prefer bullet lists and tables where helpful.",
  ].join("\n");

  const userPrompt = [
    `Project ID: ${input.projectId}`,
    `Room ID: ${input.roomId}`,
    "",
    "## Canvas nodes",
    "```json",
    JSON.stringify(input.graph.nodes, null, 2),
    "```",
    "",
    "## Canvas edges",
    "```json",
    JSON.stringify(input.graph.edges, null, 2),
    "```",
    "",
    "## Design chat history",
    input.chat.length === 0
      ? "(none)"
      : input.chat
          .map((line) => `- [${line.role}] ${line.content}`)
          .join("\n"),
    "",
    "Write the technical specification now.",
  ].join("\n");

  const result = await generateText({
    model: google("gemini-2.5-flash"),
    system,
    prompt: userPrompt,
  });

  return result.text.trim();
}
