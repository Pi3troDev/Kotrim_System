import { BillingInterval, BillingProvider, SubscriptionStatus } from '@prisma/client';
import { PlanFeature } from '../plan-features';

export interface PlanView {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  interval: BillingInterval;
  features: string[];
  maxUsers: number | null;
}

export interface SubscriptionView {
  id: string;
  status: SubscriptionStatus;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
  provider: BillingProvider;
  plan: PlanView | null;
  /**
   * Whole days left on whichever clock is running (trial or paid period).
   * 0 once it has run out; null when no clock applies (e.g. CANCELLED).
   */
  daysRemaining: number | null;
  /** Mirrors what `SubscriptionGuard` enforces, so the UI never has to re-derive it. */
  hasAccess: boolean;
  /**
   * The modules this plan unlocks. The frontend hides navigation from this list
   * rather than keeping its own copy of the matrix — two copies drift, and the
   * one in the browser is the one that would silently start lying.
   */
  features: PlanFeature[];
}
