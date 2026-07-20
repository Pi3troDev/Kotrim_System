import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * LGPD Art. 18, V — portability. One JSON document with everything the
 * workshop itself entered into Kotrim, scoped to a single `companyId`.
 *
 * Deliberately excludes platform-operational tables (`AuditLog`, `MailLog`,
 * `Notification`): those describe what Kotrim did *around* the company's
 * data, not data the company provided. `User` rows drop `passwordHash` —
 * a hash is not personal data the subject needs back, and shipping it out
 * would turn every export into a credential leak.
 */
@Injectable()
export class DataExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportCompany(companyId: string): Promise<Record<string, unknown>> {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const [
      users,
      clients,
      vehicles,
      employees,
      workOrders,
      appointments,
      categories,
      suppliers,
      inventoryItems,
      stockMovements,
      expenses,
      incomes,
      accounts,
      payments,
      attachments,
      subscription,
      subscriptionPayments,
    ] = await Promise.all([
      this.prisma.user.findMany({
        where: { companyId },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          role: { select: { name: true } },
        },
      }),
      this.prisma.client.findMany({ where: { companyId } }),
      this.prisma.vehicle.findMany({ where: { companyId } }),
      this.prisma.employee.findMany({ where: { companyId } }),
      this.prisma.workOrder.findMany({ where: { companyId }, include: { items: true, history: true } }),
      this.prisma.appointment.findMany({ where: { companyId } }),
      this.prisma.category.findMany({ where: { companyId } }),
      this.prisma.supplier.findMany({ where: { companyId } }),
      this.prisma.inventoryItem.findMany({ where: { companyId } }),
      this.prisma.stockMovement.findMany({ where: { companyId } }),
      this.prisma.expense.findMany({ where: { companyId } }),
      this.prisma.income.findMany({ where: { companyId } }),
      this.prisma.account.findMany({ where: { companyId } }),
      this.prisma.payment.findMany({ where: { companyId } }),
      this.prisma.attachment.findMany({ where: { companyId } }),
      this.prisma.subscription.findUnique({ where: { companyId }, include: { plan: true } }),
      this.prisma.subscriptionPayment.findMany({ where: { subscription: { companyId } } }),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      company,
      users,
      clients,
      vehicles,
      employees,
      workOrders,
      appointments,
      categories,
      suppliers,
      inventoryItems,
      stockMovements,
      expenses,
      incomes,
      accounts,
      payments,
      attachments,
      subscription,
      subscriptionPayments,
    };
  }
}
