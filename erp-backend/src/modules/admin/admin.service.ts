import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, MailStatus, Plan, Prisma, SubscriptionPaymentStatus, SubscriptionStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginatedResult, paginate } from '../../common/interfaces/paginated-result.interface';
import { parseLocalDate } from '../../common/utils/date.util';
import { MailRecipient, MailService } from '../mail/mail.service';
import { AuditService } from '../audit/audit.service';
import { ClientInfo } from '../../common/decorators/client-info.decorator';
import { toSubscriptionView } from '../billing/billing.service';
import { BillingProviderRegistry } from '../billing/providers/billing-provider.registry';
import { SubscriptionView } from '../billing/interfaces/billing.interfaces';
import { ActivateSubscriptionDto } from './dto/activate-subscription.dto';
import { QueryCompaniesDto } from './dto/query-companies.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { AdminCompanyDetail, AdminCompanyRow, AdminMailLogRow, AdminMailStats, AdminStats } from './interfaces/admin.interfaces';
import { QueryMailLogsDto } from './dto/query-mail-logs.dto';
import { MAIL_TEMPLATE_LABELS, MailTemplateKey, isPayloadRedacted } from '../mail/templates/template.types';
import { renderMail } from '../mail/templates/registry';


/** Prisma include shared by the list and detail queries. */
const COMPANY_INCLUDE = {
  subscription: { include: { plan: true } },
  _count: { select: { users: { where: { deletedAt: null } } } },
} satisfies Prisma.CompanyInclude;

type CompanyWithSubscription = Prisma.CompanyGetPayload<{ include: typeof COMPANY_INCLUDE }>;

/**
 * Cross-tenant operations for Kotrim platform staff. Every route that reaches
 * this service is behind `@SuperAdmin()` — nothing here filters by companyId,
 * which is exactly why it must never be exposed to a workshop user.
 */
