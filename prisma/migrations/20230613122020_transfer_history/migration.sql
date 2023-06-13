-- CreateTable
CREATE TABLE "TransferHistory" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "creationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedDate" TIMESTAMP(3),
    "rejectedDate" TIMESTAMP(3),
    "memo" TEXT,
    "createRequestTxnId" TEXT NOT NULL,
    "confirmExecuteTxnId" TEXT,
    "creatorMail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransferHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tokenIndex" ON "TransferHistory"("token");

-- AddForeignKey
ALTER TABLE "TransferHistory" ADD CONSTRAINT "TransferHistory_creatorMail_fkey" FOREIGN KEY ("creatorMail") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;
