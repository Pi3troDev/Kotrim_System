export type RecurrenceFrequency = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export const RECURRENCE_FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensal',
  YEARLY: 'Anual',
};

export const RECURRENCE_FREQUENCIES = Object.keys(RECURRENCE_FREQUENCY_LABELS) as RecurrenceFrequency[];
