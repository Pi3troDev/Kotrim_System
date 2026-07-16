declare const SETTABLE_STATUSES: readonly ["PENDING", "CANCELLED"];
export type SettableIncomeStatus = (typeof SETTABLE_STATUSES)[number];
export declare class UpdateIncomeStatusDto {
    status: SettableIncomeStatus;
}
export {};
