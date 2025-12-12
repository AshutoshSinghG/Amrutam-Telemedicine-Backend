import { prisma } from '../../config/database.js';
import { parsePaginationParams, paginatedResponse } from '../../utils/pagination.js';

class AuditService {
    async logAction(data) {
        const { actorId, actorRole, action, entityType, entityId, metadata, ipAddress } = data;

        const log = await prisma.auditLog.create({
            data: {
                actorId,
                actorRole,
                action,
                entityType,
                entityId,
                metadata,
                ipAddress,
            },
        });

        return log;
    }

    async getAuditLogs(query) {
        const { page, limit, skip } = parsePaginationParams(query);
        const { actorId, action, entityType, startDate, endDate } = query;

        const where = {
            ...(actorId && { actorId }),
            ...(action && { action: { contains: action, mode: 'insensitive' } }),
            ...(entityType && { entityType }),
            ...(startDate &&
                endDate && {
                createdAt: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            }),
        };

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                include: {
                    actor: {
                        include: { profile: true },
                    },
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.auditLog.count({ where }),
        ]);

        return paginatedResponse(logs, page, limit, total);
    }
}

export default new AuditService();
