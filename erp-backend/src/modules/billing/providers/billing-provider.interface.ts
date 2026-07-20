import { BillingProvider, Plan, Subscription } from '@prisma/client';

/**
 * The contract every billing gateway implements. Today only
 * `ManualBillingProvider` exists (Pix/Mercado Pago confirmed by hand in the
 * admin panel), but Stripe/Mercado Pago/Asaas plug in here without any caller
 * changing: `BillingService` only ever talks to this interface.
 */
export interface BillingProviderAdapter {
  readonly key: BillingProvider;

  /**
   * Starts a purchase. Manual billing returns instructions for the workshop to
   * pay by hand; a real gateway returns a URL to redirect to. Both shapes are
   * already part of `CheckoutResult`, so the frontend handles a future gateway
   * without a rewrite.
   */
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;

  /** Revokes access at the gateway. Manual billing has nothing to call. */
  cancelSubscription(subscription: Subscription): Promise<void>;

  /**
   * Confirms a payment from a gateway callback. Manual billing has no webhook —
   * confirmation happens in the admin panel — so it throws.
   */
  handleWebhook(payload: unknown, signature?: string): Promise<WebhookResult>;
}

export interface CheckoutInput {
  subscription: Subscription;
  plan: Plan;
  /** The user who initiated the checkout, for audit and gateway customer data. */
  userId: string;
}

/**
 * Discriminated union rather than an optional-URL bag: a manual checkout and a
 * gateway redirect have genuinely different payloads, and making the caller
 * switch on `kind` means adding a gateway can't silently produce a half-filled
 * response that the UI renders as blank.
 */
export type CheckoutResult =
  | {
      kind: 'manual_instructions';
      paymentId: string;
      amountCents: number;
      currency: string;
      /** Human-readable, ordered steps rendered as a list in the UI. */
      instructions: string[];
      pixKey: string | null;
      contact: string | null;
    }
  | {
      kind: 'redirect';
      paymentId: string;
      url: string;
    };

export interface WebhookResult {
  /** The provider's payment identifier, used to reconcile our own row. */
  providerPaymentId: string;
  status: 'CONFIRMED' | 'FAILED' | 'REFUNDED';
}

/** DI token for the provider registry map. */
export const BILLING_PROVIDERS = Symbol('BILLING_PROVIDERS');
