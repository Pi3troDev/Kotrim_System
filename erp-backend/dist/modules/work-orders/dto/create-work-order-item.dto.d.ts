import { WorkOrderItemType } from '@prisma/client';
export declare class CreateWorkOrderItemDto {
    type: WorkOrderItemType;
    description: string;
    quantity: number;
    unitPrice: number;
}
