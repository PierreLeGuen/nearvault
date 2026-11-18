import nextEnv from "@next/env";
import { defineConfig } from "prisma/config";

// Prisma 7 no longer reads .env itself. Load env files the way Next.js does
// (including ${VAR} expansion), so the CLI sees the same DATABASE_URL as the
// app. Variables already set in the environment take precedence.
nextEnv.loadEnvConfig(process.cwd());

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
