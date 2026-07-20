import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CreateWorkOrderItemDto } from './create-work-order-item.dto';

export class CreateWorkOrderDto {
  @ApiProperty({ example: 'b3f5f7a0-...' })
  @IsUUID()
  clientId: string;

  @ApiProperty({ example: 'b3f5f7a0-...' })
  @IsUUID()
  vehicleId: string;

  @ApiPropertyOptional({ example: 'b3f5f7a0-...', description: 'Mechanic/technician responsible for this work order.' })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiProperty({ example: 'Barulho estranho ao frear' })
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  reportedProblem: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  diagnosis?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observations?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({ example: 90 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3650)
  warrantyDays?: number;

  @ApiPropertyOptional({ type: [CreateWorkOrderItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkOrderItemDto)
  items?: CreateWorkOrderItemDto[];
}
