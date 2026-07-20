// PENDING: signed up via "Assinar agora" — never had a trial, waiting on a
// first payment. Distinct from EXPIRED, which means access was had and lost.
export type SubscriptionStatus = 'PENDING' | 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

/**
 * Mirrors the backend `PlanFeature` enum. The values are the contract; which
 * plan grants which feature is decided server-side and arrives in
 * `Subscription.features` — never re-derived here.
 */
export type PlanFeature =
  | 'DASHBOARD'
  | 'CLIENTS'
  | 'VEHICLES'
  | 'WORK_ORDERS'
  | 'AGENDA'
  | 'SETTINGS'
  | 'INVENTORY'
  | 'FINANCE'
  | 'REPORTS'
  | 'EMPLOYEES';
/** Which funnel a company signed up through. Mirrors the backend enum. */
export type RegistrationIntent = 'TRIAL' | 'SUBSCRIBE';

export type BillingProviderKey = 'MANUAL' | 'STRIPE' | 'MERCADO_PAGO' | 'ASAAS';
export type BillingInterval = 'MONTHLY' | 'YEARLY';

export interface Plan {
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

export interface Subscription {
  id: string;
  status: SubscriptionStatus;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
  provider: BillingProviderKey;
  plan: Plan | null;
  daysRemaining: number | null;
  hasAccess: boolean;
  /** Which modules this plan unlocks. Decided by the backend. */
  features: PlanFeature[];
}

/**
 * Mirrors the backend's discriminated union. Handling both arms now is what
 * lets a real gateway (which returns `redirect`) drop in later without this
 * page being rewritten.
 */
export type CheckoutResult =
  | {
      kind: 'manual_instructions';
      paymentId: string;
      amountCents: number;
      currency: string;
      instructions: string[];
      pixKey: string | null;
      contact: string | null;
    }
  | {
      kind: 'redirect';
      paymentId: string;
      url: string;
    };
