import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { withAccelerate } from "@prisma/extension-accelerate";

/**
 * Cached Prisma client. In development, the instance is stashed on `global`
 * to survive hot reloads — otherwise each HMR pass would open a fresh pool
 * and exhaust connections.
 *
 * Branches on the `DATABASE_URL` scheme:
 * - `prisma+postgres://` → Prisma Accelerate (managed connection pool + cache).
 * - anything else        → direct PostgreSQL via `@prisma/adapter-pg`.
 *
 * Dev cache is keyed by a lightweight model fingerprint so adding a model
 * (e.g. ProjectSpec) after `prisma generate` does not leave a stale client
 * missing delegates — which would 500 routes like GET /specs.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaClientKey: string | undefined;
};

/** Bump when generated models change so HMR recreates the client. */
const PRISMA_CLIENT_KEY = "projectSpec:v1";

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  if (url.startsWith("prisma+postgres://")) {
    const base = new PrismaClient({ accelerateUrl: url });
    return base.$extends(withAccelerate()) as unknown as PrismaClient;
  }

  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

function hasProjectSpecDelegate(client: PrismaClient): boolean {
  const delegate = (client as unknown as { projectSpec?: { findMany?: unknown } })
    .projectSpec;
  return typeof delegate?.findMany === "function";
}

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  const staleKey =
    process.env.NODE_ENV !== "production" &&
    cached &&
    globalForPrisma.prismaClientKey !== PRISMA_CLIENT_KEY;
  const missingDelegate = cached && !hasProjectSpecDelegate(cached);

  if (cached && (staleKey || missingDelegate)) {
    // Schema/client advanced under HMR — drop the stale singleton.
    void cached.$disconnect().catch(() => {
      // Best-effort; process continues with a fresh client.
    });
    globalForPrisma.prisma = undefined;
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
    globalForPrisma.prismaClientKey = PRISMA_CLIENT_KEY;
  }

  return globalForPrisma.prisma;
}

/**
 * Lazy proxy so each access resolves the current client. Avoids exporting a
 * one-shot singleton that can miss new model delegates after `prisma generate`
 * without a full process restart.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
