import express from 'express';
import consultationController from './consultation.controller.js';
import { authenticate } from '../../middlewares/authMiddleware.js';
import { requireRole } from '../../middlewares/rbacMiddleware.js';
import { idempotencyMiddleware } from '../../middlewares/idempotencyMiddleware.js';
import { bookingLimiter } from '../../middlewares/rateLimiter.js';

const router = express.Router();

// Patient routes
router.post(
    '/',
    authenticate,
    requireRole('PATIENT'),
    bookingLimiter,
    idempotencyMiddleware,
    consultationController.bookConsultation
);

router.get('/me', authenticate, requireRole('PATIENT'), consultationController.getMyConsultations);

// Doctor routes
router.get(
    '/doctor/me',
    authenticate,
    requireRole('DOCTOR'),
    consultationController.getDoctorConsultations
);

router.patch(
    '/:id/status',
    authenticate,
    requireRole('DOCTOR'),
    consultationController.updateStatus
);

// Shared routes
router.get('/:id', authenticate, consultationController.getConsultation);
router.post('/:id/cancel', authenticate, consultationController.cancelConsultation);

export default router;
