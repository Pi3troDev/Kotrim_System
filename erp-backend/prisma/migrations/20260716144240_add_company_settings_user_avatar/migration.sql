-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "businessHoursEnd" TEXT,
ADD COLUMN     "businessHoursStart" TEXT,
ADD COLUMN     "workDays" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5]::INTEGER[];

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT;
