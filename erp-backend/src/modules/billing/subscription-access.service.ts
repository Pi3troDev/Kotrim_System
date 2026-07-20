import { Injectable } from '@nestjs/common';
import { Plan, Subscription, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** The plan is joined in because PlanFeatureGuard resolves features from its slug. */
export type SubscriptionWithPlan = Subscription & { plan: Plan | null };

export interface SubscriptionAccess {
  subscription: SubscriptionWithPlan | null;
  /** Whether the company may use the ERP right now. */
  allowed: boolean;
}

/**
 * The single source of truth for "can this company use the ERP?".
 *
 * Both `SubscriptionGuard` (which blocks requests) and `BillingService` (which
 * tells the UI why) go through here, so the badge a workshop sees can never
 * disagree with what the guard actually enforces.
 */
@Injectable()
export class SubscriptionAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(companyId: string): Promise<SubscriptionAccess> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { companyId },
      include: { plan: true },
    });
    if (!subscription) {
      return { subscription: null, allowed: false };
    }

    const settled = await this.settleExpiry(subscription);
    return { subscription: settled, allowed: hasAccess(settled) };
  }

  /**
   * Flips a lapsed TRIAL/ACTIVE row to EXPIRED on read.
   *
   * The nightly cron does this in bulk, but a request that lands between
   * midnight and the 03:00 run would otherwise still be let through on a
   * subscription that ended yesterday. Doing it here keeps the guard correct
   * regardless of whether the cron ever ran.
   */
  private async settleExpiry(subscription: SubscriptionWithPlan): Promise<SubscriptionWithPlan> {
    if (!isLapsed(subscription, new Date())) {
      return subscription;
    }

    return this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: SubscriptionStatus.EXPIRED },
      include: { plan: true },
    });
  }
}

/** True when the subscription's clock has run out but the row still says otherwise. */
export function isLapsed(subscription: Subscription, now: Date): boolean {
  if (subscription.status === SubscriptionStatus.TRIAL) {
    return !!subscription.trialEndsAt && subscription.trialEndsAt <= now;
  }
  if (subscription.status === SubscriptionStatus.ACTIVE) {
    return !!subscription.currentPeriodEnd && subscription.currentPeriodEnd <= now;
  }
  return false;
}

/**
 * Access rule, assuming expiry has already been settled.
 *
 * An allowlist, not a blocklist: only ACTIVE and TRIAL get in, so a new status
 * added to the enum later is locked out by default rather than accidentally
 * granted. That is what kept PENDING safe the moment it was introduced.
 *
 * PENDING = signed up via "Assinar agora", never had a trial, waiting on a
 * first payment. CANCELLED loses access immediately rather than coasting to the
 * end of the paid period: billing is manual, so cancelling is an administrator's
 * deliberate act, and the admin panel can push the due date out if a grace
 * period is actually wanted.
 */
export function hasAccess(subscription: Subscription): boolean {
  return (
    subscription.status === SubscriptionStatus.ACTIVE || subscription.status === SubscriptionStatus.TRIAL
  );
}

/** Whole days left on whichever clock is running; null when none applies. */
export function daysRemaining(subscription: Subscription, now = new Date()): number | null {
  const deadline =
    subscription.status === SubscriptionStatus.TRIAL
      ? subscription.trialEndsAt
      : subscription.status === SubscriptionStatus.ACTIVE
        ? subscription.currentPeriodEnd
        : null;

  if (!deadline) {
    return null;
  }

  return Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / MS_PER_DAY));
}
