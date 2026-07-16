import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateInventoryItemDto } from './create-inventory-item.dto';

/** quantityInStock is never set directly here — use POST /inventory/:id/movements instead. */
export class UpdateInventoryItemDto extends PartialType(OmitType(CreateInventoryItemDto, ['initialQuantity'] as const)) {}
