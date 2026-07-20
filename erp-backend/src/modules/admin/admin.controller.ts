import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SkipSubscription } from '../../common/decorators/skip-subscription.decorator';
import { SuperAdmin } from '../../common/decorators/super-admin.decorator';
import { Client } from '../../common/decorators/client-info.decorator';
import type { ClientInfo } from '../../common/decorators/client-info.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { SubscriptionView } from '../billing/interfaces/billing.interfaces';
import { AdminService } from './admin.service';
import { ImpersonationService, ImpersonationSession } from './impersonation.service';
import { MetricsService } from './metrics.service';
import { HealthService, SystemHealth } from './health.service';
import { AdminMetrics } from './interfaces/metrics.interfaces';
import { ActivateSubscriptionDto } from './dto/activate-subscription.dto';
import { QueryCompaniesDto } from './dto/query-companies.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { AdminCompanyDetail, AdminCompanyRow, AdminMailLogRow, AdminMailStats, AdminStats } from './interfaces/admin.interfaces';
import { QueryMailLogsDto } from './dto/query-mail-logs.dto';
import { LegalDocument } from '@prisma/client';
import { LegalDocumentService } from '../legal/legal-document.service';
import { DataAnonymizationService } from '../legal/data-anonymization.service';
import { PublishLegalDocumentDto } from '../legal/dto/publish-legal-document.dto';

/**
 * Kotrim platform administration — cross-tenant, staff only.
 *
 * `@SkipSubscription` because platform staff are not paying customers of the
 * ERP; their own company row's billing state must never lock them out of the
 * panel they use to fix everyone else's.
 */
@ApiTags('admin')
@Controller('admin')
@SuperAdmin()
@SkipSubscription()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly impersonationService: ImpersonationService,
    private readonly metricsService: MetricsService,
    private readonly healthService: HealthService,
    private readonly legalDocumentService: LegalDocumentService,
    private readonly dataAnonymizationService: DataAnonymizationService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Subscription counts by status' })
  getStats(): Promise<AdminStats> {
    return this.adminService.getStats();
  }

  @Get('metrics')
  @ApiOperation({
    summary: 'Every figure the SaaS dashboard shows',
    description:
      'Rates come back null rather than 0 when there is not enough data to compute them honestly.',
  })
  getMetrics(): Promise<AdminMetrics> {
    return this.metricsService.getMetrics();
  }

  @Get('health')
  @ApiOperation({ summary: 'Measured system health — database, mail, recent errors, jobs' })
  getHealth(): Promise<SystemHealth> {
    return this.healthService.getHealth();
  }

  @Get('companies')
  @ApiOperation({ summary: 'List every registered company with its subscription' })
  listCompanies(@Query() query: QueryCompaniesDto): Promise<PaginatedResult<AdminCompanyRow>> {
    return this.adminService.listCompanies(query);
  }

  @Get('companies/:id')
  @ApiOperation({ summary: 'Company detail with its payment history' })
  getCompany(@Param('id', ParseUUIDPipe) id: string): Promise<AdminCompanyDetail> {
    return this.adminService.getCompany(id);
  }

  @Get('mail-logs')
  @ApiOperation({ summary: 'Every e-mail the system tried to send, newest first' })
  listMailLogs(@Query() query: QueryMailLogsDto): Promise<PaginatedResult<AdminMailLogRow>> {
    return this.adminService.listMailLogs(query);
  }

  @Get('mail-stats')
  @ApiOperation({ summary: 'Delivery counts by status' })
  getMailStats(): Promise<AdminMailStats> {
    return this.adminService.getMailStats();
  }

  @Get('mail-logs/:id/preview')
  @ApiOperation({
    summary: 'Re-render a sent e-mail so support can see what the customer got',
    description: 'Rendered from the stored payload against the current template.',
  })
  previewMailLog(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ subject: string; html: string; redacted: boolean }> {
    return this.adminService.previewMailLog(id);
  }

  @Post('mail-logs/:id/resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a message again. Refused for templates with a redacted payload.' })
  resendMailLog(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Client() client: ClientInfo,
  ): Promise<{ ok: true }> {
    return this.adminService.resendMailLog(id, user.id, client);
  }

  @Post('companies/:id/impersonate')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Start a read-only support session inside a company',
    description:
      'Returns a short-lived, non-refreshable token. The session cannot write, cannot reach the admin panel and cannot impersonate further. Both ends are audited.',
  })
  impersonate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Client() client: ClientInfo,
  ): Promise<ImpersonationSession> {
    return this.impersonationService.start(id, user, client);
  }

  @Post('subscriptions/:id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm a manual payment and activate the subscription' })
  activate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActivateSubscriptionDto,
    @CurrentUser() user: AuthenticatedUser,
    @Client() client: ClientInfo,
  ): Promise<SubscriptionView> {
    return this.adminService.activate(id, dto, user.id, client);
  }

  @Post('subscriptions/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a subscription (revokes access immediately)' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Client() client: ClientInfo,
  ): Promise<SubscriptionView> {
    return this.adminService.cancel(id, user.id, client);
  }

  @Patch('subscriptions/:id')
  @ApiOperation({ summary: 'Change the trial or billing due date' })
  updateDates(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubscriptionDto,
    @CurrentUser() user: AuthenticatedUser,
    @Client() client: ClientInfo,
  ): Promise<SubscriptionView> {
    return this.adminService.updateDates(id, dto, user.id, client);
  }

  @Get('legal/documents')
  @ApiOperation({ summary: 'Every Terms of Use / Privacy Policy version ever published, newest first' })
  listLegalDocuments(): Promise<LegalDocument[]> {
    return this.legalDocumentService.listVersions();
  }

  @Post('legal/documents')
  @ApiOperation({
    summary: 'Publish a new version of the Terms of Use or Privacy Policy',
    description:
      'Deactivates the current version of that type and activates this one. Every customer who already ' +
      'accepted the old version is now pending re-acceptance and is blocked until they accept the new text.',
  })
  publishLegalDocument(@Body() dto: PublishLegalDocumentDto): Promise<LegalDocument> {
    return this.legalDocumentService.publish(dto.type, dto.version, dto.title, dto.content);
  }

  @Post('companies/:id/anonymize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Irreversibly scrub a company\'s personal data (LGPD anonymization request)',
    description:
      'Names, documents, e-mails and phone numbers are replaced across the company and everyone in it. ' +
      'Financial and service-history records are kept for legal retention, just without the identity attached. ' +
      'Cannot be undone.',
  })
  anonymizeCompany(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Client() client: ClientInfo,
  ): Promise<{ ok: true }> {
    return this.dataAnonymizationService.anonymizeCompany(id, user.id, client).then(() => ({ ok: true as const }));
  }
}
