import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError, ForbiddenError } from '../../middlewares/errorHandler.js';
import { getHoursDifference } from '../../utils/time.js';
import { config } from '../../config/env.js';
import { parsePaginationParams, paginatedResponse } from '../../utils/pagination.js';

class ConsultationService {
    async bookConsultation(patientId, data) {
        const { doctorId, slotId, reason } = data;

        // Use transaction for concurrency safety
        const result = await prisma.$transaction(async (tx) => {
            // Lock the slot for update
            const slot = await tx.availabilitySlot.findUnique({
                where: { id: slotId },
                include: { doctor: true },
            });

            if (!slot) {
                throw new NotFoundError('Availability slot not found');
            }

            if (slot.status !== 'AVAILABLE') {
                throw new ConflictError('Slot is not available');
            }

            if (slot.doctor.userId !== doctorId) {
                throw new ConflictError('Slot does not belong to the specified doctor');
            }

            // Check if doctor is approved
            if (!slot.doctor.isApproved) {
                throw new ForbiddenError('Doctor is not approved yet');
            }

            // Create consultation
            const consultation = await tx.consultation.create({
                data: {
                    patientId,
                    doctorId,
                    slotId,
                    reason,
                    status: 'CONFIRMED',
                    paymentStatus: 'PENDING',
                },
                include: {
                    patient: { include: { profile: true } },
                    doctor: { include: { profile: true, doctor: true } },
                    slot: true,
                },
            });

            // Mark slot as booked
            await tx.availabilitySlot.update({
                where: { id: slotId },
                data: { status: 'BOOKED' },
            });

            // Create payment record
            await tx.payment.create({
                data: {
                    consultationId: consultation.id,
                    amount: slot.doctor.consultationFee,
                    currency: 'INR',
                    status: 'INITIATED',
                },
            });

            return consultation;
        });

        return result;
    }

    async getMyConsultations(patientId, query) {
        const { page, limit, skip } = parsePaginationParams(query);
        const { status } = query;

        const where = {
            patientId,
            ...(status && { status }),
        };

        const [consultations, total] = await Promise.all([
            prisma.consultation.findMany({
                where,
                include: {
                    doctor: { include: { profile: true, doctor: true } },
                    slot: true,
                    payment: true,
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.consultation.count({ where }),
        ]);

        return paginatedResponse(consultations, page, limit, total);
    }

    async getDoctorConsultations(doctorId, query) {
        const { page, limit, skip } = parsePaginationParams(query);
        const { status } = query;

        const where = {
            doctorId,
            ...(status && { status }),
        };

        const [consultations, total] = await Promise.all([
            prisma.consultation.findMany({
                where,
                include: {
                    patient: { include: { profile: true } },
                    slot: true,
                    payment: true,
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.consultation.count({ where }),
        ]);

        return paginatedResponse(consultations, page, limit, total);
    }

    async getConsultation(consultationId, userId, userRole) {
        const consultation = await prisma.consultation.findUnique({
            where: { id: consultationId },
            include: {
                patient: { include: { profile: true } },
                doctor: { include: { profile: true, doctor: true } },
                slot: true,
                payment: true,
            },
        });

        if (!consultation) {
            throw new NotFoundError('Consultation not found');
        }

        // Check access rights
        const isPatient = consultation.patientId === userId;
        const isDoctor = consultation.doctorId === userId;
        const isAdmin = userRole === 'ADMIN';

        if (!isPatient && !isDoctor && !isAdmin) {
            throw new ForbiddenError('Not authorized to view this consultation');
        }

        return consultation;
    }

    async updateStatus(consultationId, userId, newStatus, notes) {
        const consultation = await prisma.consultation.findUnique({
            where: { id: consultationId },
        });

        if (!consultation) {
            throw new NotFoundError('Consultation not found');
        }

        // Only doctor can update status
        if (consultation.doctorId !== userId) {
            throw new ForbiddenError('Only the assigned doctor can update consultation status');
        }

        // Validate status transitions
        const validTransitions = {
            CONFIRMED: ['IN_PROGRESS', 'CANCELLED', 'NO_SHOW'],
            IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
        };

        if (
            !validTransitions[consultation.status] ||
            !validTransitions[consultation.status].includes(newStatus)
        ) {
            throw new ConflictError(`Cannot transition from ${consultation.status} to ${newStatus}`);
        }

        const updateData = {
            status: newStatus,
            ...(notes && { notes }),
            ...(newStatus === 'IN_PROGRESS' && { startedAt: new Date() }),
            ...(newStatus === 'COMPLETED' && { endedAt: new Date() }),
        };

        const updated = await prisma.consultation.update({
            where: { id: consultationId },
            data: updateData,
            include: {
                patient: { include: { profile: true } },
                doctor: { include: { profile: true, doctor: true } },
                slot: true,
            },
        });

        return updated;
    }

    async cancelConsultation(consultationId, userId, userRole) {
        const consultation = await prisma.consultation.findUnique({
            where: { id: consultationId },
            include: { slot: true },
        });

        if (!consultation) {
            throw new NotFoundError('Consultation not found');
        }

        // Check if user can cancel
        const isPatient = consultation.patientId === userId;
        const isDoctor = consultation.doctorId === userId;

        if (!isPatient && !isDoctor) {
            throw new ForbiddenError('Not authorized to cancel this consultation');
        }

        // Check if already cancelled or completed
        if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(consultation.status)) {
            throw new ConflictError('Cannot cancel consultation in current status');
        }

        // Check cancellation window
        const hoursUntilConsultation = getHoursDifference(new Date(), consultation.slot.startTime);
        if (hoursUntilConsultation < config.CONSULTATION_CANCELLATION_HOURS) {
            throw new ConflictError(
                `Cannot cancel within ${config.CONSULTATION_CANCELLATION_HOURS} hours of consultation`
            );
        }

        // Cancel in transaction
        const result = await prisma.$transaction(async (tx) => {
            const updated = await tx.consultation.update({
                where: { id: consultationId },
                data: { status: 'CANCELLED' },
            });

            // Free up the slot
            await tx.availabilitySlot.update({
                where: { id: consultation.slotId },
                data: { status: 'AVAILABLE' },
            });

            return updated;
        });

        return result;
    }
}

export default new ConsultationService();
