/**
 * The numbers that describe the business.
 *
 * Several are `number | null` rather than `number`, and that is the most
 * important decision in this file. A conversion rate of "0%" when nobody has
 * finished a trial yet is not a fact — it is a lie that looks like a fact, and
 * it is the kind that gets quoted in a meeting. `null` means "not enough data
 * to say", and the UI renders it as a dash.
 */

import { SubscriptionStatus } from '@prisma/client';

export interface MoneyPoint {
  /** YYYY-MM */
  month: string;
  /** e.g. "jul/26" */
  label: string;
  cents: number;
}

export interface RevenueByPlan {
  planName: string;
  slug: string;
  /** Confirmed payments attributed to this plan, all time. */
  cents: number;
  /** Companies currently ACTIVE on it. */
  subscribers: number;
}

export interface RevenueMetrics {
  /**
   * Monthly recurring revenue: the list price of every ACTIVE subscription.
   *
   * Deliberately taken from the plan, not from what was last paid — MRR is what
   * the book says recurs, and a discounted one-off would otherwise quietly
   * become the forecast.
   */
  mrrCents: number;
  /** MRR × 12. A run-rate, not a promise. */
  arrCents: number;
  /** Every confirmed payment, all time. */
  totalCents: number;
  /** Confirmed payments per month, last 12. */
  byMonth: MoneyPoint[];
  byPlan: RevenueByPlan[];
}

export interface SubscriptionCounts {
  pending: number;
  trial: number;
  active: number;
  expired: number;
  cancelled: number;
  total: number;
}

export interface ConversionMetrics {
  /** Companies that have ever been on a trial. */
  trialsStarted: number;
  /** Of those, the ones that went on to pay. */
  trialsConverted: number;
  /** Null until at least one trial has ended — see the note at the top. */
  ratePercent: number | null;
}

export interface ChurnMetrics {
  activeAtMonthStart: number;
  lostThisMonth: number;
  /** Null while nobody was active at the start of the month. */
  ratePercent: number | null;
}

export interface GrowthMetrics {
  companiesThisMonth: number;
  companiesLastMonth: number;
  /** Null when last month was zero — dividing by it would be nonsense, not infinity. */
  percent: number | null;
}

export interface PlanDistribution {
  planName: string;
  slug: string;
  count: number;
  percent: number;
}

/** Totals across every tenant. The size of the thing being run. */
export interface PlatformTotals {
  companies: number;
  users: number;
  workOrders: number;
  vehicles: number;
  clients: number;
  mailsSent: number;
  mailsFailed: number;
  /** Bytes on disk under uploads/. */
  storageBytes: number;
}

export interface RecentSignup {
  companyId: string;
  companyName: string;
  createdAt: string;
  /** null when the company has no subscription row at all. */
  status: SubscriptionStatus | null;
}

export interface RecentPayment {
  companyName: string;
  planName: string | null;
  amountCents: number;
  method: string | null;
  paidAt: string;
}

export interface UpcomingRenewal {
  companyId: string;
  companyName: string;
  planName: string | null;
  currentPeriodEnd: string;
  daysRemaining: number;
}

export interface EndingTrial {
  companyId: string;
  companyName: string;
  trialEndsAt: string;
  daysRemaining: number;
}

export interface PendingPayment {
  companyId: string;
  companyName: string;
  planName: string | null;
  amountCents: number;
  createdAt: string;
}

export interface AdminMetrics {
  revenue: RevenueMetrics;
  subscriptions: SubscriptionCounts;
  conversion: ConversionMetrics;
  churn: ChurnMetrics;
  growth: GrowthMetrics;
  distribution: PlanDistribution[];
  platform: PlatformTotals;
  recentSignups: RecentSignup[];
  recentPayments: RecentPayment[];
  upcomingRenewals: UpcomingRenewal[];
  endingTrials: EndingTrial[];
  pendingPayments: PendingPayment[];
}
