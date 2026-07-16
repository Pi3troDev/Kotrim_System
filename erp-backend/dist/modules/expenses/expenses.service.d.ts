import { FinancialStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { UpdateExpenseStatusDto } from './dto/update-expense-status.dto';
import { QueryExpensesDto } from './dto/query-expenses.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
export interface ExpensesSummary {
    pendingTotal: number;
    overdueTotal: number;
    overdueCount: number;
    paidThisMonthTotal: number;
}
export declare class ExpensesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(companyId: string, dto: CreateExpenseDto): Promise<(Omit<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string;
        status: import("@prisma/client").$Enums.FinancialStatus;
        amount: Prisma.Decimal;
        paidAmount: Prisma.Decimal;
        installmentNumber: number | null;
        installmentTotal: number | null;
        categoryId: string | null;
        accountId: string | null;
        paymentMethod: string | null;
        dueDate: Date;
        installmentGroupId: string | null;
        recurrenceFrequency: import("@prisma/client").$Enums.RecurrenceFrequency | null;
        recurringGroupId: string | null;
        recurrenceEndDate: Date | null;
        paidAt: Date | null;
    }, "status" | "amount" | "paidAmount"> & {
        amount: number;
        paidAmount: number;
        status: FinancialStatus;
        category: {
            id: string;
            name: string;
        } | null;
        account: {
            id: string;
            name: string;
            type: string;
        } | null;
    })[]>;
    stopRecurrence(companyId: string, id: string): Promise<void>;
    findAll(companyId: string, query: QueryExpensesDto): Promise<PaginatedResult<ReturnType<typeof this.serialize>>>;
    summary(companyId: string): Promise<ExpensesSummary>;
    findOne(companyId: string, id: string): Promise<Omit<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string;
        status: import("@prisma/client").$Enums.FinancialStatus;
        amount: Prisma.Decimal;
        paidAmount: Prisma.Decimal;
        installmentNumber: number | null;
        installmentTotal: number | null;
        categoryId: string | null;
        accountId: string | null;
        paymentMethod: string | null;
        dueDate: Date;
        installmentGroupId: string | null;
        recurrenceFrequency: import("@prisma/client").$Enums.RecurrenceFrequency | null;
        recurringGroupId: string | null;
        recurrenceEndDate: Date | null;
        paidAt: Date | null;
    }, "status" | "amount" | "paidAmount"> & {
        amount: number;
        paidAmount: number;
        status: FinancialStatus;
        category: {
            id: string;
            name: string;
        } | null;
        account: {
            id: string;
            name: string;
            type: string;
        } | null;
    }>;
    update(companyId: string, id: string, dto: UpdateExpenseDto): Promise<Omit<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string;
        status: import("@prisma/client").$Enums.FinancialStatus;
        amount: Prisma.Decimal;
        paidAmount: Prisma.Decimal;
        installmentNumber: number | null;
        installmentTotal: number | null;
        categoryId: string | null;
        accountId: string | null;
        paymentMethod: string | null;
        dueDate: Date;
        installmentGroupId: string | null;
        recurrenceFrequency: import("@prisma/client").$Enums.RecurrenceFrequency | null;
        recurringGroupId: string | null;
        recurrenceEndDate: Date | null;
        paidAt: Date | null;
    }, "status" | "amount" | "paidAmount"> & {
        amount: number;
        paidAmount: number;
        status: FinancialStatus;
        category: {
            id: string;
            name: string;
        } | null;
        account: {
            id: string;
            name: string;
            type: string;
        } | null;
    }>;
    updateStatus(companyId: string, id: string, dto: UpdateExpenseStatusDto): Promise<Omit<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string;
        status: import("@prisma/client").$Enums.FinancialStatus;
        amount: Prisma.Decimal;
        paidAmount: Prisma.Decimal;
        installmentNumber: number | null;
        installmentTotal: number | null;
        categoryId: string | null;
        accountId: string | null;
        paymentMethod: string | null;
        dueDate: Date;
        installmentGroupId: string | null;
        recurrenceFrequency: import("@prisma/client").$Enums.RecurrenceFrequency | null;
        recurringGroupId: string | null;
        recurrenceEndDate: Date | null;
        paidAt: Date | null;
    }, "status" | "amount" | "paidAmount"> & {
        amount: number;
        paidAmount: number;
        status: FinancialStatus;
        category: {
            id: string;
            name: string;
        } | null;
        account: {
            id: string;
            name: string;
            type: string;
        } | null;
    }>;
    remove(companyId: string, id: string): Promise<void>;
    addPayment(companyId: string, expenseId: string, dto: CreatePaymentDto): Promise<Omit<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string;
        status: import("@prisma/client").$Enums.FinancialStatus;
        amount: Prisma.Decimal;
        paidAmount: Prisma.Decimal;
        installmentNumber: number | null;
        installmentTotal: number | null;
        categoryId: string | null;
        accountId: string | null;
        paymentMethod: string | null;
        dueDate: Date;
        installmentGroupId: string | null;
        recurrenceFrequency: import("@prisma/client").$Enums.RecurrenceFrequency | null;
        recurringGroupId: string | null;
        recurrenceEndDate: Date | null;
        paidAt: Date | null;
    }, "status" | "amount" | "paidAmount"> & {
        amount: number;
        paidAmount: number;
        status: FinancialStatus;
        category: {
            id: string;
            name: string;
        } | null;
        account: {
            id: string;
            name: string;
            type: string;
        } | null;
    }>;
    listPayments(companyId: string, expenseId: string): Promise<{
        amount: number;
        account: {
            name: string;
            id: string;
        } | null;
        id: string;
        companyId: string;
        createdAt: Date;
        notes: string | null;
        accountId: string | null;
        paymentMethod: string | null;
        paidAt: Date;
        expenseId: string | null;
        incomeId: string | null;
    }[]>;
    removePayment(companyId: string, expenseId: string, paymentId: string): Promise<void>;
    private createInstallments;
    private buildStatusWhere;
    private resolveStatus;
    private assertExpenseExists;
    private assertCategoryBelongsToCompany;
    private assertAccountBelongsToCompany;
    private serialize;
}
