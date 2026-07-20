import { Body, Controller, Get, HttpCode, HttpStatus, Post, StreamableFile } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditAction } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Client } from '../../common/decorators/client-info.decorator';
import type { ClientInfo } from '../../common/decorators/client-info.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SkipLegalCheck } from '../../common/decorators/skip-legal-check.decorator';
import { SkipSubscription } from '../../common/decorators/skip-subscription.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { LegalDocumentService } from './legal-document.service';
import { LegalAcceptanceService } from './legal-acceptance.service';
import { DataExportService } from './data-export.service';
import { AcceptLegalDto } from './dto/accept-legal.dto';
import { AuditService } from '../audit/audit.service';

/**
 * Every route here skips both `SubscriptionGuard` and `LegalAcceptanceGuard`:
 * a company that is locked out on billing, or has pending re-acceptance of a
 * newer document, must still be able to read the current terms, see what is
 * pending, accept it, and export its own data. Gating compliance tooling
 * behind the very things it exists to unblock would be a deadlock.
 */
@ApiTags('legal')
@Controller('legal')
@SkipSubscription()
@SkipLegalCheck()
export class LegalController {
  constructor(
    private readonly documents: LegalDocumentService,
    private readonly acceptance: LegalAcceptanceService,
    private readonly dataExport: DataExportService,
    private readonly auditService: AuditService,
  ) {}

  @Get('documents')
  @Public()
  @ApiOperation({ summary: 'The currently active Terms of Use and Privacy Policy' })
  async getActiveDocuments() {
    const { terms, privacy } = await this.documents.getActivePair();
    return { terms, privacy };
  }

  @Get('pending')
  @ApiOperation({ summary: 'Which active documents the current user has not yet accepted' })
  async getPending(@CurrentUser() user: AuthenticatedUser) {
    const pending = await this.acceptance.pendingFor(user.id);
    return {
      pending: pending.map((doc) => ({ id: doc.id, type: doc.type, version: doc.version, title: doc.title })),
    };
  }

  @Post('accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record acceptance of one or more document versions' })
  async accept(
    @Body() dto: AcceptLegalDto,
    @CurrentUser() user: AuthenticatedUser,
    @Client() client: ClientInfo,
  ): Promise<{ ok: true }> {
    await this.acceptance.accept(user.id, dto.documentIds, client);
    return { ok: true };
  }

  @Get('data-export')
  @Roles('Admin')
  @ApiOperation({ summary: "Download the company's full data set as JSON (LGPD portability)" })
  async exportData(
    @CurrentUser() user: AuthenticatedUser,
    @Client() client: ClientInfo,
  ): Promise<StreamableFile> {
    const data = await this.dataExport.exportCompany(user.companyId);

    this.auditService.record({
      action: AuditAction.COMPANY_DATA_EXPORTED,
      entity: 'Company',
      entityId: user.companyId,
      companyId: user.companyId,
      userId: user.id,
      client,
    });

    const json = JSON.stringify(data, null, 2);
    const fileName = `kotrim-dados-${new Date().toISOString().slice(0, 10)}.json`;
    return new StreamableFile(Buffer.from(json, 'utf-8'), {
      type: 'application/json',
      disposition: `attachment; filename="${fileName}"`,
    });
  }
}
