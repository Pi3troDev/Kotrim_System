import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, LegalDocument, LegalDocumentType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ClientInfo } from '../../common/decorators/client-info.decorator';
import { LegalDocumentService } from './legal-document.service';

@Injectable()
export class LegalAcceptanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documents: LegalDocumentService,
    private readonly auditService: AuditService,
  ) {}

  /** The active documents this user has not yet accepted the current version of. */
  async pendingFor(userId: string): Promise<LegalDocument[]> {
    const { terms, privacy } = await this.documents.getActivePair();
    const active = [terms, privacy];

    const accepted = await this.prisma.legalAcceptance.findMany({
      where: { userId, documentId: { in: active.map((doc) => doc.id) } },
      select: { documentId: true },
    });
    const acceptedIds = new Set(accepted.map((row) => row.documentId));

    return active.filter((doc) => !acceptedIds.has(doc.id));
  }

  async hasPending(userId: string): Promise<boolean> {
    const pending = await this.pendingFor(userId);
    return pending.length > 0;
  }

  /** Records acceptance of specific documents. Idempotent — accepting twice is a no-op, not an error. */
  async accept(userId: string, documentIds: string[], client?: ClientInfo): Promise<void> {
    if (documentIds.length === 0) {
      return;
    }

    const documents = await this.prisma.legalDocument.findMany({ where: { id: { in: documentIds } } });
    if (documents.length !== documentIds.length) {
      throw new NotFoundException('One or more legal documents were not found');
    }

    await this.prisma.$transaction(
      documents.map((doc) =>
        this.prisma.legalAcceptance.upsert({
          where: { userId_documentId: { userId, documentId: doc.id } },
          create: {
            userId,
            documentId: doc.id,
            ipAddress: client?.ip ?? null,
            userAgent: client?.userAgent?.slice(0, 500) ?? null,
          },
          update: {},
        }),
      ),
    );

    this.auditService.record({
      action: AuditAction.LEGAL_TERMS_ACCEPTED,
      entity: 'LegalDocument',
      userId,
      changes: { types: documents.map((doc) => doc.type), versions: documents.map((doc) => doc.version) },
      client,
    });
  }

  /**
   * Accepts whatever TERMS/PRIVACY are currently active, inside the caller's
   * own transaction — used only at registration, so a company can never exist
   * without a consent record any more than it can exist without a
   * `Subscription` row. Returns what it accepted so the caller can audit it
   * once the transaction commits (AuditService never writes inside one).
   */
  async acceptCurrentAtRegistration(
    tx: Prisma.TransactionClient,
    userId: string,
    client?: ClientInfo,
  ): Promise<LegalDocument[]> {
    const [terms, privacy] = await Promise.all([
      tx.legalDocument.findFirst({ where: { type: LegalDocumentType.TERMS, isActive: true } }),
      tx.legalDocument.findFirst({ where: { type: LegalDocumentType.PRIVACY, isActive: true } }),
    ]);
    const documents = [terms, privacy].filter((doc): doc is LegalDocument => doc !== null);
    if (documents.length === 0) {
      return [];
    }

    await tx.legalAcceptance.createMany({
      data: documents.map((doc) => ({
        userId,
        documentId: doc.id,
        ipAddress: client?.ip ?? null,
        userAgent: client?.userAgent?.slice(0, 500) ?? null,
      })),
    });

    return documents;
  }
}
