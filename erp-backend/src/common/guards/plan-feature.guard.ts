import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlanFeature, featuresForSubscription } from '../../modules/billing/plan-features';
import { SubscriptionAccessService } from '../../modules/billing/subscription-access.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { REQUIRES_FEATURE_KEY } from '../decorators/requires-feature.decorator';
import { RequestWithSubscription } from '../interfaces/request-with-subscription.interface';

/**
 * Enforces `@RequiresFeature()`. Registered globally, after SubscriptionGuard,
 * so a controller that forgets to wire a guard is still covered by the
 * decorator alone.
 *
 * Answers **403 / PLAN_UPGRADE_REQUIRED** — deliberately distinct from
 * SubscriptionGuard's 402: "your plan does not include this" and "your
 * subscription is not paid" need different screens, and a shared status code
 * would force the frontend to guess.
 */
@Injectable()
export class PlanFeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly access: SubscriptionAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<PlanFeature>(REQUIRES_FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithSubscription>();
    const user = request.user;
    if (!user) {
      return true;
    }

    // Kotrim staff see everything, same as in SubscriptionGuard.
    if (user.isSuperAdmin) {
      return true;
    }

    const subscription =
      request.resolvedSubscription !== undefined
        ? request.resolvedSubscription
        : (await this.access.resolve(user.companyId)).subscription;

    if (featuresForSubscription(subscription).includes(required)) {
      return true;
    }

    throw new ForbiddenException({
      statusCode: 403,
      error: 'PLAN_UPGRADE_REQUIRED',
      feature: required,
      message: 'Este módulo não está incluído no seu plano. Faça upgrade para liberar o acesso.',
    });
  }
}
