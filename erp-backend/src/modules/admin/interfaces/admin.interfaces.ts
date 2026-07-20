import { SubscriptionStatus } from '@prisma/client';
import { SubscriptionView } from '../../billing/interfaces/billing.interfaces';

export interface AdminCompanyRow {
  id: string;
  name: string;
  document: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  userCount: number;
  subscription: SubscriptionView | null;
}

export interface AdminCompanyDetail extends AdminCompanyRow {
  payments: AdminPaymentRow[];
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

export type AdminStats = Record<SubscriptionStatus, number> & { total: number };

export interface AdminMailLogRow {
  id: string;
  template: string;
  /** Human label for the template — the raw key means nothing to a person. */
  templateLabel: string;
  to: string;
  subject: string;
  status: string;
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
