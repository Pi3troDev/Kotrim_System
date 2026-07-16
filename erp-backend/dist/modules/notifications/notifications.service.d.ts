import { PrismaService } from '../../prisma/prisma.service';
export declare class NotificationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(companyId: string, userId: string, limit: number): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        link: string | null;
        type: import("@prisma/client").$Enums.NotificationType;
        title: string;
        userId: string;
        message: string;
        isRead: boolean;
        readAt: Date | null;
    }[]>;
    unreadCount(companyId: string, userId: string): Promise<{
        count: number;
    }>;
    markAsRead(companyId: string, userId: string, id: string): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        link: string | null;
        type: import("@prisma/client").$Enums.NotificationType;
        title: string;
        userId: string;
        message: string;
        isRead: boolean;
        readAt: Date | null;
    }>;
    markAllAsRead(companyId: string, userId: string): Promise<{
        count: number;
    }>;
}
