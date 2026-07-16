declare const SETTABLE_STATUSES: readonly ["PENDING", "CANCELLED"];
export type SettableExpenseStatus = (typeof SETTABLE_STATUSES)[number];
export declare class UpdateExpenseStatusDto {
    status: SettableExpenseStatus;
}
export {};
