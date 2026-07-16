import { FinancialStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { UpdateIncomeStatusDto } from './dto/update-income-status.dto';
import { QueryIncomesDto } from './dto/query-incomes.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
export interface IncomesSummary {
    pendingTotal: number;
    overdueTotal: number;
    overdueCount: number;
    receivedThisMonthTotal: number;
}
export declare class IncomesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(companyId: string, dto: CreateIncomeDto): Promise<(Omit<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string;
        clientId: string | null;
        status: import("@prisma/client").$Enums.FinancialStatus;
        amount: Prisma.Decimal;
        paidAmount: Prisma.Decimal;
        installmentNumber: number | null;
        installmentTotal: number | null;
        workOrderId: string | null;
        categoryId: string | null;
        accountId: string | null;
        paymentMethod: string | null;
        dueDate: Date;
        receivedAt: Date | null;
        installmentGroupId: string | null;
        recurrenceFrequency: import("@prisma/client").$Enums.RecurrenceFrequency | null;
        recurringGroupId: string | null;
        recurrenceEndDate: Date | null;
    }, "status" | "amount" | "paidAmount"> & {
        amount: number;
        paidAmount: number;
        status: FinancialStatus;
        category: {
            id: string;
            name: string;
        } | null;
        client: {
            id: string;
            name: string;
        } | null;
        workOrder: {
            id: string;
            number: number;
        } | null;
        account: {
            id: string;
            name: string;
            type: string;
        } | null;
    })[]>;
    stopRecurrence(companyId: string, id: string): Promise<void>;
    findAll(companyId: string, query: QueryIncomesDto): Promise<PaginatedResult<ReturnType<typeof this.serialize>>>;
    summary(companyId: string): Promise<IncomesSummary>;
    findOne(companyId: string, id: string): Promise<Omit<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string;
        clientId: string | null;
        status: import("@prisma/client").$Enums.FinancialStatus;
        amount: Prisma.Decimal;
        paidAmount: Prisma.Decimal;
        installmentNumber: number | null;
        installmentTotal: number | null;
        workOrderId: string | null;
        categoryId: string | null;
        accountId: string | null;
        paymentMethod: string | null;
        dueDate: Date;
        receivedAt: Date | null;
        installmentGroupId: string | null;
        recurrenceFrequency: import("@prisma/client").$Enums.RecurrenceFrequency | null;
        recurringGroupId: string | null;
        recurrenceEndDate: Date | null;
    }, "status" | "amount" | "paidAmount"> & {
        amount: number;
        paidAmount: number;
        status: FinancialStatus;
        category: {
            id: string;
            name: string;
        } | null;
        client: {
            id: string;
            name: string;
        } | null;
        workOrder: {
            id: string;
            number: number;
        } | null;
        account: {
            id: string;
            name: string;
            type: string;
        } | null;
    }>;
    update(companyId: string, id: string, dto: UpdateIncomeDto): Promise<Omit<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string;
        clientId: string | null;
        status: import("@prisma/client").$Enums.FinancialStatus;
        amount: Prisma.Decimal;
        paidAmount: Prisma.Decimal;
        installmentNumber: number | null;
        installmentTotal: number | null;
        workOrderId: string | null;
        categoryId: string | null;
        accountId: string | null;
        paymentMethod: string | null;
        dueDate: Date;
        receivedAt: Date | null;
        installmentGroupId: string | null;
        recurrenceFrequency: import("@prisma/client").$Enums.RecurrenceFrequency | null;
        recurringGroupId: string | null;
        recurrenceEndDate: Date | null;
    }, "status" | "amount" | "paidAmount"> & {
        amount: number;
        paidAmount: number;
        status: FinancialStatus;
        category: {
            id: string;
            name: string;
        } | null;
        client: {
            id: string;
            name: string;
        } | null;
        workOrder: {
            id: string;
            number: number;
        } | null;
        account: {
            id: string;
            name: string;
            type: string;
        } | null;
    }>;
    updateStatus(companyId: string, id: string, dto: UpdateIncomeStatusDto): Promise<Omit<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string;
        clientId: string | null;
        status: import("@prisma/client").$Enums.FinancialStatus;
        amount: Prisma.Decimal;
        paidAmount: Prisma.Decimal;
        installmentNumber: number | null;
        installmentTotal: number | null;
        workOrderId: string | null;
        categoryId: string | null;
        accountId: string | null;
        paymentMethod: string | null;
        dueDate: Date;
        receivedAt: Date | null;
        installmentGroupId: string | null;
        recurrenceFrequency: import("@prisma/client").$Enums.RecurrenceFrequency | null;
        recurringGroupId: string | null;
        recurrenceEndDate: Date | null;
    }, "status" | "amount" | "paidAmount"> & {
        amount: number;
        paidAmount: number;
        status: FinancialStatus;
        category: {
            id: string;
            name: string;
        } | null;
        client: {
            id: string;
            name: string;
        } | null;
        workOrder: {
            id: string;
            number: number;
        } | null;
        account: {
            id: string;
            name: string;
            type: string;
        } | null;
    }>;
    remove(companyId: string, id: string): Promise<void>;
    addPayment(companyId: string, incomeId: string, dto: CreatePaymentDto): Promise<Omit<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string;
        clientId: string | null;
        status: import("@prisma/client").$Enums.FinancialStatus;
        amount: Prisma.Decimal;
        paidAmount: Prisma.Decimal;
        installmentNumber: number | null;
        installmentTotal: number | null;
        workOrderId: string | null;
        categoryId: string | null;
        accountId: string | null;
        paymentMethod: string | null;
        dueDate: Date;
        receivedAt: Date | null;
        installmentGroupId: string | null;
        recurrenceFrequency: import("@prisma/client").$Enums.RecurrenceFrequency | null;
        recurringGroupId: string | null;
        recurrenceEndDate: Date | null;
    }, "status" | "amount" | "paidAmount"> & {
        amount: number;
        paidAmount: number;
        status: FinancialStatus;
        category: {
            id: string;
            name: string;
        } | null;
        client: {
            id: string;
            name: string;
        } | null;
        workOrder: {
            id: string;
            number: number;
        } | null;
        account: {
            id: string;
            name: string;
            type: string;
        } | null;
    }>;
    listPayments(companyId: string, incomeId: string): Promise<{
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
    removePayment(companyId: string, incomeId: string, paymentId: string): Promise<void>;
    private createInstallments;
    private buildStatusWhere;
    private resolveStatus;
    private assertIncomeExists;
    private assertCategoryBelongsToCompany;
    private assertClientBelongsToCompany;
    private assertWorkOrderBelongsToCompany;
    private assertAccountBelongsToCompany;
    private serialize;
}
