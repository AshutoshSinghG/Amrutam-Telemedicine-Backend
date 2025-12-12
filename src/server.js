import app from './app.js';
import { config } from './config/env.js';
import { logger } from './config/logger.js';
import { disconnectDatabase } from './config/database.js';
import { startReminderJob } from './jobs/reminderJob.js';

const PORT = config.PORT || 3000;

let server;

// Start server
const startServer = async () => {
    try {
        server = app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT} in ${config.NODE_ENV} mode`);
            logger.info(`Health check: http://localhost:${PORT}/health`);
            logger.info(`API base URL: http://localhost:${PORT}/api/${config.API_VERSION}`);
        });

        // Start background jobs
        startReminderJob();
        logger.info('Background jobs started');
    } catch (error) {
        logger.error({ error }, 'Failed to start server');
        process.exit(1);
    }
};

// Graceful shutdown
const gracefulShutdown = async (signal) => {
    logger.info(`${signal} received, starting graceful shutdown`);

    if (server) {
        server.close(async () => {
            logger.info('HTTP server closed');

            // Close database connection
            await disconnectDatabase();

            logger.info('Graceful shutdown completed');
            process.exit(0);
        });

        // Force shutdown after 30 seconds
        setTimeout(() => {
            logger.error('Forced shutdown after timeout');
            process.exit(1);
        }, 30000);
    } else {
        process.exit(0);
    }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    logger.fatal({ error }, 'Uncaught exception');
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.fatal({ reason, promise }, 'Unhandled rejection');
    process.exit(1);
});

// Start the server
startServer();
