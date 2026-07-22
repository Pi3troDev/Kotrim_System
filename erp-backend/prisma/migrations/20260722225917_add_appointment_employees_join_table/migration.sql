-- CreateTable
CREATE TABLE "AppointmentEmployee" (
    "id" UUID NOT NULL,
    "appointmentId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentEmployee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppointmentEmployee_appointmentId_idx" ON "AppointmentEmployee"("appointmentId");

-- CreateIndex
CREATE INDEX "AppointmentEmployee_employeeId_idx" ON "AppointmentEmployee"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentEmployee_appointmentId_employeeId_key" ON "AppointmentEmployee"("appointmentId", "employeeId");

-- AddForeignKey
ALTER TABLE "AppointmentEmployee" ADD CONSTRAINT "AppointmentEmployee_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentEmployee" ADD CONSTRAINT "AppointmentEmployee_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: carry every existing appointment's single employeeId forward as
-- its first (and, for now, only) assignee, so nothing already scheduled loses
-- its assignment once the old column is dropped in the next migration.
INSERT INTO "AppointmentEmployee" ("id", "appointmentId", "employeeId", "createdAt")
SELECT gen_random_uuid(), "id", "employeeId", "createdAt" FROM "Appointment";
