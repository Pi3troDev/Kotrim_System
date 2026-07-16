import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateIncomeDto } from './create-income.dto';

/**
 * Installment plans are fixed at creation — each installment row is edited individually afterward.
 * Recurrence is only changed via PATCH /:id/stop-recurrence, never through a general update.
 */
export class UpdateIncomeDto extends PartialType(
  OmitType(CreateIncomeDto, ['installments', 'recurrenceFrequency', 'recurrenceEndDate'] as const),
) {}
