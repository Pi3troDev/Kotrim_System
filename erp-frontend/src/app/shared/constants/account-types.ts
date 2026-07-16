export type AccountType = 'BANK' | 'CASH' | 'DIGITAL_WALLET' | 'CREDIT_CARD' | 'OTHER';

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  BANK: 'Banco',
  CASH: 'Caixa físico',
  DIGITAL_WALLET: 'Carteira digital',
  CREDIT_CARD: 'Cartão de crédito',
  OTHER: 'Outro',
};

export const ACCOUNT_TYPES = Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[];
