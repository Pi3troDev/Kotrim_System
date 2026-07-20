-- CreateEnum
CREATE TYPE "MailStatus" AS ENUM ('SENT', 'FAILED', 'RESENT');

-- CreateTable
CREATE TABLE "MailLog" (
    "id" UUID NOT NULL,
    "companyId" UUID,
    "userId" UUID,
    "template" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "MailStatus" NOT NULL,
    "provider" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MailLog_companyId_idx" ON "MailLog"("companyId");

-- CreateIndex
CREATE INDEX "MailLog_userId_idx" ON "MailLog"("userId");

-- CreateIndex
CREATE INDEX "MailLog_status_idx" ON "MailLog"("status");

-- CreateIndex
CREATE INDEX "MailLog_template_idx" ON "MailLog"("template");

-- CreateIndex
CREATE INDEX "MailLog_createdAt_idx" ON "MailLog"("createdAt");

-- AddForeignKey
ALTER TABLE "MailLog" ADD CONSTRAINT "MailLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailLog" ADD CONSTRAINT "MailLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
