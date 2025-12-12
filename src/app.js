import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/env.js';
import { requestLogger, attachCorrelationId } from './middlewares/requestLogger.js';
import { metricsMiddleware, metricsHandler } from './middlewares/metricsMiddleware.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import { checkDatabaseHealth } from './config/database.js';

// Import routes
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/user.routes.js';
import doctorRoutes from './modules/doctors/doctor.routes.js';
import availabilityRoutes from './modules/availability/availability.routes.js';
import consultationRoutes from './modules/consultations/consultation.routes.js';
import prescriptionRoutes from './modules/prescriptions/prescription.routes.js';
import paymentRoutes from './modules/payments/payment.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(
    cors({
        origin: config.CORS_ORIGIN.split(','),
        credentials: true,
    })
);

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging and correlation
app.use(requestLogger);
app.use(attachCorrelationId);

// Metrics collection
app.use(metricsMiddleware);

// Health check endpoint
app.get('/health', async (req, res) => {
    const dbHealthy = await checkDatabaseHealth();

    const health = {
        status: dbHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: dbHealthy ? 'connected' : 'disconnected',
    };

    res.status(dbHealthy ? 200 : 503).json(health);
});

// Metrics endpoint
app.get('/metrics', metricsHandler);

// API routes with rate limiting
const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/doctors', doctorRoutes);
apiRouter.use('/availability', availabilityRoutes);
apiRouter.use('/consultations', consultationRoutes);
apiRouter.use('/prescriptions', prescriptionRoutes);
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/admin/analytics', analyticsRoutes);
apiRouter.use('/audit-logs', auditRoutes);

// Mount API router with rate limiting
app.use(`/api/${config.API_VERSION}`, apiLimiter, apiRouter);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
