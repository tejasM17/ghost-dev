import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { prisma } from "../lib/prisma";

async function main() {
  try {
    const rows = await prisma.projectSpec.findMany({
      where: { NOT: { filePath: "pending" } },
      select: { id: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    console.log("OK", rows);
  } catch (e: unknown) {
    const err = e as { message?: string; code?: string };
    console.error("ERR message:", err?.message);
    console.error("ERR code:", err?.code);
    console.error(e);
  }
}

void main();
