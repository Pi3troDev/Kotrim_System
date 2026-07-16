import { CreateWorkOrderItemDto } from './create-work-order-item.dto';
export declare class CreateWorkOrderDto {
    clientId: string;
    vehicleId: string;
    reportedProblem: string;
    diagnosis?: string;
    observations?: string;
    discountAmount?: number;
    warrantyDays?: number;
    items?: CreateWorkOrderItemDto[];
}
