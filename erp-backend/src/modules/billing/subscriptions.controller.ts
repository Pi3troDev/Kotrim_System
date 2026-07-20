import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SkipSubscription } from '../../common/decorators/skip-subscription.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { BillingService } from './billing.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { SubscriptionView } from './interfaces/billing.interfaces';
import { CheckoutResult } from './providers/billing-provider.interface';

/**
 * Every route here is @SkipSubscription: a company whose trial ran out is
 * locked out of the ERP precisely so it can come here and pay. Guarding these
 * behind an active subscription would be a deadlock.
 */
@ApiTags('billing')
@Controller('subscriptions')
@SkipSubscription()
export class SubscriptionsController {
  constructor(private readonly billingService: BillingService) {}

  @Get('me')
  @ApiOperation({ summary: "Get the current company's subscription" })
  getMine(@CurrentUser() user: AuthenticatedUser): Promise<SubscriptionView> {
    return this.billingService.getMySubscription(user.companyId);
  }

  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start a purchase for a plan (manual billing returns payment instructions)' })
  checkout(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCheckoutDto): Promise<CheckoutResult> {
    return this.billingService.createCheckout(user.companyId, user.id, dto.planId);
  }
}
