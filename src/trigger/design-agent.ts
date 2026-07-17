import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { mutateFlow, type MutableFlow } from "@liveblocks/react-flow/node";
import { logger, task } from "@trigger.dev/sdk";
import { generateObject } from "ai";
import { z } from "zod";

import { liveblocks } from "@/lib/liveblocks";
import {
  NODE_COLORS,
  NODE_SHAPES,
  type CanvasEdge,
  type CanvasNode,
  type NodeColorName,
  type NodeShape,
} from "@/types/canvas";
import {
  AI_STATUS_FEED_ID,
  type AiStatusFeedPayload,
  type AiStatusPhase,
} from "@/types/tasks";

/** Stable Liveblocks user id for the design agent presence. */
const AI_USER_ID = "ghost-ai";

/** Matches product AI accent (`--accent-ai`). */
const AI_COLOR = "#6457f9";

/** Presence TTL while the agent is actively working (seconds). */
const PRESENCE_TTL_ACTIVE = 120;

/** Short TTL used when clearing agent presence. */
const PRESENCE_TTL_CLEAR = 2;

/** Default node dimensions (aligned with shape panel / templates). */
const DEFAULT_SIZE: Record<NodeShape, { width: number; height: number }> = {
  rectangle: { width: 180, height: 72 },
  diamond: { width: 110, height: 110 },
  circle: { width: 96, height: 96 },
  pill: { width: 150, height: 56 },
  cylinder: { width: 100, height: 110 },
  hexagon: { width: 130, height: 100 },
};

/** Horizontal / vertical spacing targets for generated layouts. */
const LAYOUT = {
  colGap: 240,
  rowGap: 140,
  originX: 80,
  originY: 80,
} as const;

const colorNames = NODE_COLORS.map((c) => c.name) as [
  NodeColorName,
  ...NodeColorName[],
];
const shapeNames = [...NODE_SHAPES] as [NodeShape, ...NodeShape[]];

const designActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("addNode"),
    id: z.string().min(1),
    label: z.string().min(1),
    shape: z.enum(shapeNames),
    color: z.enum(colorNames),
    x: z.number(),
    y: z.number(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
  }),
  z.object({
    type: z.literal("moveNode"),
    id: z.string().min(1),
    x: z.number(),
    y: z.number(),
  }),
  z.object({
    type: z.literal("resizeNode"),
    id: z.string().min(1),
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  z.object({
    type: z.literal("updateNodeData"),
    id: z.string().min(1),
    label: z.string().optional(),
    color: z.enum(colorNames).optional(),
    shape: z.enum(shapeNames).optional(),
  }),
  z.object({
    type: z.literal("deleteNode"),
    id: z.string().min(1),
  }),
  z.object({
    type: z.literal("addEdge"),
    id: z.string().min(1),
    source: z.string().min(1),
    target: z.string().min(1),
    label: z.string().optional(),
  }),
  z.object({
    type: z.literal("deleteEdge"),
    id: z.string().min(1),
  }),
]);

const designPlanSchema = z.object({
  summary: z
    .string()
    .describe("Short plain-language summary of what will be drawn"),
  actions: z
    .array(designActionSchema)
    .max(80)
    .describe("Ordered canvas mutations to apply"),
});

type DesignAction = z.infer<typeof designActionSchema>;
type DesignPlan = z.infer<typeof designPlanSchema>;

/**
 * Design generation task.
 *
 * Interprets a natural-language prompt with Gemini, applies structured
 * canvas mutations through Liveblocks `mutateFlow`, and surfaces AI
 * presence + status events so all room participants can follow progress.
 */
