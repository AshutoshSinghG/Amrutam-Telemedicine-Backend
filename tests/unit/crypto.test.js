import { hashPassword, comparePassword, generateOTP, generateAccessToken, verifyAccessToken } from '../../src/utils/crypto.js';

describe('Crypto Utils', () => {
    describe('Password hashing', () => {
        it('should hash password correctly', async () => {
            const password = 'Test@123456';
            const hash = await hashPassword(password);

            expect(hash).toBeDefined();
            expect(hash).not.toBe(password);
            expect(hash.length).toBeGreaterThan(0);
        });

        it('should verify correct password', async () => {
            const password = 'Test@123456';
            const hash = await hashPassword(password);
            const isValid = await comparePassword(password, hash);

            expect(isValid).toBe(true);
        });

        it('should reject incorrect password', async () => {
            const password = 'Test@123456';
            const hash = await hashPassword(password);
            const isValid = await comparePassword('WrongPassword', hash);

            expect(isValid).toBe(false);
        });
    });

    describe('OTP generation', () => {
        it('should generate OTP of correct length', () => {
            const otp = generateOTP(6);

            expect(otp).toBeDefined();
            expect(otp.length).toBe(6);
            expect(/^\d+$/.test(otp)).toBe(true);
        });
    });

    describe('JWT operations', () => {
        it('should generate and verify access token', () => {
            const payload = { userId: '123', email: 'test@example.com', role: 'PATIENT' };
            const token = generateAccessToken(payload);

            expect(token).toBeDefined();

            const decoded = verifyAccessToken(token);
            expect(decoded).toBeDefined();
            expect(decoded.userId).toBe(payload.userId);
            expect(decoded.email).toBe(payload.email);
        });

        it('should return null for invalid token', () => {
            const decoded = verifyAccessToken('invalid-token');
            expect(decoded).toBeNull();
        });
    });
});
