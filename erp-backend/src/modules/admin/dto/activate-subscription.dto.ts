import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class ActivateSubscriptionDto {
  @ApiProperty({ description: 'Plan the company is being activated on' })
  @IsUUID()
  planId: string;

  @ApiProperty({ description: 'When the paid period ends (YYYY-MM-DD)' })
  @IsDateString()
  periodEnd: string;

  @ApiPropertyOptional({
    description: 'Amount actually received, in cents. Defaults to the plan price when omitted.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  amountCents?: number;

  @ApiPropertyOptional({ description: 'How the workshop paid, e.g. "PIX" or "MERCADO_PAGO"' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  method?: string;

  @ApiPropertyOptional({ description: 'Free-text note recorded on the payment' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
