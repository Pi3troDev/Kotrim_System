import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { IncomesService } from './incomes.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { UpdateIncomeStatusDto } from './dto/update-income-status.dto';
import { QueryIncomesDto } from './dto/query-incomes.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
export declare class IncomesController {
    private readonly incomesService;
    constructor(incomesService: IncomesService);
    create(user: AuthenticatedUser, dto: CreateIncomeDto): Promise<(Omit<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string;
        clientId: string | null;
        status: import("@prisma/client").$Enums.FinancialStatus;
        amount: import("@prisma/client/runtime/library").Decimal;
        paidAmount: import("@prisma/client/runtime/library").Decimal;
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
        status: import("@prisma/client").FinancialStatus;
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
    findAll(user: AuthenticatedUser, query: QueryIncomesDto): Promise<import("../../common/interfaces/paginated-result.interface").PaginatedResult<Omit<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string;
        clientId: string | null;
        status: import("@prisma/client").$Enums.FinancialStatus;
        amount: import("@prisma/client/runtime/library").Decimal;
        paidAmount: import("@prisma/client/runtime/library").Decimal;
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
        status: import("@prisma/client").FinancialStatus;
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
    }>>;
    summary(user: AuthenticatedUser): Promise<import("./incomes.service").IncomesSummary>;
    findOne(user: AuthenticatedUser, id: string): Promise<Omit<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string;
        clientId: string | null;
        status: import("@prisma/client").$Enums.FinancialStatus;
        amount: import("@prisma/client/runtime/library").Decimal;
        paidAmount: import("@prisma/client/runtime/library").Decimal;
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
        status: import("@prisma/client").FinancialStatus;
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
    update(user: AuthenticatedUser, id: string, dto: UpdateIncomeDto): Promise<Omit<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string;
        clientId: string | null;
        status: import("@prisma/client").$Enums.FinancialStatus;
        amount: import("@prisma/client/runtime/library").Decimal;
        paidAmount: import("@prisma/client/runtime/library").Decimal;
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
        status: import("@prisma/client").FinancialStatus;
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
    updateStatus(user: AuthenticatedUser, id: string, dto: UpdateIncomeStatusDto): Promise<Omit<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string;
        clientId: string | null;
        status: import("@prisma/client").$Enums.FinancialStatus;
        amount: import("@prisma/client/runtime/library").Decimal;
        paidAmount: import("@prisma/client/runtime/library").Decimal;
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
        status: import("@prisma/client").FinancialStatus;
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
    stopRecurrence(user: AuthenticatedUser, id: string): Promise<void>;
    addPayment(user: AuthenticatedUser, id: string, dto: CreatePaymentDto): Promise<Omit<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string;
        clientId: string | null;
        status: import("@prisma/client").$Enums.FinancialStatus;
        amount: import("@prisma/client/runtime/library").Decimal;
        paidAmount: import("@prisma/client/runtime/library").Decimal;
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
        status: import("@prisma/client").FinancialStatus;
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
    listPayments(user: AuthenticatedUser, id: string): Promise<{
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
    removePayment(user: AuthenticatedUser, id: string, paymentId: string): Promise<void>;
    remove(user: AuthenticatedUser, id: string): Promise<void>;
}
