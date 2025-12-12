import { prisma } from '../../config/database.js';
import {
    hashPassword,
    comparePassword,
    generateRandomToken,
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    generateOTP,
} from '../../utils/crypto.js';
import { addHours, addMinutes } from '../../utils/time.js';
import { config } from '../../config/env.js';
import {
    ConflictError,
    UnauthorizedError,
    NotFoundError,
    ValidationError,
} from '../../middlewares/errorHandler.js';
import { logger } from '../../config/logger.js';

class AuthService {
    async signup(data) {
        const { email, password, fullName, role = 'PATIENT', phone, gender } = data;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (existingUser) {
            throw new ConflictError('User with this email already exists');
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Generate email verification token
        const emailVerificationToken = generateRandomToken();

        // Create user and profile in transaction
        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                passwordHash,
                role,
                emailVerificationToken,
                profile: {
                    create: {
                        fullName,
                        phone,
                        gender,
                    },
                },
            },
            include: {
                profile: true,
            },
        });

        // Send verification email (stubbed)
        this._sendVerificationEmail(user.email, emailVerificationToken);

        logger.info({ userId: user.id, email: user.email }, 'User signed up successfully');

        return {
            user: this._sanitizeUser(user),
            message: 'Signup successful. Please check your email to verify your account.',
        };
    }

    async login(email, password) {
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            include: { profile: true, doctor: true },
        });

        if (!user || user.deletedAt) {
            throw new UnauthorizedError('Invalid credentials');
        }

        // Verify password
        const isPasswordValid = await comparePassword(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedError('Invalid credentials');
        }

        // Check if MFA is enabled
        if (user.mfaEnabled) {
            // Generate and send OTP
            const otp = generateOTP();
            const otpExpiry = addMinutes(new Date(), config.MFA_OTP_EXPIRY_MINUTES);

            // Store OTP in user record (in production, use separate table or cache)
            await prisma.user.update({
                where: { id: user.id },
                data: { mfaSecret: `${otp}:${otpExpiry.toISOString()}` },
            });

            this._sendMFACode(user.email, otp);

            logger.info({ userId: user.id }, 'MFA code sent');

            return {
                requiresMFA: true,
                userId: user.id,
                message: 'MFA code sent to your email',
            };
        }

        // Generate tokens
        const tokens = this._generateTokens(user, true);

        logger.info({ userId: user.id, email: user.email }, 'User logged in successfully');

        return {
            user: this._sanitizeUser(user),
            ...tokens,
        };
    }

    async verifyMFA(userId, otp) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true, doctor: true },
        });

        if (!user || !user.mfaEnabled || !user.mfaSecret) {
            throw new UnauthorizedError('Invalid MFA request');
        }

        // Parse stored OTP and expiry
        const [storedOtp, expiryStr] = user.mfaSecret.split(':');
        const expiry = new Date(expiryStr);

        if (new Date() > expiry) {
            throw new UnauthorizedError('MFA code expired');
        }

        if (storedOtp !== otp) {
            throw new UnauthorizedError('Invalid MFA code');
        }

        // Clear MFA secret
        await prisma.user.update({
            where: { id: user.id },
            data: { mfaSecret: null },
        });

        // Generate tokens with MFA verified
        const tokens = this._generateTokens(user, true);

        logger.info({ userId: user.id }, 'MFA verified successfully');

        return {
            user: this._sanitizeUser(user),
            ...tokens,
        };
    }

    async verifyEmail(token) {
        const user = await prisma.user.findFirst({
            where: { emailVerificationToken: token },
        });

        if (!user) {
            throw new NotFoundError('Invalid or expired verification token');
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                isEmailVerified: true,
                emailVerificationToken: null,
            },
        });

        logger.info({ userId: user.id }, 'Email verified successfully');

        return { message: 'Email verified successfully' };
    }

    async requestPasswordReset(email) {
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        // Don't reveal if user exists
        if (!user || user.deletedAt) {
            return { message: 'If the email exists, a reset link has been sent' };
        }

        const resetToken = generateRandomToken();
        const resetExpiry = addHours(new Date(), config.PASSWORD_RESET_EXPIRY_HOURS);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken: resetToken,
                passwordResetExpiry: resetExpiry,
            },
        });

        this._sendPasswordResetEmail(user.email, resetToken);

        logger.info({ userId: user.id }, 'Password reset requested');

        return { message: 'If the email exists, a reset link has been sent' };
    }

    async resetPassword(token, newPassword) {
        const user = await prisma.user.findFirst({
            where: {
                passwordResetToken: token,
                passwordResetExpiry: { gt: new Date() },
            },
        });

        if (!user) {
            throw new UnauthorizedError('Invalid or expired reset token');
        }

        const passwordHash = await hashPassword(newPassword);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                passwordResetToken: null,
                passwordResetExpiry: null,
            },
        });

        logger.info({ userId: user.id }, 'Password reset successfully');

        return { message: 'Password reset successfully' };
    }

    async enableMFA(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        if (user.mfaEnabled) {
            throw new ValidationError('MFA is already enabled');
        }

        // Generate and send OTP for verification
        const otp = generateOTP();
        const otpExpiry = addMinutes(new Date(), config.MFA_OTP_EXPIRY_MINUTES);

        await prisma.user.update({
            where: { id: user.id },
            data: { mfaSecret: `${otp}:${otpExpiry.toISOString()}` },
        });

        this._sendMFACode(user.email, otp);

        logger.info({ userId: user.id }, 'MFA setup initiated');

        return {
            message: 'MFA code sent to your email. Verify to enable MFA.',
            userId: user.id,
        };
    }

    async completeMFASetup(userId, otp) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.mfaSecret) {
            throw new UnauthorizedError('Invalid MFA setup request');
        }

        const [storedOtp, expiryStr] = user.mfaSecret.split(':');
        const expiry = new Date(expiryStr);

        if (new Date() > expiry) {
            throw new UnauthorizedError('MFA code expired');
        }

        if (storedOtp !== otp) {
            throw new UnauthorizedError('Invalid MFA code');
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                mfaEnabled: true,
                mfaSecret: null,
            },
        });

        logger.info({ userId: user.id }, 'MFA enabled successfully');

        return { message: 'MFA enabled successfully' };
    }

    async refreshToken(refreshToken) {
        const payload = verifyRefreshToken(refreshToken);

        if (!payload) {
            throw new UnauthorizedError('Invalid or expired refresh token');
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            include: { profile: true, doctor: true },
        });

        if (!user || user.deletedAt) {
            throw new UnauthorizedError('User not found');
        }

        const tokens = this._generateTokens(user, false);

        return tokens;
    }

    // Private helper methods
    _generateTokens(user, mfaVerified = false) {
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            mfaVerified,
        };

        return {
            accessToken: generateAccessToken(payload),
            refreshToken: generateRefreshToken({ userId: user.id }),
        };
    }

    _sanitizeUser(user) {
        const { passwordHash, emailVerificationToken, passwordResetToken, mfaSecret, ...sanitized } =
            user;
        return sanitized;
    }

    _sendVerificationEmail(email, token) {
        // Stub: In production, integrate with email service
        logger.info(
            { email, token },
            `[EMAIL STUB] Verification link: http://localhost:3000/verify-email?token=${token}`
        );
    }

    _sendPasswordResetEmail(email, token) {
        logger.info(
            { email, token },
            `[EMAIL STUB] Password reset link: http://localhost:3000/reset-password?token=${token}`
        );
    }

    _sendMFACode(email, otp) {
        logger.info({ email, otp }, `[EMAIL STUB] Your MFA code is: ${otp}`);
    }
}

export default new AuthService();
