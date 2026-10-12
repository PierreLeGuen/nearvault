-- AlterTable
-- Idempotent: production already has these columns (added out-of-band via
-- `prisma db push`), and this is the first migration to record them. IF NOT
-- EXISTS lets `migrate deploy` run cleanly against both fresh databases (where
-- it creates the columns) and prod (where it is a no-op).
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "nearBlocksApiKey" TEXT,
ADD COLUMN IF NOT EXISTS "rpcUrl" TEXT;
