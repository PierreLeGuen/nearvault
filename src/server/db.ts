import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { env } from "~/env.mjs";
import { pgOptionsFromDatabaseUrl } from "~/server/db-url";

const { poolConfig, schema } = pgOptionsFromDatabaseUrl(env.DATABASE_URL);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(poolConfig, { schema }),
    log: env.NODE_ENV === "development" ? ["query", "warn"] : ["warn"],
  });

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
