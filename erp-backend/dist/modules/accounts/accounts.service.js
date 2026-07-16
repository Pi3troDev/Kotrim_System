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
exports.AccountsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let AccountsService = class AccountsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(companyId, dto) {
        await this.assertNameIsUnique(companyId, dto.name);
        const account = await this.prisma.account.create({
            data: { companyId, name: dto.name, type: dto.type, initialBalance: dto.initialBalance ?? 0 },
        });
        return this.serialize(account, 0);
    }
    async findAll(companyId) {
        const accounts = await this.prisma.account.findMany({
            where: { companyId, deletedAt: null },
            orderBy: { name: 'asc' },
        });
        if (accounts.length === 0) {
            return [];
        }
        const netByAccount = await this.netPaymentsByAccount(companyId, accounts.map((account) => account.id));
        return accounts.map((account) => this.serialize(account, netByAccount.get(account.id) ?? 0));
    }
    async findOne(companyId, id) {
        const account = await this.prisma.account.findFirst({ where: { id, companyId, deletedAt: null } });
        if (!account) {
            throw new common_1.NotFoundException('Account not found');
        }
        const netByAccount = await this.netPaymentsByAccount(companyId, [id]);
        return this.serialize(account, netByAccount.get(id) ?? 0);
    }
    async update(companyId, id, dto) {
        await this.assertAccountExists(companyId, id);
        if (dto.name) {
            await this.assertNameIsUnique(companyId, dto.name, id);
        }
        const updated = await this.prisma.account.update({ where: { id }, data: dto });
        const netByAccount = await this.netPaymentsByAccount(companyId, [id]);
        return this.serialize(updated, netByAccount.get(id) ?? 0);
    }
    async remove(companyId, id) {
        await this.assertAccountExists(companyId, id);
        await this.prisma.account.update({ where: { id }, data: { deletedAt: new Date() } });
    }
    async netPaymentsByAccount(companyId, accountIds) {
        const [incoming, outgoing] = await Promise.all([
            this.prisma.payment.groupBy({
                by: ['accountId'],
                where: { companyId, accountId: { in: accountIds }, incomeId: { not: null } },
                _sum: { amount: true },
            }),
            this.prisma.payment.groupBy({
                by: ['accountId'],
                where: { companyId, accountId: { in: accountIds }, expenseId: { not: null } },
                _sum: { amount: true },
            }),
        ]);
        const net = new Map();
        for (const row of incoming) {
            if (row.accountId)
                net.set(row.accountId, (net.get(row.accountId) ?? 0) + Number(row._sum.amount ?? 0));
        }
        for (const row of outgoing) {
            if (row.accountId)
                net.set(row.accountId, (net.get(row.accountId) ?? 0) - Number(row._sum.amount ?? 0));
        }
        return net;
    }
    async assertAccountExists(companyId, id) {
        const exists = await this.prisma.account.findFirst({ where: { id, companyId, deletedAt: null }, select: { id: true } });
        if (!exists) {
            throw new common_1.NotFoundException('Account not found');
        }
    }
    async assertNameIsUnique(companyId, name, excludeId) {
        const existing = await this.prisma.account.findFirst({
            where: { companyId, name, deletedAt: null, ...(excludeId && { id: { not: excludeId } }) },
        });
        if (existing) {
            throw new common_1.ConflictException('An account with this name already exists');
        }
    }
    serialize(account, netPayments) {
        return {
            ...account,
            initialBalance: Number(account.initialBalance),
            currentBalance: Number(account.initialBalance) + netPayments,
        };
    }
};
exports.AccountsService = AccountsService;
exports.AccountsService = AccountsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AccountsService);
//# sourceMappingURL=accounts.service.js.map