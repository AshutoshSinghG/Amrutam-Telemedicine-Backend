import express from 'express';
import paymentController from './payment.controller.js';
import { authenticate } from '../../middlewares/authMiddleware.js';

const router = express.Router();

// Authenticated routes
router.post('/initiate', authenticate, paymentController.initiatePayment);
router.get('/consultation/:consultationId', authenticate, paymentController.getPaymentByConsultation);

// Webhook (no auth - would verify signature in production)
router.post('/webhook', paymentController.handleWebhook);

export default router;
