import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
export declare class AccountsController {
    private readonly accountsService;
    constructor(accountsService: AccountsService);
    create(user: AuthenticatedUser, dto: CreateAccountDto): Promise<{
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
    findAll(user: AuthenticatedUser): Promise<{
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
    findOne(user: AuthenticatedUser, id: string): Promise<{
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
    update(user: AuthenticatedUser, id: string, dto: UpdateAccountDto): Promise<{
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
    remove(user: AuthenticatedUser, id: string): Promise<void>;
}
