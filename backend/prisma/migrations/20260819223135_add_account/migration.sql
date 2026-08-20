-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "consumerName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "cardLastFour" TEXT NOT NULL,
    "creditor" TEXT NOT NULL,
    "balanceOwedCents" INTEGER NOT NULL,
    "daysPastDue" INTEGER NOT NULL,
    "minimumPaymentCents" INTEGER NOT NULL,
    "pastDueAmountCents" INTEGER NOT NULL,
    "monthlyPaymentCents" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_accountNumber_key" ON "accounts"("accountNumber");
