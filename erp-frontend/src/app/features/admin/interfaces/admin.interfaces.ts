import { Subscription, SubscriptionStatus } from '../../subscription/interfaces/subscription.interfaces';

export interface AdminCompanyRow {
  id: string;
  name: string;
  document: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  userCount: number;
  subscription: Subscription | null;
}

export interface AdminPaymentRow {
  id: string;
  amountCents: number;
  currency: string;
  status: string;
  method: string | null;
  provider: string;
  paidAt: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  notes: string | null;
  createdAt: string;
  confirmedByName: string | null;
}

export interface AdminCompanyDetail extends AdminCompanyRow {
  payments: AdminPaymentRow[];
}

export type AdminStats = Record<SubscriptionStatus, number> & { total: number };

export interface ActivateSubscriptionPayload {
  planId: string;
  periodEnd: string;
  amountCents?: number;
  method?: string;
  notes?: string;
}

export interface UpdateSubscriptionPayload {
  currentPeriodEnd?: string;
  trialEndsAt?: string;
}

export type MailStatus = 'SENT' | 'FAILED' | 'RESENT';

export interface AdminMailLogRow {
  id: string;
  template: string;
  /** Human label resolved by the backend — the raw key means nothing to a person. */
  templateLabel: string;
  to: string;
  subject: string;
  status: MailStatus;
  provider: string;
  providerMessageId: string | null;
  error: string | null;
  createdAt: string;
  companyName: string | null;
  userName: string | null;
}

export interface AdminMailStats {
  total: number;
  sent: number;
  failed: number;
  resent: number;
}

export interface ImpersonationSession {
  accessToken: string;
  expiresInMinutes: number;
  company: { id: string; name: string };
  user: { id: string; name: string; email: string; role: string; roleAllowedFeatures: string[] };
}

// ── SaaS metrics ────────────────────────────────────────────────────────────
//
// Several rates are `number | null`. Null means "not enough data to say" and
// must render as a dash — a 0% conversion when nobody has finished a trial is a
// lie that looks like a fact.

export interface MoneyPoint { month: string; label: string; cents: number; }
export interface RevenueByPlan { planName: string; slug: string; cents: number; subscribers: number; }

export interface AdminMetrics {
  revenue: {
    mrrCents: number;
    arrCents: number;
    totalCents: number;
    byMonth: MoneyPoint[];
    byPlan: RevenueByPlan[];
  };
  subscriptions: { pending: number; trial: number; active: number; expired: number; cancelled: number; total: number };
  conversion: { trialsStarted: number; trialsConverted: number; ratePercent: number | null };
  churn: { activeAtMonthStart: number; lostThisMonth: number; ratePercent: number | null };
  growth: { companiesThisMonth: number; companiesLastMonth: number; percent: number | null };
  distribution: { planName: string; slug: string; count: number; percent: number }[];
  platform: {
    companies: number; users: number; workOrders: number; vehicles: number;
    clients: number; mailsSent: number; mailsFailed: number; storageBytes: number;
  };
  recentSignups: { companyId: string; companyName: string; createdAt: string; status: SubscriptionStatus | null }[];
  recentPayments: { companyName: string; planName: string | null; amountCents: number; method: string | null; paidAt: string }[];
  upcomingRenewals: { companyId: string; companyName: string; planName: string | null; currentPeriodEnd: string; daysRemaining: number }[];
  endingTrials: { companyId: string; companyName: string; trialEndsAt: string; daysRemaining: number }[];
  pendingPayments: { companyId: string; companyName: string; planName: string | null; amountCents: number; createdAt: string }[];
}

export type ServiceState = 'up' | 'degraded' | 'down';

export interface SystemHealth {
  version: string;
  environment: string;
  uptimeSeconds: number;
  nodeVersion: string;
  services: { name: string; state: ServiceState; detail: string; latencyMs?: number }[];
  recentErrors: { at: string; source: string; message: string; context: string | null }[];
  queues: null;
  scheduledJobs: { name: string; schedule: string; timezone: string }[];
  memory: { usedMb: number; totalMb: number };
}

export interface MailPreview {
  subject: string;
  html: string;
  /** True when the payload was redacted — resend is impossible for these. */
  redacted: boolean;
}