export const designAgentTask = task({
  id: "design-agent",
  maxDuration: 3600,
  retry: {
    maxAttempts: 1,
  },
  run: async (payload: { prompt: string; roomId: string }, { ctx }) => {
    const { prompt, roomId } = payload;
    const runId = ctx.run.id;

    logger.log("design-agent started", { prompt, roomId, runId });

    try {
      await publishStatus(roomId, "start", "Ghost AI started designing…");
      await setAiPresence(roomId, {
        thinking: true,
        cursor: { x: LAYOUT.originX, y: LAYOUT.originY },
      });

      await publishStatus(
        roomId,
        "processing",
        "Reading the current canvas…",
      );

      const snapshot = await readFlowSnapshot(roomId);

      await publishStatus(
        roomId,
        "processing",
        "Interpreting your prompt with Gemini…",
      );

      const plan = await planDesign(prompt, snapshot);

      logger.log("design-agent plan ready", {
        roomId,
        runId,
        actionCount: plan.actions.length,
        summary: plan.summary,
      });

      await publishStatus(
        roomId,
        "processing",
        plan.summary || "Applying design to the canvas…",
      );

      await applyActions(roomId, plan.actions);

      await publishStatus(
        roomId,
        "complete",
        plan.summary
          ? `Done — ${plan.summary}`
          : "Design complete.",
      );

      await clearAiPresence(roomId);

      return {
        ok: true as const,
        prompt,
        roomId,
        actionCount: plan.actions.length,
        summary: plan.summary,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown design agent error";

      logger.error("design-agent failed", { roomId, runId, message, error });

      try {
        await publishStatus(
          roomId,
          "error",
          `Design failed: ${message}`,
        );
      } catch (statusError) {
        logger.error("design-agent status publish failed", { statusError });
      }

      try {
        await clearAiPresence(roomId);
      } catch (presenceError) {
        logger.error("design-agent presence clear failed", { presenceError });
      }

      // Fail the task after status/presence cleanup so Trigger records the error.
      throw error;
    }
  },
});

/**
 * Publish a status message to the shared Liveblocks `ai-status-feed`.
 * Clients subscribe via `useFeedMessages` and show the latest entry.
 */
async function publishStatus(
  roomId: string,
  phase: AiStatusPhase,
  message: string,
): Promise<void> {
  await ensureAiStatusFeed(roomId);

  const data: AiStatusFeedPayload = {
    phase,
    message,
    text: message,
    at: Date.now(),
    kind: "design",
  };

  await liveblocks.createFeedMessage({
    roomId,
    feedId: AI_STATUS_FEED_ID,
    // JsonObject requires an index signature; payload is a plain object.
    data: { ...data },
  });
}

/** Create the AI status feed once per room (ignore if it already exists). */
async function ensureAiStatusFeed(roomId: string): Promise<void> {
  try {
    await liveblocks.createFeed({
      roomId,
      feedId: AI_STATUS_FEED_ID,
    });
  } catch {
    // Feed already exists or concurrent create — safe to continue.
  }
}

/**
 * Update ephemeral AI agent presence (cursor + thinking).
 */
async function setAiPresence(
  roomId: string,
  data: {
    thinking: boolean;
    cursor: { x: number; y: number } | null;
  },
  ttl: number = PRESENCE_TTL_ACTIVE,
): Promise<void> {
  await liveblocks.setPresence(roomId, {
    userId: AI_USER_ID,
    data: {
      cursor: data.cursor,
      thinking: data.thinking,
    },
    userInfo: {
      name: "Ghost AI",
      avatar: "",
      color: AI_COLOR,
    },
    ttl,
  });
}

/**
 * Clear AI presence shortly after the run finishes.
 */
async function clearAiPresence(roomId: string): Promise<void> {
  await setAiPresence(
    roomId,
    { thinking: false, cursor: null },
    PRESENCE_TTL_CLEAR,
  );
}

/**
 * Read current collaborative nodes/edges without mutating them.
 */
async function readFlowSnapshot(roomId: string): Promise<{
  nodes: readonly CanvasNode[];
  edges: readonly CanvasEdge[];
}> {
  let nodes: readonly CanvasNode[] = [];
  let edges: readonly CanvasEdge[] = [];

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

  return { nodes, edges };
}

/**
 * Call Gemini to produce a structured list of canvas actions.
 */
async function planDesign(
  prompt: string,
  snapshot: {
    nodes: readonly CanvasNode[];
    edges: readonly CanvasEdge[];
  },
): Promise<DesignPlan> {
  const apiKey =
    process.env.GOOGLE_AI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing GOOGLE_AI_API_KEY (or GOOGLE_GENERATIVE_AI_API_KEY)",
    );
  }

  const google = createGoogleGenerativeAI({ apiKey });

  const compactNodes = snapshot.nodes.map((n) => ({
    id: n.id,
    label: n.data?.label ?? "",
    shape: n.data?.shape,
    color: n.data?.color,
    x: n.position.x,
    y: n.position.y,
    width: n.width ?? null,
    height: n.height ?? null,
  }));

  const compactEdges = snapshot.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.data?.label ?? "",
  }));

  const system = [
    "You are Ghost AI, an architecture design agent for a collaborative system-design canvas.",
    "Convert the user request into ordered canvas mutations.",
    "",
    "Allowed node shapes only: " + NODE_SHAPES.join(", "),
    "Allowed node colors only: " + colorNames.join(", "),
    "",
    "Shape guidance:",
    "- rectangle: general service / process",
    "- pill: client / user / lightweight process",
    "- diamond: decision / gateway",
    "- circle: event / endpoint",
    "- cylinder: database / storage / cache",
    "- hexagon: external system / third party",
    "",
    "Color guidance (semantic, not decorative):",
    "- blue: clients / entry points",
    "- green: gateways / APIs",
    "- purple: core services",
    "- teal: data stores",
    "- orange: queues / async",
    "- red: critical / risk paths",
    "- pink: auth / identity",
    "- neutral: generic / unknown",
    "",
    "Layout rules:",
    `- Place nodes on a loose grid starting near (${LAYOUT.originX}, ${LAYOUT.originY}).`,
    `- Prefer left-to-right data flow with ~${LAYOUT.colGap}px column spacing and ~${LAYOUT.rowGap}px row spacing.`,
    "- Avoid overlapping nodes; leave clear gaps.",
    "- Use unique string ids (e.g. ai-api-gateway, ai-edge-1).",
    "- Prefer addNode/addEdge for new designs. Use move/resize/update/delete when refining existing graphs.",
    "- Edge labels optional; keep them short (e.g. HTTPS, gRPC, events).",
    "- If the canvas is empty, generate a complete initial architecture for the prompt.",
    "- If the canvas already has nodes, extend or refine it rather than wiping it unless the user asks to redesign.",
    "- Return at most 80 actions.",
  ].join("\n");

  const user = [
    `User prompt:\n${prompt}`,
    "",
    `Current nodes (${compactNodes.length}):`,
    JSON.stringify(compactNodes, null, 2),
    "",
    `Current edges (${compactEdges.length}):`,
    JSON.stringify(compactEdges, null, 2),
  ].join("\n");

  const { object } = await generateObject({
    model: google("gemini-2.5-flash"),
    schema: designPlanSchema,
    schemaName: "DesignPlan",
    schemaDescription: "Canvas mutation plan for Ghost AI design agent",
    system,
    prompt: user,
  });

  return object;
}

