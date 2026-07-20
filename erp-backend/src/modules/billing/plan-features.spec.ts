import { CategoryType, SubscriptionStatus } from '@prisma/client';
import {
  ALL_FEATURES,
  CATEGORY_TYPE_FEATURE,
  PLAN_FEATURES,
  PLAN_MAX_USERS,
  PlanFeature,
  PLAN_MAX_EMPLOYEES,
  featuresForSubscription,
  maxEmployeesForSubscription,
  planHasFeature,
} from './plan-features';

/** Minimal stand-in for the subscription shape the resolver actually reads. */
function subscription(status: SubscriptionStatus, slug?: string) {
  return { status, plan: slug ? { slug } : null };
}

describe('plan features matrix', () => {
  describe('Essencial', () => {
    const essencial = subscription(SubscriptionStatus.ACTIVE, 'essencial');

    it.each([
      PlanFeature.DASHBOARD,
      PlanFeature.CLIENTS,
      PlanFeature.VEHICLES,
      PlanFeature.WORK_ORDERS,
      PlanFeature.AGENDA,
      PlanFeature.SETTINGS,
      PlanFeature.EMPLOYEES,
    ])('includes %s', (feature) => {
      expect(planHasFeature(essencial, feature)).toBe(true);
    });

    it.each([PlanFeature.INVENTORY, PlanFeature.FINANCE, PlanFeature.REPORTS])(
      'excludes %s',
      (feature) => {
        expect(planHasFeature(essencial, feature)).toBe(false);
      },
    );

    // The bug that shipped: EMPLOYEES was Oficina Plus only, but the Agenda is
    // organised by mechanic and a work order assigns one — so both base modules
    // call GET /employees and an Essencial subscriber got bounced to the upgrade
    // page from their own Agenda. These three assert the dependency holds.
    it('includes EMPLOYEES, which AGENDA and WORK_ORDERS depend on', () => {
      expect(planHasFeature(essencial, PlanFeature.EMPLOYEES)).toBe(true);
      expect(planHasFeature(essencial, PlanFeature.AGENDA)).toBe(true);
      expect(planHasFeature(essencial, PlanFeature.WORK_ORDERS)).toBe(true);
    });

    it('caps the roster at 3 mechanics instead of blocking the module', () => {
      expect(maxEmployeesForSubscription(essencial)).toBe(3);
    });
  });

  describe('Profissional', () => {
    const profissional = subscription(SubscriptionStatus.ACTIVE, 'profissional');

    it('adds the management modules on top of the base ones', () => {
      expect(planHasFeature(profissional, PlanFeature.INVENTORY)).toBe(true);
      expect(planHasFeature(profissional, PlanFeature.FINANCE)).toBe(true);
      expect(planHasFeature(profissional, PlanFeature.REPORTS)).toBe(true);
    });

    it('includes Funcionários, capped at 10', () => {
      expect(planHasFeature(profissional, PlanFeature.EMPLOYEES)).toBe(true);
      expect(maxEmployeesForSubscription(profissional)).toBe(10);
    });

    it('is a strict superset of Essencial', () => {
      for (const feature of PLAN_FEATURES['essencial']) {
        expect(PLAN_FEATURES['profissional']).toContain(feature);
      }
    });
  });

  describe('Oficina Plus', () => {
    const plus = subscription(SubscriptionStatus.ACTIVE, 'oficina-plus');

    it('unlocks every feature', () => {
      for (const feature of ALL_FEATURES) {
        expect(planHasFeature(plus, feature)).toBe(true);
      }
    });

    it('has an unlimited roster — the actual differentiator', () => {
      expect(maxEmployeesForSubscription(plus)).toBeNull();
    });

    it('is a strict superset of Profissional', () => {
      for (const feature of PLAN_FEATURES['profissional']) {
        expect(PLAN_FEATURES['oficina-plus']).toContain(feature);
      }
    });
  });

  describe('trial', () => {
    // Decision 07: the trial deliberately unlocks the top plan so the customer
    // experiences what the paid tiers are for.
    it('unlocks everything, matching Oficina Plus', () => {
      const trial = subscription(SubscriptionStatus.TRIAL);
      expect(featuresForSubscription(trial).sort()).toEqual([...ALL_FEATURES].sort());
    });

    it('unlocks everything even with a cheap plan already selected at checkout', () => {
      // Picking a plan at checkout sets planId before payment is confirmed;
      // that must not shrink the running trial.
      const trial = subscription(SubscriptionStatus.TRIAL, 'essencial');
      expect(planHasFeature(trial, PlanFeature.FINANCE)).toBe(true);
    });
  });

  describe('no access', () => {
    it.each([SubscriptionStatus.EXPIRED, SubscriptionStatus.CANCELLED])('grants nothing when %s', (status) => {
      expect(featuresForSubscription(subscription(status, 'oficina-plus'))).toEqual([]);
    });

    it('grants nothing when there is no subscription at all', () => {
      expect(featuresForSubscription(null)).toEqual([]);
    });
  });

  describe('fails closed', () => {
    it('falls back to the base features for an unknown plan slug', () => {
      const weird = subscription(SubscriptionStatus.ACTIVE, 'plano-que-nao-existe');
      expect(planHasFeature(weird, PlanFeature.CLIENTS)).toBe(true);
      expect(planHasFeature(weird, PlanFeature.FINANCE)).toBe(false);
      // Base includes the module, but the roster falls back to the entry cap.
      expect(maxEmployeesForSubscription(weird)).toBe(3);
    });

    it('falls back to the base features for an ACTIVE subscription with no plan', () => {
      const noPlan = subscription(SubscriptionStatus.ACTIVE);
      expect(planHasFeature(noPlan, PlanFeature.CLIENTS)).toBe(true);
      expect(planHasFeature(noPlan, PlanFeature.FINANCE)).toBe(false);
    });
  });

  describe('registry integrity', () => {
    it('covers exactly the seeded plan slugs', () => {
      expect(Object.keys(PLAN_FEATURES).sort()).toEqual(['essencial', 'oficina-plus', 'profissional']);
    });

    it('declares a user limit for every plan', () => {
      expect(Object.keys(PLAN_MAX_USERS).sort()).toEqual(Object.keys(PLAN_FEATURES).sort());
      expect(PLAN_MAX_USERS['essencial']).toBe(3);
      expect(PLAN_MAX_USERS['profissional']).toBe(10);
      expect(PLAN_MAX_USERS['oficina-plus']).toBeNull();
    });

    it('declares an employee limit for every plan', () => {
      expect(Object.keys(PLAN_MAX_EMPLOYEES).sort()).toEqual(Object.keys(PLAN_FEATURES).sort());
    });

    it('gives a trial an unlimited roster, matching trial = top plan', () => {
      expect(maxEmployeesForSubscription(subscription(SubscriptionStatus.TRIAL))).toBeNull();
    });

    it('every plan can reach AGENDA, WORK_ORDERS and EMPLOYEES together', () => {
      // The three travel as a unit: breaking one breaks the other two.
      for (const slug of Object.keys(PLAN_FEATURES)) {
        const sub = subscription(SubscriptionStatus.ACTIVE, slug);
        expect(planHasFeature(sub, PlanFeature.AGENDA)).toBe(true);
        expect(planHasFeature(sub, PlanFeature.WORK_ORDERS)).toBe(true);
        expect(planHasFeature(sub, PlanFeature.EMPLOYEES)).toBe(true);
      }
    });

    it('maps every category type to a feature', () => {
      expect(CATEGORY_TYPE_FEATURE[CategoryType.INVENTORY]).toBe(PlanFeature.INVENTORY);
      expect(CATEGORY_TYPE_FEATURE[CategoryType.EXPENSE]).toBe(PlanFeature.FINANCE);
      expect(CATEGORY_TYPE_FEATURE[CategoryType.INCOME]).toBe(PlanFeature.FINANCE);
    });

    it('returns a copy, so a caller cannot mutate the matrix', () => {
      const features = featuresForSubscription(subscription(SubscriptionStatus.ACTIVE, 'essencial'));
      features.push(PlanFeature.FINANCE);
      expect(planHasFeature(subscription(SubscriptionStatus.ACTIVE, 'essencial'), PlanFeature.FINANCE)).toBe(false);
    });
  });
});
