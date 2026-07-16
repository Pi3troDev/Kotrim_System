import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(companyId: string, userId: string, limit: number) {
    return this.prisma.notification.findMany({
      where: { companyId, userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async unreadCount(companyId: string, userId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({ where: { companyId, userId, isRead: false } });
    return { count };
  }

  async markAsRead(companyId: string, userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({ where: { id, companyId, userId } });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    if (notification.isRead) {
      return notification;
    }
    return this.prisma.notification.update({ where: { id }, data: { isRead: true, readAt: new Date() } });
  }

  async markAllAsRead(companyId: string, userId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { companyId, userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { count: result.count };
  }
}
