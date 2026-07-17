import type {
  CanvasEdge,
  CanvasNode,
  NodeColorName,
  NodeShape,
} from "@/types/canvas";

/**
 * A predefined canvas diagram users can import to replace the current
 * collaborative graph.
 */
export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

/** Default dimensions aligned with the shape panel. */
const SIZE: Record<NodeShape, { width: number; height: number }> = {
  rectangle: { width: 180, height: 72 },
  diamond: { width: 110, height: 110 },
  circle: { width: 96, height: 96 },
  pill: { width: 150, height: 56 },
  cylinder: { width: 100, height: 110 },
  hexagon: { width: 130, height: 100 },
};

/**
 * Build a single canvas node with sensible defaults for template data.
 */
function n(
  id: string,
  label: string,
  x: number,
  y: number,
  shape: NodeShape,
  color: NodeColorName,
  size?: { width: number; height: number },
): CanvasNode {
  const dims = size ?? SIZE[shape];
  return {
    id,
    type: "canvasNode",
    position: { x, y },
    width: dims.width,
    height: dims.height,
    data: { label, color, shape },
  };
}

/**
 * Build a canvas edge between two template nodes.
 */
function e(
  id: string,
  source: string,
  target: string,
  label?: string,
): CanvasEdge {
  return {
    id,
    type: "canvasEdge",
    source,
    target,
    data: { label: label ?? "" },
  };
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

const microservices: CanvasTemplate = {
  id: "microservices",
  name: "Microservices",
  description:
    "API Gateway routes traffic to isolated services, each backed by a dedicated database and connected via a shared message bus.",
  nodes: [
    n("ms-client", "Client", 0, 140, "pill", "blue"),
    n("ms-gateway", "API Gateway", 220, 130, "rectangle", "green", {
      width: 170,
      height: 72,
    }),
    n("ms-auth", "Auth Service", 480, 0, "rectangle", "purple", {
      width: 160,
      height: 64,
    }),
    n("ms-user", "User Service", 480, 100, "rectangle", "purple", {
      width: 160,
      height: 64,
    }),
    n("ms-order", "Order Service", 480, 200, "rectangle", "purple", {
      width: 160,
      height: 64,
    }),
    n("ms-payment", "Payment Service", 480, 300, "rectangle", "purple", {
      width: 160,
      height: 64,
    }),
    n("ms-auth-db", "Auth DB", 720, 0, "cylinder", "neutral"),
    n("ms-user-db", "User DB", 720, 100, "cylinder", "neutral"),
    n("ms-order-db", "Order DB", 720, 200, "cylinder", "neutral"),
    n("ms-payment-db", "Payment DB", 720, 300, "cylinder", "neutral"),
    n("ms-bus", "Message Bus", 480, 420, "hexagon", "purple", {
      width: 150,
      height: 110,
    }),
  ],
  edges: [
    e("ms-e1", "ms-client", "ms-gateway"),
    e("ms-e2", "ms-gateway", "ms-auth"),
    e("ms-e3", "ms-gateway", "ms-user"),
    e("ms-e4", "ms-gateway", "ms-order"),
    e("ms-e5", "ms-gateway", "ms-payment"),
    e("ms-e6", "ms-auth", "ms-auth-db"),
    e("ms-e7", "ms-user", "ms-user-db"),
    e("ms-e8", "ms-order", "ms-order-db"),
    e("ms-e9", "ms-payment", "ms-payment-db"),
    e("ms-e10", "ms-auth", "ms-bus"),
    e("ms-e11", "ms-user", "ms-bus"),
    e("ms-e12", "ms-order", "ms-bus"),
    e("ms-e13", "ms-payment", "ms-bus"),
  ],
};

const cicdPipeline: CanvasTemplate = {
  id: "cicd-pipeline",
  name: "CI/CD Pipeline",
  description:
    "End-to-end delivery from source commit through build, test, containerisation, and staged deployment to production.",
  nodes: [
    n("ci-source", "Source", 0, 40, "pill", "blue", {
      width: 120,
      height: 52,
    }),
    n("ci-build", "Build", 180, 40, "rectangle", "green", {
      width: 110,
      height: 56,
    }),
    n("ci-test", "Test", 350, 40, "rectangle", "green", {
      width: 110,
      height: 56,
    }),
    n("ci-container", "Containerise", 520, 40, "rectangle", "purple", {
      width: 140,
      height: 56,
    }),
    n("ci-staging", "Staging", 720, 40, "rectangle", "orange", {
      width: 120,
      height: 56,
    }),
    n("ci-deploy", "Deploy", 900, 20, "diamond", "red", {
      width: 100,
      height: 100,
    }),
    n("ci-prod", "Production", 1060, 40, "pill", "green", {
      width: 140,
      height: 52,
    }),
  ],
  edges: [
    e("ci-e1", "ci-source", "ci-build"),
    e("ci-e2", "ci-build", "ci-test"),
    e("ci-e3", "ci-test", "ci-container"),
    e("ci-e4", "ci-container", "ci-staging"),
    e("ci-e5", "ci-staging", "ci-deploy"),
    e("ci-e6", "ci-deploy", "ci-prod"),
  ],
};

const eventDriven: CanvasTemplate = {
  id: "event-driven",
  name: "Event-Driven System",
  description:
    "Producers publish events to a central bus. Independent consumers handle emails, push notifications, analytics, and error queues.",
  nodes: [
    n("ed-api", "API Service", 0, 0, "pill", "blue"),
    n("ed-worker", "Background Worker", 0, 120, "pill", "blue"),
    n("ed-webhook", "Webhook Ingest", 0, 240, "pill", "blue"),
    n("ed-bus", "Event Bus", 280, 100, "hexagon", "purple", {
      width: 160,
      height: 130,
    }),
    n("ed-email", "Email Consumer", 560, 0, "rectangle", "green", {
      width: 160,
      height: 60,
    }),
    n("ed-push", "Push Notifications", 560, 90, "rectangle", "teal", {
      width: 160,
      height: 60,
    }),
    n("ed-analytics", "Analytics", 560, 180, "rectangle", "green", {
      width: 160,
      height: 60,
    }),
    n("ed-dlq", "Dead Letter Queue", 560, 280, "rectangle", "red", {
      width: 160,
      height: 60,
    }),
  ],
  edges: [
    e("ed-e1", "ed-api", "ed-bus"),
    e("ed-e2", "ed-worker", "ed-bus"),
    e("ed-e3", "ed-webhook", "ed-bus"),
    e("ed-e4", "ed-bus", "ed-email"),
    e("ed-e5", "ed-bus", "ed-push"),
    e("ed-e6", "ed-bus", "ed-analytics"),
    e("ed-e7", "ed-bus", "ed-dlq"),
  ],
};

/** All built-in starter templates available in the import modal. */
export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  microservices,
  cicdPipeline,
  eventDriven,
];

/**
 * Clone a template with fresh node/edge IDs so re-imports never collide
 * with residual graph state. Edge source/target are remapped accordingly.
 */
export function cloneTemplateWithFreshIds(template: CanvasTemplate): {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
} {
  const stamp = Date.now();
  const idMap = new Map<string, string>();

  const nodes: CanvasNode[] = template.nodes.map((node, index) => {
    const newId = `${template.id}-${stamp}-${index}`;
    idMap.set(node.id, newId);
    return {
      ...node,
      id: newId,
      position: { ...node.position },
      data: { ...node.data },
    };
  });

  const edges: CanvasEdge[] = template.edges.map((edge, index) => ({
    ...edge,
    id: `${template.id}-edge-${stamp}-${index}`,
    source: idMap.get(edge.source) ?? edge.source,
    target: idMap.get(edge.target) ?? edge.target,
    data: edge.data ? { ...edge.data } : { label: "" },
  }));

  return { nodes, edges };
}
