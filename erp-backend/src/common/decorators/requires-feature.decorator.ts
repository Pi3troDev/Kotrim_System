import { SetMetadata } from '@nestjs/common';
import { PlanFeature } from '../../modules/billing/plan-features';

export const REQUIRES_FEATURE_KEY = 'requiresFeature';

/**
 * Restricts a route (or a whole controller) to companies whose plan includes
 * the given feature. Enforced by the globally-registered `PlanFeatureGuard`.
 *
 * Distinct from `@Roles()` (which role inside a workshop) and from
 * `SubscriptionGuard` (is the subscription paid at all). This one answers
 * "did they buy this module?".
 */
export const RequiresFeature = (feature: PlanFeature): MethodDecorator & ClassDecorator =>
  SetMetadata(REQUIRES_FEATURE_KEY, feature);
