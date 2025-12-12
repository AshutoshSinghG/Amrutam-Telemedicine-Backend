import paymentService from './payment.service.js';

class PaymentController {
    async initiatePayment(req, res, next) {
        try {
            const { consultationId } = req.body;
            const payment = await paymentService.initiatePayment(consultationId);
            res.status(201).json({
                success: true,
                data: payment,
                message: 'Payment initiated successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    async handleWebhook(req, res, next) {
        try {
            const payment = await paymentService.handleWebhook(req.body);
            res.status(200).json({
                success: true,
                data: payment,
            });
        } catch (error) {
            next(error);
        }
    }

    async getPaymentByConsultation(req, res, next) {
        try {
            const { consultationId } = req.params;
            const payment = await paymentService.getPaymentByConsultation(consultationId);
            res.status(200).json({
                success: true,
                data: payment,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new PaymentController();
