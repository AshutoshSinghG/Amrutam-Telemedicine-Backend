import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../middlewares/errorHandler.js';
import { logger } from '../../config/logger.js';

class PaymentService {
    async initiatePayment(consultationId) {
        const consultation = await prisma.consultation.findUnique({
            where: { id: consultationId },
            include: { payment: true, doctor: { include: { doctor: true } } },
        });

        if (!consultation) {
            throw new NotFoundError('Consultation not found');
        }

        if (consultation.payment) {
            // Payment already exists
            return consultation.payment;
        }

        // Create payment record (stub provider)
        const payment = await prisma.payment.create({
            data: {
                consultationId,
                amount: consultation.doctor.doctor.consultationFee,
                currency: 'INR',
                status: 'INITIATED',
                provider: 'STUB_PROVIDER',
                transactionReference: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            },
        });

        logger.info({ paymentId: payment.id, consultationId }, 'Payment initiated');

        return payment;
    }

    async handleWebhook(data) {
        const { transactionReference, status } = data;

        const payment = await prisma.payment.findFirst({
            where: { transactionReference },
        });

        if (!payment) {
            throw new NotFoundError('Payment not found');
        }

        // Update payment status
        const updated = await prisma.$transaction(async (tx) => {
            const updatedPayment = await tx.payment.update({
                where: { id: payment.id },
                data: { status },
            });

            // Update consultation payment status
            if (status === 'SUCCESS') {
                await tx.consultation.update({
                    where: { id: payment.consultationId },
                    data: { paymentStatus: 'PAID' },
                });
            } else if (status === 'FAILED') {
                await tx.consultation.update({
                    where: { id: payment.consultationId },
                    data: { paymentStatus: 'FAILED' },
                });
            }

            return updatedPayment;
        });

        logger.info(
            { paymentId: updated.id, status, consultationId: payment.consultationId },
            'Payment status updated'
        );

        return updated;
    }

    async getPaymentByConsultation(consultationId) {
        const payment = await prisma.payment.findUnique({
            where: { consultationId },
            include: { consultation: true },
        });

        if (!payment) {
            throw new NotFoundError('Payment not found');
        }

        return payment;
    }
}

export default new PaymentService();
