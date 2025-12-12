import { parsePaginationParams, createPaginationMeta, paginatedResponse } from '../../src/utils/pagination.js';

describe('Pagination Utils', () => {
    describe('parsePaginationParams', () => {
        it('should parse valid pagination params', () => {
            const query = { page: '2', limit: '10' };
            const result = parsePaginationParams(query);

            expect(result.page).toBe(2);
            expect(result.limit).toBe(10);
            expect(result.skip).toBe(10);
        });

        it('should use defaults for missing params', () => {
            const query = {};
            const result = parsePaginationParams(query);

            expect(result.page).toBe(1);
            expect(result.limit).toBe(20);
            expect(result.skip).toBe(0);
        });

        it('should enforce max limit', () => {
            const query = { limit: '200' };
            const result = parsePaginationParams(query);

            expect(result.limit).toBe(100);
        });
    });

    describe('createPaginationMeta', () => {
        it('should create correct pagination metadata', () => {
            const meta = createPaginationMeta(2, 10, 45);

            expect(meta.page).toBe(2);
            expect(meta.limit).toBe(10);
            expect(meta.total).toBe(45);
            expect(meta.totalPages).toBe(5);
            expect(meta.hasNext).toBe(true);
            expect(meta.hasPrev).toBe(true);
        });

        it('should handle first page correctly', () => {
            const meta = createPaginationMeta(1, 10, 45);

            expect(meta.hasPrev).toBe(false);
            expect(meta.hasNext).toBe(true);
        });

        it('should handle last page correctly', () => {
            const meta = createPaginationMeta(5, 10, 45);

            expect(meta.hasPrev).toBe(true);
            expect(meta.hasNext).toBe(false);
        });
    });

    describe('paginatedResponse', () => {
        it('should create paginated response', () => {
            const data = [{ id: 1 }, { id: 2 }];
            const response = paginatedResponse(data, 1, 10, 25);

            expect(response.data).toEqual(data);
            expect(response.pagination).toBeDefined();
            expect(response.pagination.total).toBe(25);
        });
    });
});
