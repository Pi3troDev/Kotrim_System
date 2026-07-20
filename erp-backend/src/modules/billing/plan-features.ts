import { CategoryType, Subscription, SubscriptionStatus } from '@prisma/client';

/**
 * What a plan unlocks. The single source of truth for the whole system: the
 * backend guard reads it, and the frontend gets it from `GET /subscriptions/me`
 * rather than keeping its own copy — a matrix duplicated in two places drifts.
 */
export enum PlanFeature {
  DASHBOARD = 'DASHBOARD',
  CLIENTS = 'CLIENTS',
  VEHICLES = 'VEHICLES',
  WORK_ORDERS = 'WORK_ORDERS',
  AGENDA = 'AGENDA',
  SETTINGS = 'SETTINGS',
  INVENTORY = 'INVENTORY',
  FINANCE = 'FINANCE',
  REPORTS = 'REPORTS',
  EMPLOYEES = 'EMPLOYEES',
}

/**
 * Everything a workshop needs to operate. Note what is NOT gated here:
 * a work order's labour/parts/total amounts, and manually typed parts on a
 * work order. Those are core to quoting a job — gating them behind FINANCE or
 * INVENTORY would make the entry plan unable to price a service at all.
 * FINANCE means payables/receivables/cash-flow; INVENTORY means stock control.
 *
 * EMPLOYEES is here for the same reason, learned the hard way: it started as an
 * Oficina Plus feature, but the Agenda is organised *by mechanic* and a work
 * order *assigns* one — so both base modules call `GET /employees` and an
 * Essencial subscriber was bounced to the upgrade page from their own Agenda.
 * The team roster is plumbing that WORK_ORDERS and AGENDA depend on; what the
 * higher plans sell is *how many* of them (see PLAN_MAX_EMPLOYEES), not access.
 */
const BASE_FEATURES: readonly PlanFeature[] = [
  PlanFeature.DASHBOARD,
  PlanFeature.CLIENTS,
  PlanFeature.VEHICLES,
  PlanFeature.WORK_ORDERS,
  PlanFeature.AGENDA,
  PlanFeature.SETTINGS,
  PlanFeature.EMPLOYEES,
];

const MANAGEMENT_FEATURES: readonly PlanFeature[] = [
  PlanFeature.INVENTORY,
  PlanFeature.FINANCE,
  PlanFeature.REPORTS,
];

export const ALL_FEATURES: readonly PlanFeature[] = Object.values(PlanFeature);

/** Keyed by `Plan.slug` — see prisma/seed.ts. */
export const PLAN_FEATURES: Readonly<Record<string, readonly PlanFeature[]>> = {
  essencial: BASE_FEATURES,
  profissional: [...BASE_FEATURES, ...MANAGEMENT_FEATURES],
  'oficina-plus': [...BASE_FEATURES, ...MANAGEMENT_FEATURES],
};

/**
 * Login seats. Declared so the pricing page can quote them, but nothing
 * enforces them yet: there is no user-management CRUD, so every company has
 * exactly the admin created at registration and there is nothing to limit.
 * Enforcement lands with the Users & Permissions phase.
 *
 * Not to be confused with PLAN_MAX_EMPLOYEES: a user is a login, an employee is
 * a mechanic on the roster. A workshop with eight mechanics may well have two
 * logins.
 */
export const PLAN_MAX_USERS: Readonly<Record<string, number | null>> = {
  essencial: 3,
  profissional: 10,
  'oficina-plus': null,
};

/**
 * Mechanics on the roster. `null` = unlimited.
 *
 * This — not access to the module — is what the higher plans actually sell.
 * Enforced on create in EmployeesService.
 */
export const PLAN_MAX_EMPLOYEES: Readonly<Record<string, number | null>> = {
  essencial: 3,
  profissional: 10,
  'oficina-plus': null,
};

/** Default for a trial or an unrecognised plan: the trial unlocks everything. */
const UNLIMITED = null;

/**
 * How many mechanics this subscription may have. Trials are unlimited, matching
 * the "trial = top plan" rule; an unknown plan falls back to the entry limit.
 */
export function maxEmployeesForSubscription(subscription: SubscriptionForFeatures | null): number | null {
  if (!subscription) return 0;
  if (subscription.status === SubscriptionStatus.TRIAL) return UNLIMITED;

  const slug = subscription.plan?.slug;
  if (!slug) return PLAN_MAX_EMPLOYEES['essencial'];

  return slug in PLAN_MAX_EMPLOYEES ? PLAN_MAX_EMPLOYEES[slug] : PLAN_MAX_EMPLOYEES['essencial'];
}

/** Category types follow whichever module consumes them (decision 04). */
export const CATEGORY_TYPE_FEATURE: Readonly<Record<CategoryType, PlanFeature>> = {
  [CategoryType.INVENTORY]: PlanFeature.INVENTORY,
  [CategoryType.EXPENSE]: PlanFeature.FINANCE,
  [CategoryType.INCOME]: PlanFeature.FINANCE,
};

type SubscriptionForFeatures = Pick<Subscription, 'status'> & { plan?: { slug: string } | null };

/**
 * Resolves the features a company may use right now.
 *
 * Falls back to BASE_FEATURES — never to everything — whenever the plan cannot
 * be determined. An unrecognised slug is a configuration mistake, and the safe
 * failure for a configuration mistake is *less* access, not free access to the
 * premium modules.
 */
export function featuresForSubscription(subscription: SubscriptionForFeatures | null): PlanFeature[] {
  if (!subscription) {
    return [];
  }

  // The 7-day trial unlocks everything on purpose: a customer who never opens
  // Financeiro or Estoque during the trial has no reason to pick a plan above
  // the cheapest one.
  if (subscription.status === SubscriptionStatus.TRIAL) {
    return [...ALL_FEATURES];
  }

  if (subscription.status !== SubscriptionStatus.ACTIVE) {
    // PENDING/expired/cancelled companies are already stopped by
    // SubscriptionGuard; returning nothing keeps the two guards from disagreeing.
    return [];
  }

  const slug = subscription.plan?.slug;
  if (!slug) {
    return [...BASE_FEATURES];
  }

  return [...(PLAN_FEATURES[slug] ?? BASE_FEATURES)];
}

export function planHasFeature(subscription: SubscriptionForFeatures | null, feature: PlanFeature): boolean {
  return featuresForSubscription(subscription).includes(feature);
}