/**
 * Apply planned mutations through the existing collaborative flow utilities.
 * Presence cursor tracks the work so collaborators see the agent moving.
 */
async function applyActions(
  roomId: string,
  actions: DesignAction[],
): Promise<void> {
  if (actions.length === 0) {
    return;
  }

  // Apply in one mutateFlow session so Storage stays consistent, while
  // still refreshing presence between logical steps when possible.
  await mutateFlow<CanvasNode, CanvasEdge>(
    { client: liveblocks, roomId },
    async (flow) => {
      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        applyOneAction(flow, action);

        const cursor = cursorForAction(flow, action);
        // Presence refresh is best-effort and must not abort canvas writes.
        try {
          await setAiPresence(roomId, {
            thinking: true,
            cursor,
          });
        } catch (presenceError) {
          logger.warn("design-agent presence refresh failed", {
            presenceError,
            actionIndex: i,
          });
        }

        // Small pause so collaborators can see progressive updates.
        if (i < actions.length - 1) {
          await sleep(40);
        }
      }
    },
  );
}

/**
 * Apply a single validated action to the mutable flow.
 */
function applyOneAction(
  flow: MutableFlow<CanvasNode, CanvasEdge>,
  action: DesignAction,
): void {
  switch (action.type) {
    case "addNode": {
      const dims = DEFAULT_SIZE[action.shape];
      const node: CanvasNode = {
        id: action.id,
        type: "canvasNode",
        position: { x: action.x, y: action.y },
        width: action.width ?? dims.width,
        height: action.height ?? dims.height,
        data: {
          label: action.label,
          color: action.color,
          shape: action.shape,
        },
      };
      flow.addNode(node);
      return;
    }
    case "moveNode": {
      flow.updateNode(action.id, {
        position: { x: action.x, y: action.y },
      });
      return;
    }
    case "resizeNode": {
      flow.updateNode(action.id, {
        width: action.width,
        height: action.height,
      });
      return;
    }
    case "updateNodeData": {
      const partial: Partial<CanvasNode["data"]> = {};
      if (action.label !== undefined) partial.label = action.label;
      if (action.color !== undefined) partial.color = action.color;
      if (action.shape !== undefined) partial.shape = action.shape;
      if (Object.keys(partial).length > 0) {
        flow.updateNodeData(action.id, partial);
      }
      return;
    }
    case "deleteNode": {
      flow.removeNode(action.id);
      return;
    }
    case "addEdge": {
      const edge: CanvasEdge = {
        id: action.id,
        type: "canvasEdge",
        source: action.source,
        target: action.target,
        data: { label: action.label ?? "" },
      };
      flow.addEdge(edge);
      return;
    }
    case "deleteEdge": {
      flow.removeEdge(action.id);
      return;
    }
    default: {
      const _exhaustive: never = action;
      void _exhaustive;
    }
  }
}

/**
 * Pick a presence cursor near the node/edge involved in the action.
 */
function cursorForAction(
  flow: MutableFlow<CanvasNode, CanvasEdge>,
  action: DesignAction,
): { x: number; y: number } {
  if (action.type === "addNode") {
    return { x: action.x + 40, y: action.y + 20 };
  }
  if (action.type === "moveNode") {
    return { x: action.x + 40, y: action.y + 20 };
  }
  if (
    action.type === "resizeNode" ||
    action.type === "updateNodeData" ||
    action.type === "deleteNode"
  ) {
    const node = flow.getNode(action.id);
    if (node) {
      return {
        x: node.position.x + (node.width ?? 80) / 2,
        y: node.position.y + (node.height ?? 40) / 2,
      };
    }
  }
  if (action.type === "addEdge" || action.type === "deleteEdge") {
    const sourceId =
      action.type === "addEdge"
        ? action.source
        : flow.getEdge(action.id)?.source;
    if (sourceId) {
      const node = flow.getNode(sourceId);
      if (node) {
        return {
          x: node.position.x + (node.width ?? 80) / 2,
          y: node.position.y + (node.height ?? 40) / 2,
        };
      }
    }
  }
  return { x: LAYOUT.originX, y: LAYOUT.originY };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
