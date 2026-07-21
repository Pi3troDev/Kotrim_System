-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "allowedFeatures" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Backfill: the system Admin role created at registration must keep full
-- access — it predates this column, so its default of '{}' would otherwise
-- lock every existing workshop admin out of their own company.
UPDATE "Role"
SET "allowedFeatures" = ARRAY[
  'DASHBOARD', 'CLIENTS', 'VEHICLES', 'WORK_ORDERS', 'AGENDA',
  'SETTINGS', 'INVENTORY', 'FINANCE', 'REPORTS', 'EMPLOYEES'
]
WHERE "isSystem" = true;
