import doctorService from './doctor.service.js';

class DoctorController {
    async registerDoctor(req, res, next) {
        try {
            const doctor = await doctorService.registerDoctor(req.user.id, req.body);
            res.status(201).json({
                success: true,
                data: doctor,
                message: 'Doctor profile created successfully. Awaiting admin approval.',
            });
        } catch (error) {
            next(error);
        }
    }

    async updateDoctor(req, res, next) {
        try {
            const doctor = await doctorService.updateDoctor(req.user.id, req.body);
            res.status(200).json({
                success: true,
                data: doctor,
                message: 'Doctor profile updated successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    async getDoctor(req, res, next) {
        try {
            const { id } = req.params;
            const doctor = await doctorService.getDoctor(id);
            res.status(200).json({
                success: true,
                data: doctor,
            });
        } catch (error) {
            next(error);
        }
    }

    async searchDoctors(req, res, next) {
        try {
            const result = await doctorService.searchDoctors(req.query);
            res.status(200).json({
                success: true,
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }

    async approveDoctor(req, res, next) {
        try {
            const { id } = req.params;
            const doctor = await doctorService.approveDoctor(req.user.id, id);
            res.status(200).json({
                success: true,
                data: doctor,
                message: 'Doctor approved successfully',
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new DoctorController();
