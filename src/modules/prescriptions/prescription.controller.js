import prescriptionService from './prescription.service.js';

class PrescriptionController {
    async createPrescription(req, res, next) {
        try {
            const prescription = await prescriptionService.createPrescription(req.user.id, req.body);
            res.status(201).json({
                success: true,
                data: prescription,
                message: 'Prescription created successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    async getPrescriptionByConsultation(req, res, next) {
        try {
            const { consultationId } = req.params;
            const prescription = await prescriptionService.getPrescriptionByConsultation(
                consultationId,
                req.user.id,
                req.user.role
            );
            res.status(200).json({
                success: true,
                data: prescription,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new PrescriptionController();
