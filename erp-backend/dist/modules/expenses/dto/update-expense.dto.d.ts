import { CreateExpenseDto } from './create-expense.dto';
declare const UpdateExpenseDto_base: import("@nestjs/common").Type<Partial<Omit<CreateExpenseDto, "recurrenceFrequency" | "recurrenceEndDate" | "installments">>>;
export declare class UpdateExpenseDto extends UpdateExpenseDto_base {
}
export {};
