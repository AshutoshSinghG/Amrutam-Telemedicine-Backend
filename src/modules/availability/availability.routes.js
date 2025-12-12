import express from 'express';
import availabilityController from './availability.controller.js';
import { authenticate, optionalAuthenticate } from '../../middlewares/authMiddleware.js';
import { requireRole } from '../../middlewares/rbacMiddleware.js';

const router = express.Router();

// Doctor routes
router.post('/', authenticate, requireRole('DOCTOR'), availabilityController.createSlot);
router.patch('/:id', authenticate, requireRole('DOCTOR'), availabilityController.updateSlot);
router.delete('/:id', authenticate, requireRole('DOCTOR'), availabilityController.deleteSlot);

// Public/authenticated routes
router.get('/doctor/:doctorId', optionalAuthenticate, availabilityController.getAvailableSlots);

export default router;
