import { CreateIncomeDto } from './create-income.dto';
declare const UpdateIncomeDto_base: import("@nestjs/common").Type<Partial<Omit<CreateIncomeDto, "recurrenceFrequency" | "recurrenceEndDate" | "installments">>>;
export declare class UpdateIncomeDto extends UpdateIncomeDto_base {
}
export {};
