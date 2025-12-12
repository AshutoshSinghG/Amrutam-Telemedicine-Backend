import userService from './user.service.js';

class UserController {
    async getProfile(req, res, next) {
        try {
            const user = await userService.getProfile(req.user.id);
            res.status(200).json({
                success: true,
                data: user,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateProfile(req, res, next) {
        try {
            const user = await userService.updateProfile(req.user.id, req.body);
            res.status(200).json({
                success: true,
                data: user,
                message: 'Profile updated successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    async listUsers(req, res, next) {
        try {
            const result = await userService.listUsers(req.query, req.user);
            res.status(200).json({
                success: true,
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateUserRole(req, res, next) {
        try {
            const { id } = req.params;
            const { role } = req.body;
            const user = await userService.updateUserRole(req.user.id, id, role);
            res.status(200).json({
                success: true,
                data: user,
                message: 'User role updated successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    async disableUser(req, res, next) {
        try {
            const { id } = req.params;
            const user = await userService.disableUser(req.user.id, id);
            res.status(200).json({
                success: true,
                data: user,
                message: 'User disabled successfully',
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new UserController();
