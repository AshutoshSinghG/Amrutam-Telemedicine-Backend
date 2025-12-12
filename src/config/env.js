import 'dotenv/config';
import { z } from 'zod';


const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform(Number).default('3000'),
    API_VERSION: z.string().default('v1'),

    DATABASE_URL: z.string().url(),

    JWT_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

    CORS_ORIGIN: z.string().default('http://localhost:3000'),

    RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
    RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
    AUTH_RATE_LIMIT_MAX: z.string().transform(Number).default('5'),

    MFA_OTP_EXPIRY_MINUTES: z.string().transform(Number).default('10'),
    MFA_OTP_LENGTH: z.string().transform(Number).default('6'),

    EMAIL_FROM: z.string().email().default('noreply@amrutam.health'),
    EMAIL_VERIFICATION_EXPIRY_HOURS: z.string().transform(Number).default('24'),
    PASSWORD_RESET_EXPIRY_HOURS: z.string().transform(Number).default('1'),

    IDEMPOTENCY_KEY_EXPIRY_HOURS: z.string().transform(Number).default('24'),

    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    LOG_PRETTY: z
        .string()
        .transform((v) => v === 'true')
        .default('false'),

    METRICS_ENABLED: z
        .string()
        .transform((v) => v === 'true')
        .default('true'),

    CONSULTATION_CANCELLATION_HOURS: z.string().transform(Number).default('2'),
    REMINDER_HOURS_BEFORE: z.string().transform(Number).default('2'),
});

// Parse and validate environment variables
const parseEnv = () => {
    try {
        return envSchema.parse(process.env);
    } catch (error) {
        console.error('❌ Invalid environment variables:');
        console.error(error.errors);
        process.exit(1);
    }
};

export const config = parseEnv();
