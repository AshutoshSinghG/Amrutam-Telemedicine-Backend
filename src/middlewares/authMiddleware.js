import { verifyAccessToken } from '../utils/crypto.js';
import { UnauthorizedError } from './errorHandler.js';

// Middleware to verify JWT token and attach user to request
export const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('No token provided');
        }

        const token = authHeader.substring(7);
        const payload = verifyAccessToken(token);

        if (!payload) {
            throw new UnauthorizedError('Invalid or expired token');
        }

        // Attach user info to request
        req.user = {
            id: payload.userId,
            email: payload.email,
            role: payload.role,
            mfaVerified: payload.mfaVerified || false,
        };

        next();
    } catch (error) {
        next(error);
    }
};

// Optional authentication - doesn't fail if no token
export const optionalAuthenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const payload = verifyAccessToken(token);

            if (payload) {
                req.user = {
                    id: payload.userId,
                    email: payload.email,
                    role: payload.role,
                    mfaVerified: payload.mfaVerified || false,
                };
            }
        }

        next();
    } catch (error) {
        // Ignore authentication errors for optional auth
        next();
    }
};
