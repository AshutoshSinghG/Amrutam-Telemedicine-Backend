import authService from './auth.service.js';

class AuthController {
    async signup(req, res, next) {
        try {
            const result = await authService.signup(req.body);
            res.status(201).json({
                success: true,
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }

    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password);

            res.status(200).json({
                success: true,
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }

    async verifyMFA(req, res, next) {
        try {
            const { otp } = req.body;
            const userId = req.body.userId || req.user?.id;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required',
                });
            }

            const result = await authService.verifyMFA(userId, otp);

            res.status(200).json({
                success: true,
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }

    async verifyEmail(req, res, next) {
        try {
            const { token } = req.body;
            const result = await authService.verifyEmail(token);

            res.status(200).json({
                success: true,
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }

    async requestPasswordReset(req, res, next) {
        try {
            const { email } = req.body;
            const result = await authService.requestPasswordReset(email);

            res.status(200).json({
                success: true,
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }

    async resetPassword(req, res, next) {
        try {
            const { token, newPassword } = req.body;
            const result = await authService.resetPassword(token, newPassword);

            res.status(200).json({
                success: true,
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }

    async enableMFA(req, res, next) {
        try {
            const userId = req.user.id;
            const result = await authService.enableMFA(userId);

            res.status(200).json({
                success: true,
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }

    async completeMFASetup(req, res, next) {
        try {
            const { otp } = req.body;
            const userId = req.user.id;
            const result = await authService.completeMFASetup(userId, otp);

            res.status(200).json({
                success: true,
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }

    async refreshToken(req, res, next) {
        try {
            const { refreshToken } = req.body;
            const result = await authService.refreshToken(refreshToken);

            res.status(200).json({
                success: true,
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new AuthController();
