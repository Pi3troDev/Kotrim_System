import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateExpenseDto } from './create-expense.dto';

/**
 * Installment plans are fixed at creation — each installment row is edited individually afterward.
 * Recurrence is only changed via PATCH /:id/stop-recurrence, never through a general update.
 */
export class UpdateExpenseDto extends PartialType(
  OmitType(CreateExpenseDto, ['installments', 'recurrenceFrequency', 'recurrenceEndDate'] as const),
) {}
