import { prisma } from '../../config/database.js';
import { NotFoundError, ForbiddenError } from '../../middlewares/errorHandler.js';
import { logger } from '../../config/logger.js';

class PrescriptionService {
    async createPrescription(doctorId, data) {
        const { consultationId, patientId, medications, advice } = data;

        // Verify consultation exists and doctor is authorized
        const consultation = await prisma.consultation.findUnique({
            where: { id: consultationId },
        });

        if (!consultation) {
            throw new NotFoundError('Consultation not found');
        }

        if (consultation.doctorId !== doctorId) {
            throw new ForbiddenError('Not authorized to create prescription for this consultation');
        }

        if (consultation.status !== 'COMPLETED') {
            throw new ForbiddenError('Can only create prescription for completed consultations');
        }

        // Get doctor record for doctorId field
        const doctor = await prisma.doctor.findUnique({
            where: { userId: doctorId },
        });

        const prescription = await prisma.prescription.create({
            data: {
                consultationId,
                doctorId: doctor.id,
                patientId,
                medications,
                advice,
            },
            include: {
                consultation: true,
                doctor: { include: { user: { include: { profile: true } } } },
                patient: { include: { profile: true } },
            },
        });

        logger.info({ prescriptionId: prescription.id, consultationId }, 'Prescription created');

        return prescription;
    }

    async getPrescriptionByConsultation(consultationId, userId, userRole) {
        const prescription = await prisma.prescription.findFirst({
            where: { consultationId },
            include: {
                consultation: true,
                doctor: { include: { user: { include: { profile: true } } } },
                patient: { include: { profile: true } },
            },
        });

        if (!prescription) {
            throw new NotFoundError('Prescription not found');
        }

        // Check access rights
        const isPatient = prescription.patientId === userId;
        const isDoctor = prescription.consultation.doctorId === userId;
        const isAdmin = userRole === 'ADMIN';

        if (!isPatient && !isDoctor && !isAdmin) {
            throw new ForbiddenError('Not authorized to view this prescription');
        }

        // Log prescription access for audit
        logger.info(
            {
                prescriptionId: prescription.id,
                accessedBy: userId,
                role: userRole,
            },
            'Prescription accessed'
        );

        return prescription;
    }
}

export default new PrescriptionService();
