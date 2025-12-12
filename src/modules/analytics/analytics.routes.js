import express from 'express';
import analyticsController from './analytics.controller.js';
import { authenticate } from '../../middlewares/authMiddleware.js';
import { requireRole } from '../../middlewares/rbacMiddleware.js';

const router = express.Router();

// All analytics routes are admin-only
router.get('/summary', authenticate, requireRole('ADMIN'), analyticsController.getSummary);
router.get(
    '/consultations-per-day',
    authenticate,
    requireRole('ADMIN'),
    analyticsController.getConsultationsPerDay
);
router.get(
    '/conversion-rate',
    authenticate,
    requireRole('ADMIN'),
    analyticsController.getConversionRate
);
router.get(
    '/doctor-utilization',
    authenticate,
    requireRole('ADMIN'),
    analyticsController.getDoctorUtilization
);
router.get(
    '/top-specializations',
    authenticate,
    requireRole('ADMIN'),
    analyticsController.getTopSpecializations
);

export default router;
