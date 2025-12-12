import express from 'express';
import auditController from './audit.controller.js';
import { authenticate } from '../../middlewares/authMiddleware.js';
import { requireRole } from '../../middlewares/rbacMiddleware.js';

const router = express.Router();

// Admin-only route
router.get('/', authenticate, requireRole('ADMIN'), auditController.getAuditLogs);

export default router;
