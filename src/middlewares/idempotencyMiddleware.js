import { prisma } from '../config/database.js';
import { hashRequest } from '../utils/crypto.js';
import { config } from '../config/env.js';
import { addHours } from '../utils/time.js';

// Middleware to handle idempotent requests
export const idempotencyMiddleware = async (req, res, next) => {
    try {
        const idempotencyKey = req.headers['idempotency-key'];

        // Skip if no idempotency key provided
        if (!idempotencyKey) {
            return next();
        }

        // Only apply to write operations
        if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
            return next();
        }

        const userId = req.user?.id || null;
        const requestHash = hashRequest({
            method: req.method,
            path: req.path,
            body: req.body,
        });

        // Check if this idempotency key was already processed
        const existingKey = await prisma.idempotencyKey.findUnique({
            where: { key: idempotencyKey },
        });

        if (existingKey) {
            // Check if expired
            if (new Date() > existingKey.expiresAt) {
                // Delete expired key and continue
                await prisma.idempotencyKey.delete({
                    where: { key: idempotencyKey },
                });
                return next();
            }

            // Return cached response
            req.log.info({ idempotencyKey }, 'Returning cached idempotent response');
            return res.status(existingKey.statusCode || 200).json(existingKey.responseBody);
        }

        // Store idempotency key info for later
        req.idempotency = {
            key: idempotencyKey,
            userId,
            method: req.method,
            path: req.path,
            requestHash,
            expiresAt: addHours(new Date(), config.IDEMPOTENCY_KEY_EXPIRY_HOURS),
        };

        // Intercept response to cache it
        const originalJson = res.json.bind(res);
        res.json = function (body) {
            // Save idempotency record asynchronously
            if (req.idempotency && res.statusCode >= 200 && res.statusCode < 300) {
                prisma.idempotencyKey
                    .create({
                        data: {
                            key: req.idempotency.key,
                            userId: req.idempotency.userId,
                            method: req.idempotency.method,
                            path: req.idempotency.path,
                            requestHash: req.idempotency.requestHash,
                            responseBody: body,
                            statusCode: res.statusCode,
                            expiresAt: req.idempotency.expiresAt,
                        },
                    })
                    .catch((err) => {
                        // Ignore unique constraint errors (race condition)
                        if (err.code !== 'P2002') {
                            req.log.error({ err }, 'Failed to save idempotency key');
                        }
                    });
            }

            return originalJson(body);
        };

        next();
    } catch (error) {
        next(error);
    }
};
