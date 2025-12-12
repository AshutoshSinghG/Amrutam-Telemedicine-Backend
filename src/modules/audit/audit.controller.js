import auditService from './audit.service.js';

class AuditController {
    async getAuditLogs(req, res, next) {
        try {
            const result = await auditService.getAuditLogs(req.query);
            res.status(200).json({
                success: true,
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new AuditController();
