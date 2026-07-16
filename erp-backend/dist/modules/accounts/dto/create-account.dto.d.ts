import { AccountType } from '@prisma/client';
export declare class CreateAccountDto {
    name: string;
    type: AccountType;
    initialBalance?: number;
}
