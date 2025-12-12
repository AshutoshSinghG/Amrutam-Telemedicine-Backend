import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError, ForbiddenError } from '../../middlewares/errorHandler.js';
import { doTimeRangesOverlap, isInPast } from '../../utils/time.js';

class AvailabilityService {
    async createSlot(doctorUserId, data) {
        const { startTime, endTime, maxPatients = 1 } = data;

        // Verify doctor exists
        const doctor = await prisma.doctor.findUnique({
            where: { userId: doctorUserId },
        });

        if (!doctor) {
            throw new NotFoundError('Doctor profile not found');
        }

        // Validate times
        const start = new Date(startTime);
        const end = new Date(endTime);

        if (isInPast(start)) {
            throw new ConflictError('Cannot create slot in the past');
        }

        if (start >= end) {
            throw new ConflictError('End time must be after start time');
        }

        // Check for overlapping slots
        const overlapping = await prisma.availabilitySlot.findFirst({
            where: {
                doctorId: doctor.id,
                OR: [
                    {
                        AND: [{ startTime: { lte: start } }, { endTime: { gt: start } }],
                    },
                    {
                        AND: [{ startTime: { lt: end } }, { endTime: { gte: end } }],
                    },
                    {
                        AND: [{ startTime: { gte: start } }, { endTime: { lte: end } }],
                    },
                ],
            },
        });

        if (overlapping) {
            throw new ConflictError('Slot overlaps with existing availability');
        }

        const slot = await prisma.availabilitySlot.create({
            data: {
                doctorId: doctor.id,
                startTime: start,
                endTime: end,
                maxPatients,
                status: 'AVAILABLE',
            },
        });

        return slot;
    }

    async getAvailableSlots(doctorId, query) {
        const { startDate, endDate } = query;

        const where = {
            doctorId,
            status: 'AVAILABLE',
            startTime: { gte: new Date() }, // Only future slots
            ...(startDate && { startTime: { gte: new Date(startDate) } }),
            ...(endDate && { endTime: { lte: new Date(endDate) } }),
        };

        const slots = await prisma.availabilitySlot.findMany({
            where,
            orderBy: { startTime: 'asc' },
        });

        return slots;
    }

    async updateSlot(doctorUserId, slotId, data) {
        const slot = await prisma.availabilitySlot.findUnique({
            where: { id: slotId },
            include: { doctor: true },
        });

        if (!slot) {
            throw new NotFoundError('Slot not found');
        }

        if (slot.doctor.userId !== doctorUserId) {
            throw new ForbiddenError('Not authorized to update this slot');
        }

        if (slot.status === 'BOOKED') {
            throw new ConflictError('Cannot update a booked slot');
        }

        const updated = await prisma.availabilitySlot.update({
            where: { id: slotId },
            data: {
                ...(data.startTime && { startTime: new Date(data.startTime) }),
                ...(data.endTime && { endTime: new Date(data.endTime) }),
                ...(data.status && { status: data.status }),
                ...(data.maxPatients !== undefined && { maxPatients: data.maxPatients }),
            },
        });

        return updated;
    }

    async deleteSlot(doctorUserId, slotId) {
        const slot = await prisma.availabilitySlot.findUnique({
            where: { id: slotId },
            include: { doctor: true },
        });

        if (!slot) {
            throw new NotFoundError('Slot not found');
        }

        if (slot.doctor.userId !== doctorUserId) {
            throw new ForbiddenError('Not authorized to delete this slot');
        }

        if (slot.status === 'BOOKED') {
            throw new ConflictError('Cannot delete a booked slot');
        }

        await prisma.availabilitySlot.delete({
            where: { id: slotId },
        });

        return { message: 'Slot deleted successfully' };
    }
}

export default new AvailabilityService();
