import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { env } from "~/env.mjs";
import { pgOptionsFromDatabaseUrl } from "~/server/db-url";

// A build with SKIP_ENV_VALIDATION=1 may have no DATABASE_URL. The pool only
// connects on the first query, so the build does not need one, as with Prisma 6.
const { poolConfig, schema } = env.DATABASE_URL
  ? pgOptionsFromDatabaseUrl(env.DATABASE_URL)
  : { poolConfig: {}, schema: undefined };

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(poolConfig, { schema }),
    log: ["warn"],
  });

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
