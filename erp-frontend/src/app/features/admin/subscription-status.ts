import { SubscriptionStatus } from '../subscription/interfaces/subscription.interfaces';

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  PENDING: 'Aguardando pagamento',
  TRIAL: 'Teste',
  ACTIVE: 'Ativa',
  EXPIRED: 'Expirada',
  CANCELLED: 'Cancelada',
};

/** null means the company has no subscription row — not a status of its own. */
export function subscriptionStatusLabel(status: SubscriptionStatus | null): string {
  return status === null ? 'Sem assinatura' : (SUBSCRIPTION_STATUS_LABELS[status] ?? status);
}
