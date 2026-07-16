import { RecurrenceFrequency } from '@prisma/client';
export declare class CreateExpenseDto {
    description: string;
    amount: number;
    dueDate: string;
    paymentMethod?: string;
    categoryId?: string;
    accountId?: string;
    installments?: number;
    recurrenceFrequency?: RecurrenceFrequency;
    recurrenceEndDate?: string;
}
