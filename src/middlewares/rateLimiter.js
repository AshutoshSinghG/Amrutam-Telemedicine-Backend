import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';
import { TooManyRequestsError } from './errorHandler.js';

// General API rate limiter
export const apiLimiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX_REQUESTS,
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        next(new TooManyRequestsError('Rate limit exceeded'));
    },
});

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: config.AUTH_RATE_LIMIT_MAX,
    message: 'Too many authentication attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    handler: (req, res, next) => {
        next(new TooManyRequestsError('Too many authentication attempts'));
    },
});

// Booking rate limiter to prevent abuse
export const bookingLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    message: 'Too many booking attempts, please slow down',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        next(new TooManyRequestsError('Too many booking attempts'));
    },
});
