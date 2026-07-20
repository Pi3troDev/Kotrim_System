import { Injectable, Logger } from '@nestjs/common';
import { MailStatus, SubscriptionPaymentStatus, SubscriptionStatus } from '@prisma/client';
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AdminMetrics,
  ChurnMetrics,
  ConversionMetrics,
  GrowthMetrics,
  MoneyPoint,
  PlanDistribution,
  PlatformTotals,
  RevenueMetrics,
  SubscriptionCounts,
} from './interfaces/metrics.interfaces';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const REVENUE_MONTHS = 12;
const RECENT_LIMIT = 8;
/** How far ahead the "renewing soon" and "trial ending" lists look. */
const UPCOMING_WINDOW_DAYS = 30;

/** Local month boundary — `new Date(y, m, 1)` in the server's zone, matching the rest of the app. */
function monthStart(offset = 0): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + offset, 1);
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' }).format(date).replace('.', '');
}

function daysUntil(date: Date): number {
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / MS_PER_DAY));
}

/**
 * Everything the Super Admin dashboard shows.
 *
 * Cross-tenant by nature — every query here deliberately has no `companyId`
 * filter, which is precisely why this only ever runs behind `@SuperAdmin()`.
 */
@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getMetrics(): Promise<AdminMetrics> {
    const [revenue, subscriptions, conversion, churn, growth, distribution, platform] = await Promise.all([
      this.revenue(),
      this.subscriptionCounts(),
      this.conversion(),
      this.churn(),
      this.growth(),
      this.distribution(),
      this.platformTotals(),
    ]);

    const [recentSignups, recentPayments, upcomingRenewals, endingTrials, pendingPayments] =
      await Promise.all([
        this.recentSignups(),
        this.recentPayments(),
        this.upcomingRenewals(),
        this.endingTrials(),
        this.pendingPayments(),
      ]);

    return {
      revenue,
      subscriptions,
      conversion,
      churn,
      growth,
      distribution,
      platform,
      recentSignups,
      recentPayments,
      upcomingRenewals,
      endingTrials,
      pendingPayments,
    };
  }

  // ── Revenue ───────────────────────────────────────────────────────────────

  private async revenue(): Promise<RevenueMetrics> {
    const activeWithPlan = await this.prisma.subscription.findMany({
      where: { status: SubscriptionStatus.ACTIVE, planId: { not: null } },
      include: { plan: true },
    });

    // MRR from the plan's list price, not from the last payment — see the note
    // on the interface.
    const mrrCents = activeWithPlan.reduce((sum, s) => sum + (s.plan?.priceCents ?? 0), 0);

    const confirmed = await this.prisma.subscriptionPayment.findMany({
      where: { status: SubscriptionPaymentStatus.CONFIRMED },
      select: { amountCents: true, paidAt: true, createdAt: true, subscription: { select: { plan: true } } },
    });

    const totalCents = confirmed.reduce((sum, p) => sum + p.amountCents, 0);

    // Buckets pre-seeded so a month with no revenue is a zero on the chart,
    // not a gap the line jumps over.
    const buckets = new Map<string, MoneyPoint>();
    for (let i = REVENUE_MONTHS - 1; i >= 0; i--) {
      const date = monthStart(-i);
      buckets.set(monthKey(date), { month: monthKey(date), label: monthLabel(date), cents: 0 });
    }

    for (const payment of confirmed) {
      const when = payment.paidAt ?? payment.createdAt;
      const bucket = buckets.get(monthKey(when));
      if (bucket) bucket.cents += payment.amountCents;
    }

    const byPlanMap = new Map<string, { planName: string; slug: string; cents: number; subscribers: number }>();
    for (const payment of confirmed) {
      const plan = payment.subscription.plan;
      if (!plan) continue;
      const entry = byPlanMap.get(plan.slug) ?? {
        planName: plan.name,
        slug: plan.slug,
        cents: 0,
        subscribers: 0,
      };
      entry.cents += payment.amountCents;
      byPlanMap.set(plan.slug, entry);
    }
    for (const subscription of activeWithPlan) {
      const plan = subscription.plan!;
      const entry = byPlanMap.get(plan.slug) ?? {
        planName: plan.name,
        slug: plan.slug,
        cents: 0,
        subscribers: 0,
      };
      entry.subscribers += 1;
      byPlanMap.set(plan.slug, entry);
    }

    return {
      mrrCents,
      arrCents: mrrCents * 12,
      totalCents,
      byMonth: [...buckets.values()],
      byPlan: [...byPlanMap.values()].sort((a, b) => b.cents - a.cents),
    };
  }

  // ── Subscriptions ─────────────────────────────────────────────────────────

  private async subscriptionCounts(): Promise<SubscriptionCounts> {
    const grouped = await this.prisma.subscription.groupBy({ by: ['status'], _count: { _all: true } });
    const by = (status: SubscriptionStatus) => grouped.find((g) => g.status === status)?._count._all ?? 0;

    return {
      pending: by(SubscriptionStatus.PENDING),
      trial: by(SubscriptionStatus.TRIAL),
      active: by(SubscriptionStatus.ACTIVE),
      expired: by(SubscriptionStatus.EXPIRED),
      cancelled: by(SubscriptionStatus.CANCELLED),
      total: grouped.reduce((sum, g) => sum + g._count._all, 0),
    };
  }

  /**
   * Trial → paid.
   *
   * "Has ever been on a trial" is inferred from `trialEndsAt` being set, which
   * only the trial funnel does — a "subscribe now" signup has it null. Converted
   * means that same company has a confirmed payment. Both are properties of the
   * row as it stands today, so a company that trialled, paid, and later
   * cancelled still counts as converted, which is the truth.
   */
  private async conversion(): Promise<ConversionMetrics> {
    const [trialsStarted, trialsConverted] = await Promise.all([
      this.prisma.subscription.count({ where: { trialEndsAt: { not: null } } }),
      this.prisma.subscription.count({
        where: {
          trialEndsAt: { not: null },
          payments: { some: { status: SubscriptionPaymentStatus.CONFIRMED } },
        },
      }),
    ]);

    return {
      trialsStarted,
      trialsConverted,
      ratePercent: trialsStarted === 0 ? null : Math.round((trialsConverted / trialsStarted) * 1000) / 10,
    };
  }

  /**
   * Churn for the current month.
   *
   * Denominator is who was active when the month began; numerator is who has
   * been cancelled since. Approximate — a proper cohort churn needs a history
   * table this system does not keep — and it stays null until there is anyone to
   * divide by, rather than reporting a confident 0%.
   */
  private async churn(): Promise<ChurnMetrics> {
    const start = monthStart();

    const [lostThisMonth, activeNow] = await Promise.all([
      this.prisma.subscription.count({
        where: { status: SubscriptionStatus.CANCELLED, cancelledAt: { gte: start } },
      }),
      this.prisma.subscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
    ]);

    const activeAtMonthStart = activeNow + lostThisMonth;

    return {
      activeAtMonthStart,
      lostThisMonth,
      ratePercent:
        activeAtMonthStart === 0 ? null : Math.round((lostThisMonth / activeAtMonthStart) * 1000) / 10,
    };
  }

  private async growth(): Promise<GrowthMetrics> {
    const thisStart = monthStart();
    const lastStart = monthStart(-1);

    const [companiesThisMonth, companiesLastMonth] = await Promise.all([
      this.prisma.company.count({ where: { deletedAt: null, createdAt: { gte: thisStart } } }),
      this.prisma.company.count({
        where: { deletedAt: null, createdAt: { gte: lastStart, lt: thisStart } },
      }),
    ]);

    return {
      companiesThisMonth,
      companiesLastMonth,
      percent:
        companiesLastMonth === 0
          ? null
          : Math.round(((companiesThisMonth - companiesLastMonth) / companiesLastMonth) * 1000) / 10,
    };
  }

  private async distribution(): Promise<PlanDistribution[]> {
    const active = await this.prisma.subscription.findMany({
      where: { status: SubscriptionStatus.ACTIVE, planId: { not: null } },
      include: { plan: { select: { name: true, slug: true } } },
    });

    const counts = new Map<string, PlanDistribution>();
    for (const subscription of active) {
      const plan = subscription.plan!;
      const entry = counts.get(plan.slug) ?? { planName: plan.name, slug: plan.slug, count: 0, percent: 0 };
      entry.count += 1;
      counts.set(plan.slug, entry);
    }

    const total = active.length;
    return [...counts.values()]
      .map((entry) => ({ ...entry, percent: total === 0 ? 0 : Math.round((entry.count / total) * 1000) / 10 }))
      .sort((a, b) => b.count - a.count);
  }

  // ── Platform ──────────────────────────────────────────────────────────────

  private async platformTotals(): Promise<PlatformTotals> {
    const [companies, users, workOrders, vehicles, clients, mailsSent, mailsFailed, storageBytes] =
      await Promise.all([
        this.prisma.company.count({ where: { deletedAt: null } }),
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.workOrder.count({ where: { deletedAt: null } }),
        this.prisma.vehicle.count({ where: { deletedAt: null } }),
        this.prisma.client.count({ where: { deletedAt: null } }),
        this.prisma.mailLog.count({ where: { status: { in: [MailStatus.SENT, MailStatus.RESENT] } } }),
        this.prisma.mailLog.count({ where: { status: MailStatus.FAILED } }),
        this.uploadsSize(),
      ]);

    return { companies, users, workOrders, vehicles, clients, mailsSent, mailsFailed, storageBytes };
  }

  /**
   * Bytes under uploads/.
   *
   * Walks the directory on every call, which is fine while storage is a handful
   * of logos on local disk. The day this moves to object storage, or the walk
   * starts costing anything, it wants caching — but guessing at that now would
   * be inventing a problem.
   */
  private async uploadsSize(): Promise<number> {
    const root = join(process.cwd(), 'uploads');

    const walk = async (dir: string): Promise<number> => {
      let total = 0;
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const path = join(dir, entry.name);
        total += entry.isDirectory() ? await walk(path) : (await stat(path)).size;
      }
      return total;
    };

    try {
      return await walk(root);
    } catch {
      // No uploads directory yet. Zero is the honest answer, not an error.
      return 0;
    }
  }

  // ── Activity ──────────────────────────────────────────────────────────────

  private async recentSignups() {
    const companies = await this.prisma.company.findMany({
      where: { deletedAt: null },
      include: { subscription: { select: { status: true } } },
      orderBy: { createdAt: 'desc' },
      take: RECENT_LIMIT,
    });

    return companies.map((company) => ({
      companyId: company.id,
      companyName: company.name,
      createdAt: company.createdAt.toISOString(),
      // null, not a made-up status string: a company can predate the billing
      // tables, and the UI says "Sem assinatura" rather than inventing a state.
      status: company.subscription?.status ?? null,
    }));
  }

  private async recentPayments() {
    const payments = await this.prisma.subscriptionPayment.findMany({
      where: { status: SubscriptionPaymentStatus.CONFIRMED },
      include: { subscription: { include: { company: { select: { name: true } }, plan: true } } },
      orderBy: { paidAt: 'desc' },
      take: RECENT_LIMIT,
    });

    return payments.map((payment) => ({
      companyName: payment.subscription.company.name,
      planName: payment.subscription.plan?.name ?? null,
      amountCents: payment.amountCents,
      method: payment.method,
      paidAt: (payment.paidAt ?? payment.createdAt).toISOString(),
    }));
  }

  private async upcomingRenewals() {
    const horizon = new Date(Date.now() + UPCOMING_WINDOW_DAYS * MS_PER_DAY);

    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: { gte: new Date(), lte: horizon },
      },
      include: { company: { select: { id: true, name: true } }, plan: { select: { name: true } } },
      orderBy: { currentPeriodEnd: 'asc' },
      take: RECENT_LIMIT,
    });

    return subscriptions.map((subscription) => ({
      companyId: subscription.company.id,
      companyName: subscription.company.name,
      planName: subscription.plan?.name ?? null,
      currentPeriodEnd: subscription.currentPeriodEnd!.toISOString(),
      daysRemaining: daysUntil(subscription.currentPeriodEnd!),
    }));
  }

  private async endingTrials() {
    const horizon = new Date(Date.now() + UPCOMING_WINDOW_DAYS * MS_PER_DAY);

    const subscriptions = await this.prisma.subscription.findMany({
      where: { status: SubscriptionStatus.TRIAL, trialEndsAt: { gte: new Date(), lte: horizon } },
      include: { company: { select: { id: true, name: true } } },
      orderBy: { trialEndsAt: 'asc' },
      take: RECENT_LIMIT,
    });

    return subscriptions.map((subscription) => ({
      companyId: subscription.company.id,
      companyName: subscription.company.name,
      trialEndsAt: subscription.trialEndsAt!.toISOString(),
      daysRemaining: daysUntil(subscription.trialEndsAt!),
    }));
  }

  /** Orders waiting on a human: someone chose a plan and nobody has confirmed the Pix. */
  private async pendingPayments() {
    const payments = await this.prisma.subscriptionPayment.findMany({
      where: { status: SubscriptionPaymentStatus.PENDING },
      include: { subscription: { include: { company: { select: { id: true, name: true } }, plan: true } } },
      orderBy: { createdAt: 'desc' },
      take: RECENT_LIMIT,
    });

    return payments.map((payment) => ({
      companyId: payment.subscription.company.id,
      companyName: payment.subscription.company.name,
      planName: payment.subscription.plan?.name ?? null,
      amountCents: payment.amountCents,
      createdAt: payment.createdAt.toISOString(),
    }));
  }
}
