import { ForbiddenError, UnauthorizedError } from './errorHandler.js';

// Middleware factory to check if user has required role
export const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw new UnauthorizedError('Authentication required');
            }

            const userRole = req.user.role;

            if (!allowedRoles.includes(userRole)) {
                throw new ForbiddenError('Insufficient permissions');
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

// Middleware to enforce MFA for admin accounts
export const requireMFA = (req, res, next) => {
    try {
        if (!req.user) {
            throw new UnauthorizedError('Authentication required');
        }

        // MFA is mandatory for ADMIN role
        if (req.user.role === 'ADMIN' && !req.user.mfaVerified) {
            throw new ForbiddenError('MFA verification required for admin access');
        }

        next();
    } catch (error) {
        next(error);
    }
};

// Combined middleware for role + MFA check
export const requireRoleWithMFA = (...allowedRoles) => {
    return [requireRole(...allowedRoles), requireMFA];
};
