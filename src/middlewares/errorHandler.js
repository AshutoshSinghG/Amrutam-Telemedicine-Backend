// Custom error classes for better error handling

export class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message, errors = []) {
        super(message, 400);
        this.errors = errors;
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403);
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404);
    }
}

export class ConflictError extends AppError {
    constructor(message = 'Resource conflict') {
        super(message, 409);
    }
}

export class TooManyRequestsError extends AppError {
    constructor(message = 'Too many requests') {
        super(message, 429);
    }
}

// Global error handler middleware
export const errorHandler = (err, req, res, next) => {
    const logger = req.log || console;

    // Default error values
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal server error';
    let errors = err.errors || undefined;

    // Handle Prisma errors
    if (err.code === 'P2002') {
        statusCode = 409;
        message = 'Resource already exists';
    } else if (err.code === 'P2025') {
        statusCode = 404;
        message = 'Resource not found';
    } else if (err.code?.startsWith('P')) {
        statusCode = 400;
        message = 'Database operation failed';
    }

    // Handle Zod validation errors
    if (err.name === 'ZodError') {
        statusCode = 400;
        message = 'Validation failed';
        errors = err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));
    }

    // Log error
    if (statusCode >= 500) {
        logger.error({ err, req: { method: req.method, url: req.url } }, 'Server error');
    } else {
        logger.warn({ err, req: { method: req.method, url: req.url } }, 'Client error');
    }

    // Send error response
    const response = {
        success: false,
        message,
        ...(errors && { errors }),
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
        }),
    };

    res.status(statusCode).json(response);
};

// 404 handler
export const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} not found`,
    });
};