@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providers: BillingProviderRegistry,
    private readonly mailService: MailService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
  ) {}

  async listCompanies(query: QueryCompaniesDto): Promise<PaginatedResult<AdminCompanyRow>> {
    const { page, limit, search, status } = query;

    const where: Prisma.CompanyWhereInput = {
      deletedAt: null,
      ...(status ? { subscription: { status } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
              { document: { contains: search, mode: Prisma.QueryMode.insensitive } },
              { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
            ],
          }
        : {}),
    };

    const [companies, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        include: COMPANY_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.company.count({ where }),
    ]);

    return paginate(companies.map((company) => toCompanyRow(company)), total, page, limit);
  }

  async getCompany(id: string): Promise<AdminCompanyDetail> {
    const company = await this.prisma.company.findFirst({
      where: { id, deletedAt: null },
      include: COMPANY_INCLUDE,
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const payments = company.subscription
      ? await this.prisma.subscriptionPayment.findMany({
          where: { subscriptionId: company.subscription.id },
          include: { confirmedBy: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        })
      : [];

    return {
      ...toCompanyRow(company),
      payments: payments.map((payment) => ({
        id: payment.id,
        amountCents: payment.amountCents,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        provider: payment.provider,
        paidAt: payment.paidAt?.toISOString() ?? null,
        periodStart: payment.periodStart?.toISOString() ?? null,
        periodEnd: payment.periodEnd?.toISOString() ?? null,
        notes: payment.notes,
        createdAt: payment.createdAt.toISOString(),
        confirmedByName: payment.confirmedBy?.name ?? null,
      })),
    };
  }

  async getStats(): Promise<AdminStats> {
    const grouped = await this.prisma.subscription.groupBy({ by: ['status'], _count: { _all: true } });

    const stats: AdminStats = {
      [SubscriptionStatus.PENDING]: 0,
      [SubscriptionStatus.TRIAL]: 0,
      [SubscriptionStatus.ACTIVE]: 0,
      [SubscriptionStatus.EXPIRED]: 0,
      [SubscriptionStatus.CANCELLED]: 0,
      total: 0,
    };

    for (const row of grouped) {
      stats[row.status] = row._count._all;
      stats.total += row._count._all;
    }

    return stats;
  }

  /**
   * The notification centre: every message the system tried to send.
   *
   * Cross-tenant, like everything else here — support needs to answer "did the
   * welcome e-mail actually go out?" without knowing which company to look in.
   */
  async listMailLogs(query: QueryMailLogsDto): Promise<PaginatedResult<AdminMailLogRow>> {
    const { page, limit, search, status, template } = query;

    const where: Prisma.MailLogWhereInput = {
      ...(status ? { status } : {}),
      ...(template ? { template } : {}),
      ...(search
        ? {
            OR: [
              { to: { contains: search, mode: Prisma.QueryMode.insensitive } },
              { subject: { contains: search, mode: Prisma.QueryMode.insensitive } },
              { company: { name: { contains: search, mode: Prisma.QueryMode.insensitive } } },
            ],
          }
        : {}),
    };

    const [logs, total] = await Promise.all([
      this.prisma.mailLog.findMany({
        where,
        include: { company: { select: { name: true } }, user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.mailLog.count({ where }),
    ]);

    return paginate(
      logs.map((log) => ({
        id: log.id,
        template: log.template,
        templateLabel: MAIL_TEMPLATE_LABELS[log.template as MailTemplateKey] ?? log.template,
        to: log.to,
        subject: log.subject,
        status: log.status,
        provider: log.provider,
        providerMessageId: log.providerMessageId,
        error: log.error,
        createdAt: log.createdAt.toISOString(),
        companyName: log.company?.name ?? null,
        userName: log.user?.name ?? null,
      })),
      total,
      page,
      limit,
    );
  }

  async getMailStats(): Promise<AdminMailStats> {
    const grouped = await this.prisma.mailLog.groupBy({ by: ['status'], _count: { _all: true } });
    const by = (status: MailStatus) => grouped.find((g) => g.status === status)?._count._all ?? 0;

    return {
      total: grouped.reduce((sum, g) => sum + g._count._all, 0),
      sent: by(MailStatus.SENT),
      failed: by(MailStatus.FAILED),
      resent: by(MailStatus.RESENT),
    };
  }

  /**
   * Re-renders a sent message so support can see what the customer got.
   *
   * Rendered from the stored payload against the *current* template — so if the
   * copy has changed since, this is not byte-for-byte what was delivered. The
   * alternative is storing ~20 KB of HTML per row forever, which buys fidelity
   * nobody has asked for at a cost that compounds. The UI says which it is.
   */
  async previewMailLog(id: string): Promise<{ subject: string; html: string; redacted: boolean }> {
    const log = await this.prisma.mailLog.findUnique({ where: { id } });
    if (!log) {
      throw new NotFoundException('E-mail não encontrado');
    }

    const key = log.template as MailTemplateKey;
    if (!(key in MAIL_TEMPLATE_LABELS)) {
      throw new BadRequestException('Este e-mail usa um modelo que não existe mais.');
    }

    const rendered = renderMail(
      key,
      (log.payload ?? {}) as never,
      {
        locale: 'pt-BR',
        appUrl: this.configService.get<string>('appUrl') ?? '',
        supportContact: this.configService.get<string>('billing.contact') ?? '',
        supportEmail: 'contato@kotrim.com.br',
        pixKey: this.configService.get<string>('billing.pixKey') ?? '',
      },
    );

    return { subject: rendered.subject, html: rendered.html, redacted: isPayloadRedacted(key) };
  }

  /**
   * Sends a message again.
   *
   * Refused for templates whose payload is redacted: a password reset cannot be
   * resent because the token that made it work was deliberately never stored.
   * The customer asks for a new one — which is the correct flow anyway, since
   * the original has expired.
   */
  async resendMailLog(id: string, actingUserId: string, client?: ClientInfo): Promise<{ ok: true }> {
    const log = await this.prisma.mailLog.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true, companyId: true } } },
    });
    if (!log) {
      throw new NotFoundException('E-mail não encontrado');
    }

    const key = log.template as MailTemplateKey;
    if (isPayloadRedacted(key)) {
      throw new BadRequestException(
        'Este tipo de e-mail não pode ser reenviado por segurança. Peça ao cliente para solicitar um novo link.',
      );
    }

    if (!log.payload) {
      throw new BadRequestException('Este e-mail é anterior ao registro de conteúdo e não pode ser reenviado.');
    }

    await this.mailService.resend(
      key,
      {
        email: log.user?.email ?? log.to,
        name: log.user?.name ?? 'Cliente',
        userId: log.userId,
        companyId: log.companyId,
      },
      log.payload as never,
    );

    this.auditService.record({
      action: AuditAction.UPDATE,
      entity: 'MailLog',
      entityId: log.id,
      companyId: log.companyId,
      userId: log.userId,
      superAdminId: actingUserId,
      changes: { resent: log.template, to: log.to },
      client,
    });

    return { ok: true };
  }

  /**
   * Confirms a manual payment and turns the subscription on. This is the exact
   * seam a gateway webhook will call once one exists — the activation rules
   * live here, not in the provider, so both paths stay consistent.
   */
  async activate(
    subscriptionId: string,
    dto: ActivateSubscriptionDto,
    actingUserId: string,
    client?: ClientInfo,
  ): Promise<SubscriptionView> {
    const subscription = await this.findSubscriptionOrThrow(subscriptionId);

    const plan = await this.prisma.plan.findUnique({ where: { id: dto.planId } });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    const periodEnd = parseLocalDate(dto.periodEnd.slice(0, 10));
    if (periodEnd <= new Date()) {
      throw new BadRequestException('The period end must be in the future');
    }

    const now = new Date();
    // Captured before the update: afterwards the previous state is gone, and it
    // is what decides which of four e-mails the customer gets — starting,
    // renewing, upgrading or downgrading.
    const wasActive = subscription.status === SubscriptionStatus.ACTIVE;
    const previousPlan = subscription.plan;

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.subscriptionPayment.create({
        data: {
          subscriptionId: subscription.id,
          amountCents: dto.amountCents ?? plan.priceCents,
          currency: plan.currency,
          status: SubscriptionPaymentStatus.CONFIRMED,
          provider: subscription.provider,
          method: dto.method ?? 'PIX',
          paidAt: now,
          confirmedById: actingUserId,
          periodStart: now,
          periodEnd,
          notes: dto.notes,
        },
      });

      return tx.subscription.update({
        where: { id: subscription.id },
        data: {
          status: SubscriptionStatus.ACTIVE,
          planId: plan.id,
          currentPeriodEnd: periodEnd,
          // A previously cancelled company that pays again is active, not
          // cancelled-with-a-future-date.
          cancelledAt: null,
        },
      });
    });

    // The audit action names what actually happened to the customer, so the
    // trail reads the same way the e-mail they received does.
    const changedPlan = previousPlan && previousPlan.id !== plan.id;
    const action =
      wasActive && changedPlan
        ? plan.priceCents > previousPlan!.priceCents
          ? AuditAction.SUBSCRIPTION_UPGRADED
          : AuditAction.SUBSCRIPTION_DOWNGRADED
        : wasActive
          ? AuditAction.SUBSCRIPTION_RENEWED
          : AuditAction.SUBSCRIPTION_ACTIVATED;

    this.auditService.record({
      action,
      entity: 'Subscription',
      entityId: subscription.id,
      companyId: subscription.companyId,
      superAdminId: actingUserId,
      changes: {
        previousPlan: previousPlan?.name ?? null,
        plan: plan.name,
        amountCents: dto.amountCents ?? plan.priceCents,
        method: dto.method ?? 'PIX',
        periodEnd: periodEnd.toISOString(),
      },
      client,
    });

    await this.notifyActivation({
      companyId: subscription.companyId,
      plan,
      previousPlan,
      wasActive,
      periodEnd,
      amountCents: dto.amountCents ?? plan.priceCents,
      method: dto.method ?? 'Pix',
    });

    return toSubscriptionView(updated, plan);
  }

  /**
   * Decides which story this activation tells the customer, and sends it.
   *
   * Best-effort: the activation has already committed, so a mail failure must
   * never surface as a failed activation. MailService swallows send errors; this
   * only guards the lookup.
   */
  private async notifyActivation(input: {
    companyId: string;
    plan: Plan;
    previousPlan: Plan | null;
    wasActive: boolean;
    periodEnd: Date;
    amountCents: number;
    method: string;
  }): Promise<void> {
    const recipient = await this.resolveCompanyAdmin(input.companyId);
    if (!recipient) return;

    const name = recipient.name;
    const planName = input.plan.name;

    // The payment receipt goes out for every activation that involved money —
    // including a renewal, where it is the only proof the customer gets.
    this.mailService.paymentConfirmed(recipient, {
      name,
      planName,
      amountCents: input.amountCents,
      method: input.method,
    });

    // Plan changes are told apart by price rather than by name: the plan
    // *catalogue* can be renamed, but "paid more than before" is what an
    // upgrade actually means to a customer.
    const changedPlan = input.previousPlan && input.previousPlan.id !== input.plan.id;

    if (input.wasActive && changedPlan) {
      const isUpgrade = input.plan.priceCents > input.previousPlan!.priceCents;
      const payload = {
        name,
        previousPlanName: input.previousPlan!.name,
        planName,
        periodEnd: input.periodEnd,
      };

      if (isUpgrade) {
        this.mailService.subscriptionUpgraded(recipient, payload);
      } else {
        this.mailService.subscriptionDowngraded(recipient, payload);
      }
      return;
    }

    if (input.wasActive) {
      this.mailService.subscriptionRenewed(recipient, { name, planName, periodEnd: input.periodEnd });
      return;
    }

    this.mailService.subscriptionActivated(recipient, { name, planName, periodEnd: input.periodEnd });
  }

  /** The company's oldest active user — the admin created at signup. */
  private async resolveCompanyAdmin(companyId: string): Promise<MailRecipient | null> {
    const admin = await this.prisma.user.findFirst({
      where: { companyId, deletedAt: null, isActive: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true, email: true, name: true },
    });

    return admin ? { email: admin.email, name: admin.name, userId: admin.id, companyId } : null;
  }

  async cancel(subscriptionId: string, actingUserId?: string, client?: ClientInfo): Promise<SubscriptionView> {
    const subscription = await this.findSubscriptionOrThrow(subscriptionId);

    if (subscription.status === SubscriptionStatus.CANCELLED) {
      throw new BadRequestException('This subscription is already cancelled');
    }

    // Let the provider tear down anything it holds. Manual billing is a no-op,
    // but a gateway would revoke the recurring charge here.
    await this.providers.get(subscription.provider).cancelSubscription(subscription);

    const updated = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: SubscriptionStatus.CANCELLED, cancelledAt: new Date() },
    });

    this.auditService.record({
      action: AuditAction.SUBSCRIPTION_CANCELLED,
      entity: 'Subscription',
      entityId: subscription.id,
      companyId: subscription.companyId,
      superAdminId: actingUserId,
      changes: { plan: subscription.plan?.name ?? null },
      client,
    });

    const recipient = await this.resolveCompanyAdmin(subscription.companyId);
    if (recipient) {
      this.mailService.subscriptionCancelled(recipient, {
        name: recipient.name,
        planName: subscription.plan?.name ?? null,
      });
    }

    return toSubscriptionView(updated, subscription.plan);
  }

  async updateDates(
    subscriptionId: string,
    dto: UpdateSubscriptionDto,
    actingUserId?: string,
    client?: ClientInfo,
  ): Promise<SubscriptionView> {
    const subscription = await this.findSubscriptionOrThrow(subscriptionId);

    if (!dto.currentPeriodEnd && !dto.trialEndsAt) {
      throw new BadRequestException('Provide at least one date to change');
    }

    const data: Prisma.SubscriptionUpdateInput = {};
    if (dto.currentPeriodEnd) {
      data.currentPeriodEnd = parseLocalDate(dto.currentPeriodEnd.slice(0, 10));
    }
    if (dto.trialEndsAt) {
      data.trialEndsAt = parseLocalDate(dto.trialEndsAt.slice(0, 10));
    }

    const updated = await this.prisma.subscription.update({ where: { id: subscription.id }, data });

    // Pushing a date into the future is how a super-admin un-expires an
    // account; without this the row would stay EXPIRED and keep it locked out.
    const revived = await this.reviveIfDateExtended(updated);

    this.auditService.record({
      action: AuditAction.SUBSCRIPTION_DATES_CHANGED,
      entity: 'Subscription',
      entityId: subscription.id,
      companyId: subscription.companyId,
      superAdminId: actingUserId,
      changes: {
        currentPeriodEnd: dto.currentPeriodEnd ?? null,
        trialEndsAt: dto.trialEndsAt ?? null,
        statusAfter: revived.status,
      },
      client,
    });

    return toSubscriptionView(revived, subscription.plan);
  }

  private async reviveIfDateExtended(subscription: Prisma.SubscriptionGetPayload<object>) {
    if (subscription.status !== SubscriptionStatus.EXPIRED) {
      return subscription;
    }

    const now = new Date();
    if (subscription.currentPeriodEnd && subscription.currentPeriodEnd > now) {
      return this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: SubscriptionStatus.ACTIVE },
      });
    }
    if (subscription.trialEndsAt && subscription.trialEndsAt > now) {
      return this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: SubscriptionStatus.TRIAL },
      });
    }

    return subscription;
  }

  private async findSubscriptionOrThrow(id: string) {
    const subscription = await this.prisma.subscription.findUnique({ where: { id }, include: { plan: true } });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    return subscription;
  }
}

function toCompanyRow(company: CompanyWithSubscription): AdminCompanyRow {
  return {
    id: company.id,
    name: company.name,
    document: company.document,
    email: company.email,
    phone: company.phone,
    createdAt: company.createdAt.toISOString(),
    userCount: company._count.users,
    subscription: company.subscription
      ? toSubscriptionView(company.subscription, company.subscription.plan)
      : null,
  };
}
