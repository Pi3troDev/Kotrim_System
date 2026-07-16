import { PartialType } from '@nestjs/swagger';
import { CreateWorkOrderItemDto } from './create-work-order-item.dto';

export class UpdateWorkOrderItemDto extends PartialType(CreateWorkOrderItemDto) {}
