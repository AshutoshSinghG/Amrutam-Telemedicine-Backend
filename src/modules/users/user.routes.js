import express from 'express';
import userController from './user.controller.js';
import { authenticate } from '../../middlewares/authMiddleware.js';
import { requireRole } from '../../middlewares/rbacMiddleware.js';

const router = express.Router();

// User profile routes
router.get('/me', authenticate, userController.getProfile);
router.patch('/me', authenticate, userController.updateProfile);

// Admin routes
router.get('/', authenticate, requireRole('ADMIN'), userController.listUsers);
router.patch('/:id/role', authenticate, requireRole('ADMIN'), userController.updateUserRole);
router.patch('/:id/disable', authenticate, requireRole('ADMIN'), userController.disableUser);

export default router;
