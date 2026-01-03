/**
 * Standard pagination query parameters
 */
export interface PaginationQuery {
    page?: number;
    limit?: number;
}

/**
 * Standard paginated response envelope
 */
export interface PaginatedResult<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

/**
 * Default pagination values
 */
export const PAGINATION_DEFAULTS = {
    page: 1,
    limit: 20,
    maxLimit: 100,
};
