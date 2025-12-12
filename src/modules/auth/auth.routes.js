import express from 'express';
import authController from './auth.controller.js';
import { authenticate } from '../../middlewares/authMiddleware.js';
import { authLimiter } from '../../middlewares/rateLimiter.js';
import {
    validate,
    signupSchema,
    loginSchema,
    verifyEmailSchema,
    requestPasswordResetSchema,
    resetPasswordSchema,
    enableMFASchema,
    verifyMFASchema,
    refreshTokenSchema,
} from './auth.validators.js';

const router = express.Router();

// Public routes with rate limiting
router.post('/signup', authLimiter, validate(signupSchema), authController.signup);

router.post('/login', authLimiter, validate(loginSchema), authController.login);

router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);

router.post(
    '/request-password-reset',
    authLimiter,
    validate(requestPasswordResetSchema),
    authController.requestPasswordReset
);

router.post(
    '/reset-password',
    authLimiter,
    validate(resetPasswordSchema),
    authController.resetPassword
);

router.post('/verify-mfa', authLimiter, validate(verifyMFASchema), authController.verifyMFA);

router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);

// Protected routes
router.post(
    '/enable-mfa',
    authenticate,
    validate(enableMFASchema),
    authController.enableMFA
);

router.post(
    '/complete-mfa-setup',
    authenticate,
    validate(verifyMFASchema),
    authController.completeMFASetup
);

export default router;
