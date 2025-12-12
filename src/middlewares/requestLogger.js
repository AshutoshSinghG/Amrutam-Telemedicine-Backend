import pinoHttp from 'pino-http';
import { logger } from '../config/logger.js';
import crypto from 'crypto';

// Generate correlation ID for request tracking
const generateCorrelationId = () => {
    return crypto.randomUUID();
};

export const requestLogger = pinoHttp({
    logger,
    genReqId: (req) => {
        // Use existing correlation ID from header or generate new one
        return req.headers['x-correlation-id'] || generateCorrelationId();
    },
    customLogLevel: (req, res, err) => {
        if (res.statusCode >= 500 || err) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
    },
    customSuccessMessage: (req, res) => {
        return `${req.method} ${req.url} ${res.statusCode}`;
    },
    customErrorMessage: (req, res, err) => {
        return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
    },
    customAttributeKeys: {
        req: 'request',
        res: 'response',
        err: 'error',
        responseTime: 'duration',
    },
    serializers: {
        req: (req) => ({
            id: req.id,
            method: req.method,
            url: req.url,
            query: req.query,
            params: req.params,
            headers: {
                host: req.headers.host,
                'user-agent': req.headers['user-agent'],
            },
            remoteAddress: req.remoteAddress,
            remotePort: req.remotePort,
        }),
        res: (res) => ({
            statusCode: res.statusCode,
        }),
    },
    // Add correlation ID to response headers
    customReceivedMessage: (req) => {
        return `Request received: ${req.method} ${req.url}`;
    },
});

// Middleware to attach correlation ID to response
export const attachCorrelationId = (req, res, next) => {
    res.setHeader('X-Correlation-ID', req.id);
    next();
};
