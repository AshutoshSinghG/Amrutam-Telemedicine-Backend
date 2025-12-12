import pino from 'pino';
import { config } from './env.js';

const pinoConfig = {
    level: config.LOG_LEVEL,
    ...(config.LOG_PRETTY && {
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
            },
        },
    }),
    formatters: {
        level: (label) => {
            return { level: label };
        },
    },
    serializers: {
        req: (req) => ({
            id: req.id,
            method: req.method,
            url: req.url,
            headers: {
                host: req.headers.host,
                'user-agent': req.headers['user-agent'],
            },
        }),
        res: (res) => ({
            statusCode: res.statusCode,
        }),
        err: pino.stdSerializers.err,
    },
};

export const logger = pino(pinoConfig);

// Create child logger with context
export const createLogger = (context) => {
    return logger.child(context);
};
