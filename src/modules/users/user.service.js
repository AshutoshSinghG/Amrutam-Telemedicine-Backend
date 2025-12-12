import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../middlewares/errorHandler.js';
import { hashPassword } from '../../utils/crypto.js';
import { parsePaginationParams, paginatedResponse } from '../../utils/pagination.js';

class UserService {
    async getProfile(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                profile: true,
                doctor: true,
            },
        });

        if (!user || user.deletedAt) {
            throw new NotFoundError('User not found');
        }

        return this._sanitizeUser(user);
    }

    async updateProfile(userId, data) {
        const { fullName, gender, dateOfBirth, phone, address, timezone } = data;

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                profile: {
                    update: {
                        ...(fullName && { fullName }),
                        ...(gender && { gender }),
                        ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
                        ...(phone && { phone }),
                        ...(address && { address }),
                        ...(timezone && { timezone }),
                    },
                },
            },
            include: {
                profile: true,
                doctor: true,
            },
        });

        return this._sanitizeUser(user);
    }

    async listUsers(query, requestingUser) {
        const { page, limit, skip } = parsePaginationParams(query);
        const { role, search } = query;

        const where = {
            deletedAt: null,
            ...(role && { role }),
            ...(search && {
                OR: [
                    { email: { contains: search, mode: 'insensitive' } },
                    { profile: { fullName: { contains: search, mode: 'insensitive' } } },
                ],
            }),
        };

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                include: { profile: true },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.user.count({ where }),
        ]);

        const sanitizedUsers = users.map((u) => this._sanitizeUser(u));

        return paginatedResponse(sanitizedUsers, page, limit, total);
    }

    async updateUserRole(adminId, userId, newRole) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || user.deletedAt) {
            throw new NotFoundError('User not found');
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role: newRole },
            include: { profile: true },
        });

        return this._sanitizeUser(updatedUser);
    }

    async disableUser(adminId, userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        if (user.deletedAt) {
            throw new ConflictError('User is already disabled');
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { deletedAt: new Date() },
            include: { profile: true },
        });

        return this._sanitizeUser(updatedUser);
    }

    _sanitizeUser(user) {
        const { passwordHash, emailVerificationToken, passwordResetToken, mfaSecret, ...sanitized } =
            user;
        return sanitized;
    }
}

export default new UserService();
