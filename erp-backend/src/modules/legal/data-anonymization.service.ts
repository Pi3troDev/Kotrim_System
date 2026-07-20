import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ClientInfo } from '../../common/decorators/client-info.decorator';

const REMOVED_CLIENT_NAME = 'Cliente anonimizado';
const REMOVED_SUPPLIER_NAME = 'Fornecedor anonimizado';
const REMOVED_EMPLOYEE_NAME = 'Funcionário anonimizado';
const REMOVED_USER_NAME = 'Usuário anonimizado';
const REMOVED_COMPANY_NAME = 'Empresa anonimizada';

/**
 * LGPD Art. 18, VI — anonymization on request, once a company closes its
 * account. Irreversible by design: this scrubs identifying fields in place
 * rather than deleting rows, because the financial and service-history
 * records those rows anchor (`WorkOrder`, `Expense`, `Income`, `Payment`,
 * `Attachment`) have their own retention obligations — Brazilian tax law
 * expects bookkeeping records to survive for years after a business closes,
 * and deleting the row would delete the ledger, not just the identity
 * attached to it.
 *
 * What is deliberately NOT touched: free-text fields on `WorkOrder` (a
 * mechanic's diagnosis notes may mention a name in prose) are out of scope —
 * scrubbing prose safely needs review, not a column-level `UPDATE`. Vehicle
 * plate/brand/model/year/color stay too: they describe the object, not the
 * person, once the linked `Client` has been scrubbed.
 */
@Injectable()
export class DataAnonymizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async anonymizeCompany(companyId: string, superAdminId: string, client?: ClientInfo): Promise<void> {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    if (company.anonymizedAt) {
      throw new BadRequestException('This company has already been anonymized');
    }

    const users = await this.prisma.user.findMany({ where: { companyId }, select: { id: true } });
    const userIds = users.map((user) => user.id);

    await this.prisma.$transaction(async (tx) => {
      await tx.company.update({
        where: { id: companyId },
        data: {
          name: REMOVED_COMPANY_NAME,
          // `document` is unique, so it needs a placeholder, not null.
          document: `ANON-${companyId.slice(0, 8)}`,
          email: null,
          phone: null,
          address: null,
          city: null,
          state: null,
          zipCode: null,
          logoUrl: null,
          anonymizedAt: new Date(),
        },
      });

      for (const userId of userIds) {
        await tx.user.update({
          where: { id: userId },
          data: {
            name: REMOVED_USER_NAME,
            email: `anon-${userId}@anonimizado.kotrim.com.br`,
            avatarUrl: null,
            passwordHash: null,
            isActive: false,
          },
        });
      }

      await tx.client.updateMany({
        where: { companyId },
        data: { name: REMOVED_CLIENT_NAME, document: null, email: null, phone: null, address: null, city: null, state: null, zipCode: null, notes: null },
      });

      await tx.vehicle.updateMany({ where: { companyId }, data: { chassisNumber: null, notes: null } });

      await tx.supplier.updateMany({
        where: { companyId },
        data: { name: REMOVED_SUPPLIER_NAME, document: null, email: null, phone: null, address: null },
      });

      await tx.employee.updateMany({
        where: { companyId },
        data: { name: REMOVED_EMPLOYEE_NAME, document: null, email: null, phone: null },
      });

      // No valid session should survive an account's own anonymization.
      await tx.refreshToken.updateMany({
        where: { userId: { in: userIds }, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.passwordToken.updateMany({
        where: { userId: { in: userIds }, usedAt: null },
        data: { usedAt: new Date() },
      });
    });

    await this.auditService.recordAndWait({
      action: AuditAction.COMPANY_ANONYMIZED,
      entity: 'Company',
      entityId: companyId,
      companyId,
      superAdminId,
      changes: { userCount: userIds.length },
      client,
    });
  }
}
