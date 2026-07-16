import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateWorkOrderDto } from './create-work-order.dto';

/** Client, vehicle and status are immutable here — use dedicated flows to change them. */
export class UpdateWorkOrderDto extends PartialType(
  OmitType(CreateWorkOrderDto, ['clientId', 'vehicleId', 'items'] as const),
) {}
