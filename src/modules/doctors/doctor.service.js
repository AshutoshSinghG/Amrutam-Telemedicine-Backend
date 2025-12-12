import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError, ForbiddenError } from '../../middlewares/errorHandler.js';
import { parsePaginationParams, paginatedResponse } from '../../utils/pagination.js';

class DoctorService {
    async registerDoctor(userId, data) {
        const {
            specialization,
            yearsOfExperience,
            registrationNumber,
            clinicName,
            consultationFee,
            languagesSpoken,
            bio,
        } = data;

        // Check if user exists and has DOCTOR role
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { doctor: true },
        });

        if (!user || user.deletedAt) {
            throw new NotFoundError('User not found');
        }

        if (user.role !== 'DOCTOR') {
            throw new ForbiddenError('Only users with DOCTOR role can register as doctors');
        }

        if (user.doctor) {
            throw new ConflictError('Doctor profile already exists');
        }

        // Check registration number uniqueness
        const existingDoctor = await prisma.doctor.findUnique({
            where: { registrationNumber },
        });

        if (existingDoctor) {
            throw new ConflictError('Registration number already in use');
        }

        const doctor = await prisma.doctor.create({
            data: {
                userId,
                specialization,
                yearsOfExperience,
                registrationNumber,
                clinicName,
                consultationFee,
                languagesSpoken: languagesSpoken || [],
                bio,
            },
            include: {
                user: {
                    include: { profile: true },
                },
            },
        });

        return doctor;
    }

    async updateDoctor(userId, data) {
        const doctor = await prisma.doctor.findUnique({
            where: { userId },
        });

        if (!doctor) {
            throw new NotFoundError('Doctor profile not found');
        }

        const updated = await prisma.doctor.update({
            where: { userId },
            data: {
                ...(data.specialization && { specialization: data.specialization }),
                ...(data.yearsOfExperience !== undefined && {
                    yearsOfExperience: data.yearsOfExperience,
                }),
                ...(data.clinicName !== undefined && { clinicName: data.clinicName }),
                ...(data.consultationFee !== undefined && { consultationFee: data.consultationFee }),
                ...(data.languagesSpoken && { languagesSpoken: data.languagesSpoken }),
                ...(data.bio !== undefined && { bio: data.bio }),
            },
            include: {
                user: {
                    include: { profile: true },
                },
            },
        });

        return updated;
    }

    async getDoctor(doctorId) {
        const doctor = await prisma.doctor.findUnique({
            where: { id: doctorId },
            include: {
                user: {
                    include: { profile: true },
                },
            },
        });

        if (!doctor) {
            throw new NotFoundError('Doctor not found');
        }

        return doctor;
    }

    async searchDoctors(query) {
        const { page, limit, skip } = parsePaginationParams(query);
        const { specialization, language, minFee, maxFee, minRating, sortBy = 'rating' } = query;

        const where = {
            isApproved: true,
            user: { deletedAt: null },
            ...(specialization && {
                specialization: { contains: specialization, mode: 'insensitive' },
            }),
            ...(language && {
                languagesSpoken: { has: language },
            }),
            ...(minFee && { consultationFee: { gte: parseFloat(minFee) } }),
            ...(maxFee && { consultationFee: { lte: parseFloat(maxFee) } }),
            ...(minRating && { rating: { gte: parseFloat(minRating) } }),
        };

        const orderBy = {};
        if (sortBy === 'rating') orderBy.rating = 'desc';
        else if (sortBy === 'fee') orderBy.consultationFee = 'asc';
        else if (sortBy === 'experience') orderBy.yearsOfExperience = 'desc';
        else orderBy.createdAt = 'desc';

        const [doctors, total] = await Promise.all([
            prisma.doctor.findMany({
                where,
                include: {
                    user: {
                        include: { profile: true },
                    },
                },
                skip,
                take: limit,
                orderBy,
            }),
            prisma.doctor.count({ where }),
        ]);

        return paginatedResponse(doctors, page, limit, total);
    }

    async approveDoctor(adminId, doctorId) {
        const doctor = await prisma.doctor.findUnique({
            where: { id: doctorId },
        });

        if (!doctor) {
            throw new NotFoundError('Doctor not found');
        }

        const updated = await prisma.doctor.update({
            where: { id: doctorId },
            data: { isApproved: true },
            include: {
                user: {
                    include: { profile: true },
                },
            },
        });

        return updated;
    }
}

export default new DoctorService();
