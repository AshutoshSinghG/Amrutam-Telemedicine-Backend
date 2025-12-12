import express from 'express';
import prescriptionController from './prescription.controller.js';
import { authenticate } from '../../middlewares/authMiddleware.js';
import { requireRole } from '../../middlewares/rbacMiddleware.js';

const router = express.Router();

// Doctor routes
router.post('/', authenticate, requireRole('DOCTOR'), prescriptionController.createPrescription);

// Shared routes (patient, doctor, admin can view)
router.get(
    '/consultation/:consultationId',
    authenticate,
    prescriptionController.getPrescriptionByConsultation
);

export default router;
