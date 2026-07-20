import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionAccessService } from '../../modules/billing/subscription-access.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SKIP_SUBSCRIPTION_KEY } from '../decorators/skip-subscription.decorator';
import { RequestWithSubscription } from '../interfaces/request-with-subscription.interface';

/**
 * Registered globally (see app.module.ts), after JwtAuthGuard so `request.user`
 * is already populated. Locks the whole ERP once a company's trial lapses or
 * its subscription stops being ACTIVE.
 *
 * Responds **402 Payment Required** rather than 403: the frontend interceptor
 * needs to tell "you must pay" apart from "you lack permission", and 402 says
 * exactly that without inventing a convention.
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly access: SubscriptionAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const exempt = this.reflector.getAllAndOverride<boolean>(SKIP_SUBSCRIPTION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (exempt) {
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

    // No authenticated user means JwtAuthGuard already rejected this request,
    // or the route is unauthenticated in a way we do not gate on billing.
    if (!user) {
      return true;
    }

    // Kotrim staff are not customers — they must reach the admin panel even
    // when the company they are inspecting is expired.
    if (user.isSuperAdmin) {
      return true;
    }

    const { allowed, subscription } = await this.access.resolve(user.companyId);

    // Handed to PlanFeatureGuard, which runs next and would otherwise repeat
    // this exact query on every request.
    request.resolvedSubscription = subscription;

    if (allowed) {
      return true;
    }

    throw new HttpException(
      {
        statusCode: HttpStatus.PAYMENT_REQUIRED,
        error: 'SUBSCRIPTION_REQUIRED',
        message: 'Sua assinatura não está ativa. Escolha um plano para continuar usando o Kotrim.',
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}
