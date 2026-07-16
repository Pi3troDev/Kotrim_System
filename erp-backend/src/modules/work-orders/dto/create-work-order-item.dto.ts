import { ApiProperty } from '@nestjs/swagger';
import { WorkOrderItemType } from '@prisma/client';
import { IsEnum, IsNumber, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateWorkOrderItemDto {
  @ApiProperty({ enum: WorkOrderItemType, example: WorkOrderItemType.SERVICE })
  @IsEnum(WorkOrderItemType)
  type: WorkOrderItemType;

  @ApiProperty({ example: 'Troca de óleo e filtro' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  description: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(0.01)
  @Max(100000)
  quantity: number;

  @ApiProperty({ example: 150 })
  @IsNumber()
  @Min(0)
  unitPrice: number;
}
