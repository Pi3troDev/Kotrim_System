import { StatusMeta } from './work-order-status';

export const APPOINTMENT_STATUS_META: Record<string, StatusMeta> = {
  SCHEDULED: { label: 'Agendado', colorVar: '--chart-1' },
  CONFIRMED: { label: 'Confirmado', colorVar: '--chart-2' },
  IN_PROGRESS: { label: 'Em andamento', colorVar: '--chart-4' },
  COMPLETED: { label: 'Concluído', colorVar: '--chart-6' },
  CANCELLED: { label: 'Cancelado', colorVar: '--chart-8' },
  NO_SHOW: { label: 'Não compareceu', colorVar: '--chart-5' },
};
