import { Injectable, NotFoundException } from '@nestjs/common';
import { LegalDocument, LegalDocumentType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LegalDocumentService {
  constructor(private readonly prisma: PrismaService) {}

  async getActive(type: LegalDocumentType): Promise<LegalDocument> {
    const document = await this.prisma.legalDocument.findFirst({
      where: { type, isActive: true },
      orderBy: { publishedAt: 'desc' },
    });

    // A missing active document is a deploy/seed bug, not a user-facing 404:
    // registration and every gated route assume both types exist.
    if (!document) {
      throw new NotFoundException(`No active ${type} document is published`);
    }
    return document;
  }

  async getActivePair(): Promise<{ terms: LegalDocument; privacy: LegalDocument }> {
    const [terms, privacy] = await Promise.all([
      this.getActive(LegalDocumentType.TERMS),
      this.getActive(LegalDocumentType.PRIVACY),
    ]);
    return { terms, privacy };
  }

  /** Every version ever published, newest first — the audit trail of the text itself. */
  async listVersions(type?: LegalDocumentType): Promise<LegalDocument[]> {
    return this.prisma.legalDocument.findMany({
      where: type ? { type } : undefined,
      orderBy: [{ type: 'asc' }, { publishedAt: 'desc' }],
    });
  }

  /**
   * Deactivates the current version of `type` and publishes a new one in the
   * same transaction, so there is never a moment with zero or two active
   * versions of the same document.
   */
  async publish(type: LegalDocumentType, version: string, title: string, content: string): Promise<LegalDocument> {
    return this.prisma.$transaction(async (tx) => {
      await tx.legalDocument.updateMany({ where: { type, isActive: true }, data: { isActive: false } });
      return tx.legalDocument.create({ data: { type, version, title, content, isActive: true } });
    });
  }
}
