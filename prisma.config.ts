import { existsSync, readFileSync } from "node:fs";
import nextEnv from "@next/env";
import { defineConfig } from "prisma/config";

// Prisma 7 no longer reads .env itself. Read it as the Prisma 6 CLI did: only
// .env, with ${VAR} expansion. Variables already set in the environment take
// precedence.
if (existsSync(".env")) {
  nextEnv.processEnv(
    [{ path: ".env", contents: readFileSync(".env", "utf8"), env: {} }],
    process.cwd(),
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // `prisma generate` runs on install, where DATABASE_URL may be unset.
    url: process.env.DATABASE_URL ?? "",
  },
});
