import { RecurrenceFrequency } from '@prisma/client';
export declare class CreateIncomeDto {
    description: string;
    amount: number;
    dueDate: string;
    paymentMethod?: string;
    categoryId?: string;
    clientId?: string;
    workOrderId?: string;
    accountId?: string;
    installments?: number;
    recurrenceFrequency?: RecurrenceFrequency;
    recurrenceEndDate?: string;
}
