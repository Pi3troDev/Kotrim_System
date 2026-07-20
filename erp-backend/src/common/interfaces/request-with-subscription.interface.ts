import { Request } from 'express';
import { SubscriptionWithPlan } from '../../modules/billing/subscription-access.service';
import { AuthenticatedUser } from './authenticated-user.interface';

/**
 * `SubscriptionGuard` stashes the subscription it resolved here so
 * `PlanFeatureGuard`, which runs right after it, does not repeat the same
 * query on every single request.
 */
export interface RequestWithSubscription extends Request {
  user?: AuthenticatedUser;
  resolvedSubscription?: SubscriptionWithPlan | null;
}
