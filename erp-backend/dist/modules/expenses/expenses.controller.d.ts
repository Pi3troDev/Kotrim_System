import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { UpdateExpenseStatusDto } from './dto/update-expense-status.dto';
import { QueryExpensesDto } from './dto/query-expenses.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
export declare class ExpensesController {
    private readonly expensesService;
    constructor(expensesService: ExpensesService);
    create(user: AuthenticatedUser, dto: CreateExpenseDto): Promise<(Omit<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string;
        status: import("@prisma/client").$Enums.FinancialStatus;
        amount: import("@prisma/client/runtime/library").Decimal;
        paidAmount: import("@prisma/client/runtime/library").Decimal;
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
        status: import("@prisma/client").FinancialStatus;
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
    findAll(user: AuthenticatedUser, query: QueryExpensesDto): Promise<import("../../common/interfaces/paginated-result.interface").PaginatedResult<Omit<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string;
        status: import("@prisma/client").$Enums.FinancialStatus;
        amount: import("@prisma/client/runtime/library").Decimal;
        paidAmount: import("@prisma/client/runtime/library").Decimal;
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
        status: import("@prisma/client").FinancialStatus;
        category: {
            id: string;
            name: string;
        } | null;
        account: {
            id: string;
            name: string;
            type: string;
        } | null;
    }>>;
    summary(user: AuthenticatedUser): Promise<import("./expenses.service").ExpensesSummary>;
    findOne(user: AuthenticatedUser, id: string): Promise<Omit<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string;
        status: import("@prisma/client").$Enums.FinancialStatus;
        amount: import("@prisma/client/runtime/library").Decimal;
        paidAmount: import("@prisma/client/runtime/library").Decimal;
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
        status: import("@prisma/client").FinancialStatus;
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
    update(user: AuthenticatedUser, id: string, dto: UpdateExpenseDto): Promise<Omit<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string;
        status: import("@prisma/client").$Enums.FinancialStatus;
        amount: import("@prisma/client/runtime/library").Decimal;
        paidAmount: import("@prisma/client/runtime/library").Decimal;
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
        status: import("@prisma/client").FinancialStatus;
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
    updateStatus(user: AuthenticatedUser, id: string, dto: UpdateExpenseStatusDto): Promise<Omit<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string;
        status: import("@prisma/client").$Enums.FinancialStatus;
        amount: import("@prisma/client/runtime/library").Decimal;
        paidAmount: import("@prisma/client/runtime/library").Decimal;
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
        status: import("@prisma/client").FinancialStatus;
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
    stopRecurrence(user: AuthenticatedUser, id: string): Promise<void>;
    addPayment(user: AuthenticatedUser, id: string, dto: CreatePaymentDto): Promise<Omit<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string;
        status: import("@prisma/client").$Enums.FinancialStatus;
        amount: import("@prisma/client/runtime/library").Decimal;
        paidAmount: import("@prisma/client/runtime/library").Decimal;
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
        status: import("@prisma/client").FinancialStatus;
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
