// Pagination utilities for consistent API responses

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export const parsePaginationParams = (query) => {
    const page = Math.max(1, parseInt(query.page) || DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit) || DEFAULT_LIMIT));
    const skip = (page - 1) * limit;

    return { page, limit, skip };
};

export const createPaginationMeta = (page, limit, total) => {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
    };
};

export const paginatedResponse = (data, page, limit, total) => {
    return {
        data,
        pagination: createPaginationMeta(page, limit, total),
    };
};
