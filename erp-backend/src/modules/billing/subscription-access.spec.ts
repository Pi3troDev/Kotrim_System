import { Subscription, SubscriptionStatus } from '@prisma/client';
import { daysRemaining, hasAccess, isLapsed } from './subscription-access.service';

/**
 * The access state machine, exhaustively.
 *
 * Every path a company can take through the product ends in one of these
 * states, and `hasAccess` is the single question that decides whether the ERP
 * opens. It is worth being paranoid about: a false positive here is free
 * software, and a false negative locks a paying customer out of their own shop.
 */

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-07-17T12:00:00Z');
const future = (days: number) => new Date(NOW.getTime() + days * DAY);
const past = (days: number) => new Date(NOW.getTime() - days * DAY);

function sub(overrides: Partial<Subscription>): Subscription {
  return {
    id: 'sub-1',
    companyId: 'co-1',
    planId: null,
    status: SubscriptionStatus.TRIAL,
    trialEndsAt: null,
    currentPeriodEnd: null,
    cancelledAt: null,
    provider: 'MANUAL',
    providerCustomerId: null,
    providerSubscriptionId: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  } as Subscription;
}

describe('subscription access', () => {
  describe('who gets in', () => {
    it('lets a running trial in', () => {
      expect(hasAccess(sub({ status: SubscriptionStatus.TRIAL, trialEndsAt: future(3) }))).toBe(true);
    });

    it('lets an active subscription in', () => {
      expect(hasAccess(sub({ status: SubscriptionStatus.ACTIVE, currentPeriodEnd: future(20) }))).toBe(true);
    });
  });

  describe('who stays out', () => {
    // "Assinar agora": registered, never trialled, waiting on a first payment.
    // The whole point of the flow — if this ever returns true, anyone can sign
    // up through the paid funnel and use the product for free.
    it('keeps a PENDING signup out', () => {
      expect(hasAccess(sub({ status: SubscriptionStatus.PENDING }))).toBe(false);
    });

    it('keeps an expired subscription out', () => {
      expect(hasAccess(sub({ status: SubscriptionStatus.EXPIRED }))).toBe(false);
    });

    it('keeps a cancelled subscription out, even with time left on the clock', () => {
      expect(
        hasAccess(sub({ status: SubscriptionStatus.CANCELLED, currentPeriodEnd: future(20), cancelledAt: NOW })),
      ).toBe(false);
    });
  });

  describe('is an allowlist, not a blocklist', () => {
    // The guard rule that matters most: a status nobody thought about must fail
    // closed. PENDING was added to the enum after this rule was written and was
    // locked out for free precisely because of it.
    it('denies any status that is not explicitly ACTIVE or TRIAL', () => {
      const allowed: SubscriptionStatus[] = [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL];

      for (const status of Object.values(SubscriptionStatus)) {
        expect(hasAccess(sub({ status }))).toBe(allowed.includes(status));
      }
    });
  });

  describe('lapsing', () => {
    it('lapses a trial whose end date has passed', () => {
      expect(isLapsed(sub({ status: SubscriptionStatus.TRIAL, trialEndsAt: past(1) }), NOW)).toBe(true);
    });

    it('does not lapse a trial still running', () => {
      expect(isLapsed(sub({ status: SubscriptionStatus.TRIAL, trialEndsAt: future(1) }), NOW)).toBe(false);
    });

    it('lapses an active subscription past its period end', () => {
      expect(isLapsed(sub({ status: SubscriptionStatus.ACTIVE, currentPeriodEnd: past(1) }), NOW)).toBe(true);
    });

    it('never lapses a PENDING signup — it has no clock to run out', () => {
      expect(isLapsed(sub({ status: SubscriptionStatus.PENDING }), NOW)).toBe(false);
    });

    it('does not lapse a trial with no end date set', () => {
      expect(isLapsed(sub({ status: SubscriptionStatus.TRIAL, trialEndsAt: null }), NOW)).toBe(false);
    });

    it('treats the exact boundary as lapsed', () => {
      // `<=`: a subscription that ends "now" is over, not still running.
      expect(isLapsed(sub({ status: SubscriptionStatus.TRIAL, trialEndsAt: NOW }), NOW)).toBe(true);
    });
  });

  describe('days remaining', () => {
    it('counts down the trial', () => {
      expect(daysRemaining(sub({ status: SubscriptionStatus.TRIAL, trialEndsAt: future(7) }), NOW)).toBe(7);
    });

    it('counts down the paid period', () => {
      expect(daysRemaining(sub({ status: SubscriptionStatus.ACTIVE, currentPeriodEnd: future(30) }), NOW)).toBe(30);
    });

    it('clamps at zero rather than going negative', () => {
      expect(daysRemaining(sub({ status: SubscriptionStatus.TRIAL, trialEndsAt: past(5) }), NOW)).toBe(0);
    });

    it('is null for a PENDING signup — no clock is running', () => {
      expect(daysRemaining(sub({ status: SubscriptionStatus.PENDING }), NOW)).toBeNull();
    });

    it('is null for cancelled and expired', () => {
      expect(daysRemaining(sub({ status: SubscriptionStatus.CANCELLED }), NOW)).toBeNull();
      expect(daysRemaining(sub({ status: SubscriptionStatus.EXPIRED }), NOW)).toBeNull();
    });
  });

  describe('the journeys a real company takes', () => {
    it('trial funnel: signs up -> uses the ERP -> lapses -> locked out', () => {
      const onTrial = sub({ status: SubscriptionStatus.TRIAL, trialEndsAt: future(7) });
      expect(hasAccess(onTrial)).toBe(true);

      const lapsed = sub({ status: SubscriptionStatus.TRIAL, trialEndsAt: past(1) });
      expect(isLapsed(lapsed, NOW)).toBe(true);
      expect(hasAccess(sub({ status: SubscriptionStatus.EXPIRED }))).toBe(false);
    });

    it('subscribe funnel: signs up -> locked out -> admin activates -> in', () => {
      expect(hasAccess(sub({ status: SubscriptionStatus.PENDING }))).toBe(false);
      expect(hasAccess(sub({ status: SubscriptionStatus.ACTIVE, currentPeriodEnd: future(30) }))).toBe(true);
    });

    it('expired company pays again -> back in, no data lost in between', () => {
      expect(hasAccess(sub({ status: SubscriptionStatus.EXPIRED }))).toBe(false);
      expect(hasAccess(sub({ status: SubscriptionStatus.ACTIVE, currentPeriodEnd: future(30) }))).toBe(true);
    });

    it('cancelled company resubscribes -> cancelledAt cleared, back in', () => {
      expect(hasAccess(sub({ status: SubscriptionStatus.CANCELLED, cancelledAt: past(2) }))).toBe(false);
      expect(
        hasAccess(sub({ status: SubscriptionStatus.ACTIVE, currentPeriodEnd: future(30), cancelledAt: null })),
      ).toBe(true);
    });
  });
});
