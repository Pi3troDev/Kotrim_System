import { WorkOrderStatus } from '@prisma/client';
export declare class UpdateWorkOrderStatusDto {
    status: WorkOrderStatus;
    notes?: string;
}
