-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_employeeId_fkey";

-- DropIndex
DROP INDEX "Appointment_employeeId_idx";

-- AlterTable
ALTER TABLE "Appointment" DROP COLUMN "employeeId";
