import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

/** PAID/received is no longer settable directly here — register a payment for the remaining balance instead. */
const SETTABLE_STATUSES = ['PENDING', 'CANCELLED'] as const;
export type SettableIncomeStatus = (typeof SETTABLE_STATUSES)[number];

export class UpdateIncomeStatusDto {
  @ApiProperty({ enum: SETTABLE_STATUSES, example: 'CANCELLED' })
  @IsIn(SETTABLE_STATUSES)
  status: SettableIncomeStatus;
}
