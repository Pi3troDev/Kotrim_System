import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { NotificationsService } from './notifications.service';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    findAll(user: AuthenticatedUser, query: QueryNotificationsDto): Promise<{
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
    unreadCount(user: AuthenticatedUser): Promise<{
        count: number;
    }>;
    markAllAsRead(user: AuthenticatedUser): Promise<{
        count: number;
    }>;
    markAsRead(user: AuthenticatedUser, id: string): Promise<{
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
}
