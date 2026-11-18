-- AlterTable
-- IF NOT EXISTS leaves a database that already has these columns unchanged.
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "nearBlocksApiKey" TEXT,
ADD COLUMN IF NOT EXISTS "rpcUrl" TEXT;
