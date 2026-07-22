export type WorkOrderStatus =
  | 'OPEN'
  | 'IN_DIAGNOSIS'
  | 'WAITING_APPROVAL'
  | 'IN_PROGRESS'
  | 'WAITING_PARTS'
  | 'COMPLETED'
  | 'DELIVERED'
  | 'CANCELLED';

export type WorkOrderItemType = 'SERVICE' | 'PART';

export interface WorkOrderItem {
  id: string;
  workOrderId: string;
  type: WorkOrderItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  inventoryItemId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrderHistoryEntry {
  id: string;
  workOrderId: string;
  status: WorkOrderStatus;
  notes?: string | null;
  changedById?: string | null;
  changedAt: string;
}

export interface WorkOrderClientSummary {
  id: string;
  name: string;
}

export interface WorkOrderVehicleSummary {
  id: string;
  plate: string;
  brand: string;
  model: string;
}

export interface WorkOrderEmployeeSummary {
  id: string;
  name: string;
}

export interface WorkOrderListItem {
  id: string;
  number: number;
  clientId: string;
  vehicleId: string;
  employeeId?: string | null;
  status: WorkOrderStatus;
  reportedProblem: string;
  diagnosis?: string | null;
  observations?: string | null;
  laborAmount: number;
  partsAmount: number;
  discountAmount: number;
  totalAmount: number;
  warrantyDays: number;
  warrantyUntil?: string | null;
  openedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
  updatedAt: string;
  client: WorkOrderClientSummary;
  vehicle: WorkOrderVehicleSummary;
  employee?: WorkOrderEmployeeSummary | null;
}

export interface WorkOrder extends WorkOrderListItem {
  items: WorkOrderItem[];
  history: WorkOrderHistoryEntry[];
}

export interface CreateWorkOrderItemPayload {
  type: WorkOrderItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  inventoryItemId?: string;
}

export type UpdateWorkOrderItemPayload = Partial<CreateWorkOrderItemPayload>;

export type CreateWorkOrderPayload = Pick<WorkOrder, 'clientId' | 'vehicleId' | 'reportedProblem'> &
  Partial<Pick<WorkOrder, 'employeeId' | 'diagnosis' | 'observations' | 'discountAmount' | 'warrantyDays'>> & {
    items?: CreateWorkOrderItemPayload[];
  };

export type UpdateWorkOrderPayload = Partial<
  Pick<WorkOrder, 'employeeId' | 'reportedProblem' | 'diagnosis' | 'observations' | 'discountAmount' | 'warrantyDays'>
>;

export interface UpdateWorkOrderStatusPayload {
  status: WorkOrderStatus;
  notes?: string;
}
