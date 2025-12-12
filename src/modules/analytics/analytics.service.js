import { prisma } from '../../config/database.js';

class AnalyticsService {
    async getSummary() {
        const [totalUsers, totalDoctors, totalConsultations, totalRevenue] = await Promise.all([
            prisma.user.count({ where: { deletedAt: null } }),
            prisma.doctor.count({ where: { isApproved: true } }),
            prisma.consultation.count(),
            prisma.payment.aggregate({
                where: { status: 'SUCCESS' },
                _sum: { amount: true },
            }),
        ]);

        return {
            totalUsers,
            totalDoctors,
            totalConsultations,
            totalRevenue: totalRevenue._sum.amount || 0,
        };
    }

    async getConsultationsPerDay(startDate, endDate) {
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        const consultations = await prisma.consultation.groupBy({
            by: ['createdAt'],
            where: {
                createdAt: {
                    gte: start,
                    lte: end,
                },
            },
            _count: true,
        });

        // Group by day
        const byDay = {};
        consultations.forEach((c) => {
            const day = c.createdAt.toISOString().split('T')[0];
            byDay[day] = (byDay[day] || 0) + c._count;
        });

        return Object.entries(byDay).map(([date, count]) => ({ date, count }));
    }

    async getConversionRate() {
        const [total, completed] = await Promise.all([
            prisma.consultation.count(),
            prisma.consultation.count({ where: { status: 'COMPLETED' } }),
        ]);

        const rate = total > 0 ? (completed / total) * 100 : 0;

        return {
            totalConsultations: total,
            completedConsultations: completed,
            conversionRate: rate.toFixed(2),
        };
    }

    async getDoctorUtilization() {
        const doctors = await prisma.doctor.findMany({
            where: { isApproved: true },
            include: {
                user: { include: { profile: true } },
                availabilitySlots: true,
                _count: {
                    select: {
                        availabilitySlots: {
                            where: { status: 'BOOKED' },
                        },
                    },
                },
            },
        });

        const utilization = doctors.map((d) => {
            const totalSlots = d.availabilitySlots.length;
            const bookedSlots = d._count.availabilitySlots;
            const rate = totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0;

            return {
                doctorId: d.id,
                doctorName: d.user.profile.fullName,
                totalSlots,
                bookedSlots,
                utilizationRate: rate.toFixed(2),
            };
        });

        return utilization;
    }

    async getTopSpecializations(limit = 10) {
        const specializations = await prisma.consultation.groupBy({
            by: ['doctorId'],
            _count: true,
            orderBy: {
                _count: {
                    doctorId: 'desc',
                },
            },
            take: limit,
        });

        // Get doctor details
        const doctorIds = specializations.map((s) => s.doctorId);
        const doctors = await prisma.user.findMany({
            where: { id: { in: doctorIds } },
            include: { doctor: true },
        });

        const doctorMap = new Map(doctors.map((d) => [d.id, d.doctor?.specialization]));

        // Count by specialization
        const specCounts = {};
        specializations.forEach((s) => {
            const spec = doctorMap.get(s.doctorId);
            if (spec) {
                specCounts[spec] = (specCounts[spec] || 0) + s._count;
            }
        });

        return Object.entries(specCounts)
            .map(([specialization, count]) => ({ specialization, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }
}

export default new AnalyticsService();
