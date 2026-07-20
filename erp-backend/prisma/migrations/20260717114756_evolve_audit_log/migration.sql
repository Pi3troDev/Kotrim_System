-- CreateEnum
CREATE TYPE "AuditResult" AS ENUM ('SUCCESS', 'FAILURE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'LOGIN_FAILED';
ALTER TYPE "AuditAction" ADD VALUE 'COMPANY_REGISTERED';
ALTER TYPE "AuditAction" ADD VALUE 'PASSWORD_RESET_REQUESTED';
ALTER TYPE "AuditAction" ADD VALUE 'PASSWORD_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE 'SUBSCRIPTION_CHECKOUT';
ALTER TYPE "AuditAction" ADD VALUE 'SUBSCRIPTION_ACTIVATED';
ALTER TYPE "AuditAction" ADD VALUE 'SUBSCRIPTION_RENEWED';
ALTER TYPE "AuditAction" ADD VALUE 'SUBSCRIPTION_UPGRADED';
ALTER TYPE "AuditAction" ADD VALUE 'SUBSCRIPTION_DOWNGRADED';
ALTER TYPE "AuditAction" ADD VALUE 'SUBSCRIPTION_CANCELLED';
ALTER TYPE "AuditAction" ADD VALUE 'SUBSCRIPTION_DATES_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE 'IMPERSONATION_STARTED';
ALTER TYPE "AuditAction" ADD VALUE 'IMPERSONATION_ENDED';

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "result" "AuditResult" NOT NULL DEFAULT 'SUCCESS',
ADD COLUMN     "superAdminId" UUID,
ALTER COLUMN "companyId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_superAdminId_idx" ON "AuditLog"("superAdminId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
