import { AccountType } from '../../../shared/constants/account-types';

export type FinancialStatus = 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED';
export type SettableFinancialStatus = 'PENDING' | 'CANCELLED';
export type RecurrenceFrequency = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface CategorySummary {
  id: string;
  name: string;
}

export interface ClientSummary {
  id: string;
  name: string;
}

export interface WorkOrderSummary {
  id: string;
  number: number;
}

export interface AccountSummary {
  id: string;
  name: string;
  type: AccountType;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  currentBalance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateAccountPayload = Pick<Account, 'name' | 'type'> & Partial<Pick<Account, 'initialBalance'>>;
export type UpdateAccountPayload = Partial<CreateAccountPayload>;

export interface Payment {
  id: string;
  expenseId?: string | null;
  incomeId?: string | null;
  accountId?: string | null;
  account?: AccountSummary | null;
  amount: number;
  paymentMethod?: string | null;
  paidAt: string;
  notes?: string | null;
  createdAt: string;
}

export interface CreatePaymentPayload {
  amount: number;
  accountId?: string;
  paymentMethod?: string;
  paidAt?: string;
  notes?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidAmount: number;
  status: FinancialStatus;
  paymentMethod?: string | null;
  dueDate: string;
  paidAt?: string | null;
  categoryId?: string | null;
  category?: CategorySummary | null;
  accountId?: string | null;
  account?: AccountSummary | null;
  installmentGroupId?: string | null;
  installmentNumber?: number | null;
  installmentTotal?: number | null;
  recurrenceFrequency?: RecurrenceFrequency | null;
  recurringGroupId?: string | null;
  recurrenceEndDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Income {
  id: string;
  description: string;
  amount: number;
  paidAmount: number;
  status: FinancialStatus;
  paymentMethod?: string | null;
  dueDate: string;
  receivedAt?: string | null;
  categoryId?: string | null;
  category?: CategorySummary | null;
  clientId?: string | null;
  client?: ClientSummary | null;
  workOrderId?: string | null;
  workOrder?: WorkOrderSummary | null;
  accountId?: string | null;
  account?: AccountSummary | null;
  installmentGroupId?: string | null;
  installmentNumber?: number | null;
  installmentTotal?: number | null;
  recurrenceFrequency?: RecurrenceFrequency | null;
  recurringGroupId?: string | null;
  recurrenceEndDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateExpensePayload = Pick<Expense, 'description' | 'amount' | 'dueDate'> &
  Partial<Pick<Expense, 'paymentMethod' | 'categoryId' | 'accountId'>> & {
    installments?: number;
    recurrenceFrequency?: RecurrenceFrequency;
    recurrenceEndDate?: string;
  };
export type UpdateExpensePayload = Partial<Omit<CreateExpensePayload, 'installments' | 'recurrenceFrequency' | 'recurrenceEndDate'>>;

export interface UpdateExpenseStatusPayload {
  status: SettableFinancialStatus;
}

export interface ExpensesSummary {
  pendingTotal: number;
  overdueTotal: number;
  overdueCount: number;
  paidThisMonthTotal: number;
}

export type CreateIncomePayload = Pick<Income, 'description' | 'amount' | 'dueDate'> &
  Partial<Pick<Income, 'paymentMethod' | 'categoryId' | 'clientId' | 'accountId'>> & {
    installments?: number;
    recurrenceFrequency?: RecurrenceFrequency;
    recurrenceEndDate?: string;
  };
export type UpdateIncomePayload = Partial<Omit<CreateIncomePayload, 'installments' | 'recurrenceFrequency' | 'recurrenceEndDate'>>;

export interface UpdateIncomeStatusPayload {
  status: SettableFinancialStatus;
}

export interface IncomesSummary {
  pendingTotal: number;
  overdueTotal: number;
  overdueCount: number;
  receivedThisMonthTotal: number;
}
