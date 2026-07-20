import { SetMetadata } from '@nestjs/common';

export const SKIP_SUBSCRIPTION_KEY = 'skipSubscription';

/**
 * Exempts a route from `SubscriptionGuard`.
 *
 * Reserved for the routes a locked-out company still needs: seeing its own
 * subscription, paying for it, and reading its profile. Everything else in the
 * ERP is behind an active subscription by default.
 */
export const SkipSubscription = (): MethodDecorator & ClassDecorator =>
  SetMetadata(SKIP_SUBSCRIPTION_KEY, true);
