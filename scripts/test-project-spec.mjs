import { PrismaClient } from "../app/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { withAccelerate } from "@prisma/extension-accelerate";
import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
console.log("URL starts with:", url?.slice(0, 40));

let prisma;
if (url?.startsWith("prisma+postgres://")) {
  prisma = new PrismaClient({ accelerateUrl: url }).$extends(withAccelerate());
} else {
  const adapter = new PrismaPg({ connectionString: url });
  prisma = new PrismaClient({ adapter });
}

try {
  const rows = await prisma.projectSpec.findMany({
    where: { NOT: { filePath: "pending" } },
    select: { id: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  console.log("OK", rows);
} catch (e) {
  console.error("ERR message:", e?.message);
  console.error("ERR code:", e?.code);
  console.error(e);
}
