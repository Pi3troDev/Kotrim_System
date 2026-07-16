import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

const CURRENT_YEAR = new Date().getFullYear();

export class CreateVehicleDto {
  @ApiProperty({ example: 'b3f5f7a0-...' })
  @IsUUID()
  clientId: string;

  @ApiProperty({ example: 'ABC1D23' })
  @IsString()
  @MinLength(7)
  @MaxLength(8)
  plate: string;

  @ApiProperty({ example: 'Volkswagen' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  brand: string;

  @ApiProperty({ example: 'Gol' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  model: string;

  @ApiPropertyOptional({ example: 2022 })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(CURRENT_YEAR + 1)
  year?: number;

  @ApiPropertyOptional({ example: 'Prata' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  color?: string;

  @ApiPropertyOptional({ example: '9BWZZZ377VT004251' })
  @IsOptional()
  @IsString()
  @MaxLength(17)
  chassisNumber?: string;

  @ApiPropertyOptional({ example: 45000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  mileage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
