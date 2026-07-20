import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { PlansController } from './plans.controller';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionAccessService } from './subscription-access.service';
import { BILLING_PROVIDERS, BillingProviderAdapter } from './providers/billing-provider.interface';
import { BillingProviderRegistry } from './providers/billing-provider.registry';
import { ManualBillingProvider } from './providers/manual-billing.provider';

@Module({
  controllers: [PlansController, SubscriptionsController],
  providers: [
    BillingService,
    SubscriptionAccessService,
    BillingProviderRegistry,
    ManualBillingProvider,
    {
      // The one place that knows which gateways exist. Adding Stripe is:
      // write the provider class, list it here, done.
      provide: BILLING_PROVIDERS,
      useFactory: (manual: ManualBillingProvider): BillingProviderAdapter[] => [manual],
      inject: [ManualBillingProvider],
    },
  ],
  // SubscriptionAccessService is exported for the globally-registered
  // SubscriptionGuard; the other two for the admin module.
  exports: [SubscriptionAccessService, BillingService, BillingProviderRegistry],
})
export class BillingModule {}
