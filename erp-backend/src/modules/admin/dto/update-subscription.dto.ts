import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

/** Lets a super-admin push a due date around without going through a payment. */
export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ description: 'New end of the paid period (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  currentPeriodEnd?: string;

  @ApiPropertyOptional({ description: 'New end of the free trial (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  trialEndsAt?: string;
}
