import { existsSync, readFileSync } from "node:fs";
import nextEnv from "@next/env";
import { defineConfig } from "prisma/config";

// Prisma 7 no longer reads .env itself. Read it as the Prisma 6 CLI did: .env
// and prisma/.env only, with ${VAR} expansion. Variables already set in the
// environment take precedence.
const envFiles = [".env", "prisma/.env"]
  .filter((path) => existsSync(path))
  .map((path) => ({ path, contents: readFileSync(path, "utf8"), env: {} }));
// Force a reload in case a parent Next.js process marked its env as loaded.
nextEnv.processEnv(envFiles, process.cwd(), console, true);

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
