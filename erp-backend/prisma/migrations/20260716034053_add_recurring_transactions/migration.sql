-- CreateEnum
CREATE TYPE "RecurrenceFrequency" AS ENUM ('WEEKLY', 'MONTHLY', 'YEARLY');

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "recurrenceEndDate" TIMESTAMP(3),
ADD COLUMN     "recurrenceFrequency" "RecurrenceFrequency",
ADD COLUMN     "recurringGroupId" UUID;

-- AlterTable
ALTER TABLE "Income" ADD COLUMN     "recurrenceEndDate" TIMESTAMP(3),
ADD COLUMN     "recurrenceFrequency" "RecurrenceFrequency",
ADD COLUMN     "recurringGroupId" UUID;

-- CreateIndex
CREATE INDEX "Expense_recurringGroupId_idx" ON "Expense"("recurringGroupId");

-- CreateIndex
CREATE INDEX "Income_recurringGroupId_idx" ON "Income"("recurringGroupId");
