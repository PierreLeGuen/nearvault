-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
