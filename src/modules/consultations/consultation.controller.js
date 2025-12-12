import consultationService from './consultation.service.js';

class ConsultationController {
    async bookConsultation(req, res, next) {
        try {
            const consultation = await consultationService.bookConsultation(req.user.id, req.body);
            res.status(201).json({
                success: true,
                data: consultation,
                message: 'Consultation booked successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    async getMyConsultations(req, res, next) {
        try {
            const result = await consultationService.getMyConsultations(req.user.id, req.query);
            res.status(200).json({
                success: true,
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getDoctorConsultations(req, res, next) {
        try {
            const result = await consultationService.getDoctorConsultations(req.user.id, req.query);
            res.status(200).json({
                success: true,
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getConsultation(req, res, next) {
        try {
            const { id } = req.params;
            const consultation = await consultationService.getConsultation(
                id,
                req.user.id,
                req.user.role
            );
            res.status(200).json({
                success: true,
                data: consultation,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status, notes } = req.body;
            const consultation = await consultationService.updateStatus(id, req.user.id, status, notes);
            res.status(200).json({
                success: true,
                data: consultation,
                message: 'Consultation status updated successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    async cancelConsultation(req, res, next) {
        try {
            const { id } = req.params;
            const consultation = await consultationService.cancelConsultation(
                id,
                req.user.id,
                req.user.role
            );
            res.status(200).json({
                success: true,
                data: consultation,
                message: 'Consultation cancelled successfully',
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new ConsultationController();
