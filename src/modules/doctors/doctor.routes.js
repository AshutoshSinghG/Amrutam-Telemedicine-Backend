import express from 'express';
import doctorController from './doctor.controller.js';
import { authenticate, optionalAuthenticate } from '../../middlewares/authMiddleware.js';
import { requireRole } from '../../middlewares/rbacMiddleware.js';

const router = express.Router();

// Public/authenticated routes
router.get('/', optionalAuthenticate, doctorController.searchDoctors);
router.get('/:id', optionalAuthenticate, doctorController.getDoctor);

// Doctor routes
router.post('/', authenticate, requireRole('DOCTOR'), doctorController.registerDoctor);
router.patch('/:id', authenticate, requireRole('DOCTOR'), doctorController.updateDoctor);

// Admin routes
router.patch('/:id/approve', authenticate, requireRole('ADMIN'), doctorController.approveDoctor);

export default router;
