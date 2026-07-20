import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ALL_FEATURES, PlanFeature, featuresForSubscription } from '../../modules/billing/plan-features';
import { RequestWithSubscription } from '../interfaces/request-with-subscription.interface';

/**
 * The features the calling company may use.
 *
 * For routes gated wholesale, prefer `@RequiresFeature()` — it is declarative
 * and enforced by a guard. This decorator is for the handful of endpoints whose
 * access depends on the *payload*, not the route: Categories, where the same
 * endpoint serves stock categories (INVENTORY) and financial ones (FINANCE).
 *
 * Reads the subscription SubscriptionGuard already resolved, so it costs no
 * extra query.
 */
export const PlanFeatures = createParamDecorator((_data: unknown, ctx: ExecutionContext): PlanFeature[] => {
  const request = ctx.switchToHttp().getRequest<RequestWithSubscription>();

  if (request.user?.isSuperAdmin) {
    return [...ALL_FEATURES];
  }

  return featuresForSubscription(request.resolvedSubscription ?? null);
});
