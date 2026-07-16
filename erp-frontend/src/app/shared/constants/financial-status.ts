export interface FinancialStatusMeta {
  label: string;
  colorVar: string;
}

export const FINANCIAL_STATUS_META: Record<string, FinancialStatusMeta> = {
  PENDING: { label: 'Pendente', colorVar: '--chart-3' },
  OVERDUE: { label: 'Vencido', colorVar: '--chart-8' },
  PARTIALLY_PAID: { label: 'Parcialmente pago', colorVar: '--chart-4' },
  PAID: { label: 'Pago', colorVar: '--chart-6' },
  CANCELLED: { label: 'Cancelado', colorVar: '--text-tertiary' },
};
