import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

/** PAID is no longer settable directly here — register a payment for the remaining balance instead. */
const SETTABLE_STATUSES = ['PENDING', 'CANCELLED'] as const;
export type SettableExpenseStatus = (typeof SETTABLE_STATUSES)[number];

export class UpdateExpenseStatusDto {
  @ApiProperty({ enum: SETTABLE_STATUSES, example: 'CANCELLED' })
  @IsIn(SETTABLE_STATUSES)
  status: SettableExpenseStatus;
}
