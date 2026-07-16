import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StockMovementType } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateStockMovementDto {
  @ApiProperty({ enum: StockMovementType, example: StockMovementType.IN })
  @IsEnum(StockMovementType)
  type: StockMovementType;

  @ApiProperty({
    example: 10,
    description: 'For IN/OUT this is the delta moved; for ADJUSTMENT this is the new absolute quantity.',
  })
  @IsNumber()
  @Min(0)
  @Max(1000000)
  quantity: number;

  @ApiPropertyOptional({ example: 'Compra de reposição — NF 12345' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
