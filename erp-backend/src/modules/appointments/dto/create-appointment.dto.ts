import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({ example: 'b3f5f7a0-...' })
  @IsUUID()
  employeeId: string;

  @ApiPropertyOptional({ example: 'b3f5f7a0-...' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ example: 'b3f5f7a0-...' })
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiPropertyOptional({ example: 'b3f5f7a0-...', description: 'Related work order, if any.' })
  @IsOptional()
  @IsUUID()
  workOrderId?: string;

  @ApiProperty({ example: 'Troca de óleo' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: '2026-08-10T13:00:00' })
  @IsDateString()
  scheduledStart: string;

  @ApiProperty({ example: '2026-08-10T14:00:00' })
  @IsDateString()
  scheduledEnd: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
