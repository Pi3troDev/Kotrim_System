export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface AppointmentEmployeeSummary {
  id: string;
  name: string;
}

export interface AppointmentClientSummary {
  id: string;
  name: string;
}

export interface AppointmentVehicleSummary {
  id: string;
  plate: string;
  brand: string;
  model: string;
}

export interface AppointmentWorkOrderSummary {
  id: string;
  number: number;
}

export interface Appointment {
  id: string;
  employeeId: string;
  employee: AppointmentEmployeeSummary;
  clientId?: string | null;
  client?: AppointmentClientSummary | null;
  vehicleId?: string | null;
  vehicle?: AppointmentVehicleSummary | null;
  workOrderId?: string | null;
  workOrder?: AppointmentWorkOrderSummary | null;
  title: string;
  description?: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  status: AppointmentStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateAppointmentPayload = Pick<Appointment, 'employeeId' | 'title' | 'scheduledStart' | 'scheduledEnd'> &
  Partial<Pick<Appointment, 'clientId' | 'vehicleId' | 'workOrderId' | 'description' | 'notes'>>;

export type UpdateAppointmentPayload = Partial<CreateAppointmentPayload> & Partial<Pick<Appointment, 'status'>>;
