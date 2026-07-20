import { Injectable, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BillingProvider, Subscription, SubscriptionPaymentStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import {
  BillingProviderAdapter,
  CheckoutInput,
  CheckoutResult,
  WebhookResult,
} from './billing-provider.interface';

/**
 * Billing as it works in this first version: the workshop pays by Pix (or
 * whatever the administrator arranges) and a Kotrim super-admin confirms it in
 * the admin panel, which is what actually flips the subscription to ACTIVE.
 *
 * This provider's only job is to record the *intent* to pay and hand back
 * instructions. It deliberately does not activate anything — activation stays
 * in `AdminService`, exactly where a gateway webhook would eventually call.
 */
@Injectable()
export class ManualBillingProvider implements BillingProviderAdapter {
  readonly key = BillingProvider.MANUAL;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const pixKey = this.configService.get<string>('billing.pixKey') || null;
    const contact = this.configService.get<string>('billing.contact') || null;

    const payment = await this.prisma.subscriptionPayment.create({
      data: {
        subscriptionId: input.subscription.id,
        amountCents: input.plan.priceCents,
        currency: input.plan.currency,
        status: SubscriptionPaymentStatus.PENDING,
        provider: BillingProvider.MANUAL,
        method: 'PIX',
        notes: `Checkout manual do plano "${input.plan.name}".`,
      },
    });

    // The customer is now holding a Pix key on screen; the same instructions go
    // to their inbox, because nobody pays a Pix from a browser tab they are
    // about to close.
    const user = await this.prisma.user.findUnique({
      where: { id: input.userId },
      select: { id: true, email: true, name: true, companyId: true },
    });

    if (user) {
      this.mailService.orderPending(
        { email: user.email, name: user.name, userId: user.id, companyId: user.companyId },
        { name: user.name, planName: input.plan.name, amountCents: input.plan.priceCents },
      );
    }

    return {
      kind: 'manual_instructions',
      paymentId: payment.id,
      amountCents: input.plan.priceCents,
      currency: input.plan.currency,
      instructions: this.buildInstructions(input.plan.name, pixKey, contact),
      pixKey,
      contact,
    };
  }

  /**
   * Nothing to call: a manual subscription has no gateway holding a recurring
   * charge. `AdminService` marks the row CANCELLED and that is the whole truth.
   */
  async cancelSubscription(_subscription: Subscription): Promise<void> {
    return;
  }

  handleWebhook(_payload: unknown, _signature?: string): Promise<WebhookResult> {
    throw new NotImplementedException('Manual billing has no webhook — payments are confirmed in the admin panel.');
  }

  private buildInstructions(planName: string, pixKey: string | null, contact: string | null): string[] {
    const steps = [`Faça o pagamento referente ao plano "${planName}".`];

    if (pixKey) {
      steps.push(`Pague via Pix para a chave: ${pixKey}`);
    } else {
      steps.push('Entre em contato com o administrador para receber os dados de pagamento.');
    }

    if (contact) {
      steps.push(`Envie o comprovante para: ${contact}`);
    }

    steps.push('Assim que o pagamento for confirmado, sua assinatura será ativada e o acesso liberado.');

    return steps;
  }
}
