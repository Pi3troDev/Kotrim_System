import { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
type UserWithRole = User & {
    role: {
        name: string;
    };
};
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findByEmail(email: string): Promise<UserWithRole | null>;
    findById(id: string): Promise<UserWithRole | null>;
    updateLastLogin(id: string): Promise<User>;
}
export {};
