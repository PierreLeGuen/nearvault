import { defineConfig } from "prisma/config";

// Prisma 7 no longer reads .env itself; load it for local CLI use when present.
try {
  process.loadEnvFile();
} catch {
  // No .env file (e.g. CI or hosted builds, where variables come from the environment).
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
