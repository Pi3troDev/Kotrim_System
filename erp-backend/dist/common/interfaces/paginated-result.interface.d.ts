export interface PaginatedResult<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
export declare function paginate<T>(data: T[], total: number, page: number, limit: number): PaginatedResult<T>;
