import { StockMovementType } from '@prisma/client';
export declare class CreateStockMovementDto {
    type: StockMovementType;
    quantity: number;
    reason?: string;
}
