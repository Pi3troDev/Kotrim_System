"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let NotificationsService = class NotificationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(companyId, userId, limit) {
        return this.prisma.notification.findMany({
            where: { companyId, userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    async unreadCount(companyId, userId) {
        const count = await this.prisma.notification.count({ where: { companyId, userId, isRead: false } });
        return { count };
    }
    async markAsRead(companyId, userId, id) {
        const notification = await this.prisma.notification.findFirst({ where: { id, companyId, userId } });
        if (!notification) {
            throw new common_1.NotFoundException('Notification not found');
        }
        if (notification.isRead) {
            return notification;
        }
        return this.prisma.notification.update({ where: { id }, data: { isRead: true, readAt: new Date() } });
    }
    async markAllAsRead(companyId, userId) {
        const result = await this.prisma.notification.updateMany({
            where: { companyId, userId, isRead: false },
            data: { isRead: true, readAt: new Date() },
        });
        return { count: result.count };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map