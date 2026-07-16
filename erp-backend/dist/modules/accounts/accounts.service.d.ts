import { PrismaService } from '../../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
export declare class AccountsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(companyId: string, dto: CreateAccountDto): Promise<{
        initialBalance: number;
        currentBalance: number;
        name: string;
        id: string;
        companyId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        type: import("@prisma/client").$Enums.AccountType;
    }>;
    findAll(companyId: string): Promise<{
        initialBalance: number;
        currentBalance: number;
        name: string;
        id: string;
        companyId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        type: import("@prisma/client").$Enums.AccountType;
    }[]>;
    findOne(companyId: string, id: string): Promise<{
        initialBalance: number;
        currentBalance: number;
        name: string;
        id: string;
        companyId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        type: import("@prisma/client").$Enums.AccountType;
    }>;
    update(companyId: string, id: string, dto: UpdateAccountDto): Promise<{
        initialBalance: number;
        currentBalance: number;
        name: string;
        id: string;
        companyId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        type: import("@prisma/client").$Enums.AccountType;
    }>;
    remove(companyId: string, id: string): Promise<void>;
    private netPaymentsByAccount;
    private assertAccountExists;
    private assertNameIsUnique;
    private serialize;
}
