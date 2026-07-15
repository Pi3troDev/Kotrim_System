export interface StatusMeta {
  label: string;
  colorVar: string;
}

/** Fixed order — mirrors the backend's STATUS_ORDER and the chart-1..8 slot order. */
export const WORK_ORDER_STATUS_META: Record<string, StatusMeta> = {
  OPEN: { label: 'Aberta', colorVar: '--chart-1' },
  IN_DIAGNOSIS: { label: 'Em diagnóstico', colorVar: '--chart-2' },
  WAITING_APPROVAL: { label: 'Aguardando aprovação', colorVar: '--chart-3' },
  IN_PROGRESS: { label: 'Em execução', colorVar: '--chart-4' },
  WAITING_PARTS: { label: 'Aguardando peças', colorVar: '--chart-5' },
  COMPLETED: { label: 'Concluída', colorVar: '--chart-6' },
  DELIVERED: { label: 'Entregue', colorVar: '--chart-7' },
  CANCELLED: { label: 'Cancelada', colorVar: '--chart-8' },
};
