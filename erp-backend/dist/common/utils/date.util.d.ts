export declare function parseLocalDate(dateOnly: string): Date;
export declare function startOfToday(): Date;
export declare function addMonthsClamped(date: Date, months: number): Date;
export declare function addDays(date: Date, days: number): Date;
export declare function addWeeks(date: Date, weeks: number): Date;
export declare function addYearsClamped(date: Date, years: number): Date;
export type RecurrenceFrequency = 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export declare function addInterval(date: Date, frequency: RecurrenceFrequency, count?: number): Date;
