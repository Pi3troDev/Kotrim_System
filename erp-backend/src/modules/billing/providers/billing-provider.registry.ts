import { Injectable, Inject, NotImplementedException } from '@nestjs/common';
import { BillingProvider } from '@prisma/client';
import { BILLING_PROVIDERS, BillingProviderAdapter } from './billing-provider.interface';

/**
 * Resolves a `BillingProvider` enum value to the adapter that implements it.
 *
 * Adding Stripe later is: write `StripeBillingProvider implements
 * BillingProviderAdapter`, add it to the `BILLING_PROVIDERS` array in
 * `BillingModule`. Nothing else in the codebase changes — that is the whole
 * point of this indirection.
 */
@Injectable()
export class BillingProviderRegistry {
  private readonly adapters: Map<BillingProvider, BillingProviderAdapter>;

  constructor(@Inject(BILLING_PROVIDERS) adapters: BillingProviderAdapter[]) {
    this.adapters = new Map(adapters.map((adapter) => [adapter.key, adapter]));
  }

  get(key: BillingProvider): BillingProviderAdapter {
    const adapter = this.adapters.get(key);
    if (!adapter) {
      throw new NotImplementedException(`Billing provider "${key}" is not implemented yet.`);
    }
    return adapter;
  }

  /** Which gateways are actually wired up right now. */
  available(): BillingProvider[] {
    return [...this.adapters.keys()];
  }
}
