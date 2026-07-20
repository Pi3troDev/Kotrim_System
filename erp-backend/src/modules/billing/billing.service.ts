import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Plan, Subscription, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PlanView, SubscriptionView } from './interfaces/billing.interfaces';
import { featuresForSubscription } from './plan-features';
import { CheckoutResult } from './providers/billing-provider.interface';
import { BillingProviderRegistry } from './providers/billing-provider.registry';
import { daysRemaining, hasAccess, SubscriptionAccessService } from './subscription-access.service';

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: SubscriptionAccessService,
    private readonly providers: BillingProviderRegistry,
  ) {}

  /** Public catalogue — also what the landing page will render. */
  async listPlans(): Promise<PlanView[]> {
    const plans = await this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { priceCents: 'asc' }],
    });

    return plans.map((plan) => toPlanView(plan));
  }

  async getMySubscription(companyId: string): Promise<SubscriptionView> {
    const { subscription } = await this.access.resolve(companyId);
    if (!subscription) {
      throw new NotFoundException('This company has no subscription');
    }

    const plan = subscription.planId
      ? await this.prisma.plan.findUnique({ where: { id: subscription.planId } })
      : null;

    return toSubscriptionView(subscription, plan);
  }

  /**
   * Starts a purchase through whichever provider the subscription is bound to.
   * Under manual billing this records a PENDING payment and returns
   * instructions — it never grants access on its own. Only a super-admin
   * confirming the payment (or, later, a gateway webhook) does that.
   */
  async createCheckout(companyId: string, userId: string, planId: string): Promise<CheckoutResult> {
    const subscription = await this.prisma.subscription.findUnique({ where: { companyId } });
    if (!subscription) {
      throw new NotFoundException('This company has no subscription');
    }

    if (subscription.status === SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('This company already has an active subscription');
    }

    const plan = await this.prisma.plan.findFirst({ where: { id: planId, isActive: true } });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    // Remember the intended plan so the admin panel shows what the workshop
    // actually asked for when confirming the payment.
    const withPlan = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { planId: plan.id },
    });

    return this.providers.get(withPlan.provider).createCheckout({ subscription: withPlan, plan, userId });
  }
}

export function toPlanView(plan: Plan): PlanView {
  return {
    id: plan.id,
    slug: plan.slug,
    name: plan.name,
    description: plan.description,
    priceCents: plan.priceCents,
    currency: plan.currency,
    interval: plan.interval,
    features: plan.features,
    maxUsers: plan.maxUsers,
  };
}

export function toSubscriptionView(subscription: Subscription, plan: Plan | null): SubscriptionView {
  return {
    features: featuresForSubscription({ status: subscription.status, plan }),
    id: subscription.id,
    status: subscription.status,
    trialEndsAt: subscription.trialEndsAt?.toISOString() ?? null,
    currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
    cancelledAt: subscription.cancelledAt?.toISOString() ?? null,
    provider: subscription.provider,
    plan: plan ? toPlanView(plan) : null,
    daysRemaining: daysRemaining(subscription),
    hasAccess: hasAccess(subscription),
  };
}
