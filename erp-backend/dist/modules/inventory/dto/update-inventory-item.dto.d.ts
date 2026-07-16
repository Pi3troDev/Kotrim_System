import { CreateInventoryItemDto } from './create-inventory-item.dto';
declare const UpdateInventoryItemDto_base: import("@nestjs/common").Type<Partial<Omit<CreateInventoryItemDto, "initialQuantity">>>;
export declare class UpdateInventoryItemDto extends UpdateInventoryItemDto_base {
}
export {};
