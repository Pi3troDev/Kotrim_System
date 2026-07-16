/** Parses a "YYYY-MM-DD" date-only string as local midnight, not UTC midnight (avoids off-by-one-day shifts). */
export function parseLocalDate(dateOnly: string): Date {
  const [year, month, day] = dateOnly.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Start of the current local day — the correct boundary for "is this due date overdue yet?" checks. */
export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Adds calendar months to a date, clamping the day so it never overflows into
 * a later month (e.g. Jan 31 + 1 month -> Feb 28, not Mar 3).
 */
export function addMonthsClamped(date: Date, months: number): Date {
  const targetMonthIndex = date.getMonth() + months;
  const lastDayOfTargetMonth = new Date(date.getFullYear(), targetMonthIndex + 1, 0).getDate();
  const day = Math.min(date.getDate(), lastDayOfTargetMonth);
  return new Date(date.getFullYear(), targetMonthIndex, day);
}

/** Adds a whole number of days to a date (weeks are just 7x this — no month/year rollover subtlety involved). */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Adds calendar weeks to a date. */
export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

/**
 * Adds calendar years to a date, clamping the day for the Feb 29 -> Feb 28
 * case in non-leap target years (same rationale as addMonthsClamped).
 */
export function addYearsClamped(date: Date, years: number): Date {
  const targetYear = date.getFullYear() + years;
  const lastDayOfTargetMonth = new Date(targetYear, date.getMonth() + 1, 0).getDate();
  const day = Math.min(date.getDate(), lastDayOfTargetMonth);
  return new Date(targetYear, date.getMonth(), day);
}

export type RecurrenceFrequency = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

/** Dispatches to the right interval-add helper for a recurrence frequency. */
export function addInterval(date: Date, frequency: RecurrenceFrequency, count = 1): Date {
  if (frequency === 'WEEKLY') return addWeeks(date, count);
  if (frequency === 'YEARLY') return addYearsClamped(date, count);
  return addMonthsClamped(date, count);
}
