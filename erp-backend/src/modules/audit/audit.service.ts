import { Injectable, Logger } from '@nestjs/common';
import { AuditAction, AuditResult, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ClientInfo } from '../../common/decorators/client-info.decorator';

export interface AuditEntry {
  action: AuditAction;
  /** What the action was about, e.g. 'Subscription', 'User'. */
  entity: string;
  entityId?: string | null;
  companyId?: string | null;
  /** The account the action is about. */
  userId?: string | null;
  /** Kotrim staff who performed it, when that is not the same person. */
  superAdminId?: string | null;
  result?: AuditResult;
  /** What changed, or why it failed. Never credentials. */
  changes?: Prisma.InputJsonValue;
  client?: ClientInfo;
}

/**
 * The system's memory of who did what.
 *
 * Two rules, both deliberate:
 *
 * 1. **Never throws.** An audit row failing to write must not fail the login,
 *    the payment or the cancellation it was describing. A missing row is bad; a
 *    customer who cannot pay because the audit table is full is worse.
 * 2. **Never records credentials.** `changes` is for context — plan names,
 *    dates, reasons — and callers must not put a password or token in it.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Fire-and-forget. Use for anything on a request's critical path. */
  record(entry: AuditEntry): void {
    void this.write(entry);
  }

  /** Awaits the write. For the rare caller that must know the row landed. */
  async recordAndWait(entry: AuditEntry): Promise<void> {
    await this.write(entry);
  }

  private async write(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: entry.action,
          result: entry.result ?? AuditResult.SUCCESS,
          entity: entry.entity,
          entityId: entry.entityId ?? null,
          companyId: entry.companyId ?? null,
          userId: entry.userId ?? null,
          superAdminId: entry.superAdminId ?? null,
          changes: entry.changes,
          ipAddress: entry.client?.ip ?? null,
          // Some bots send kilobytes of user agent; the column is text but an
          // audit row is not a place to store an essay.
          userAgent: entry.client?.userAgent?.slice(0, 500) ?? null,
        },
      });
    } catch (error: unknown) {
      this.logger.error(
        `Failed to write AuditLog (${entry.action} on ${entry.entity}): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
