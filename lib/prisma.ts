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
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

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

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
