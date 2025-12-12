import availabilityService from './availability.service.js';

class AvailabilityController {
    async createSlot(req, res, next) {
        try {
            const slot = await availabilityService.createSlot(req.user.id, req.body);
            res.status(201).json({
                success: true,
                data: slot,
                message: 'Availability slot created successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    async getAvailableSlots(req, res, next) {
        try {
            const { doctorId } = req.params;
            const slots = await availabilityService.getAvailableSlots(doctorId, req.query);
            res.status(200).json({
                success: true,
                data: slots,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateSlot(req, res, next) {
        try {
            const { id } = req.params;
            const slot = await availabilityService.updateSlot(req.user.id, id, req.body);
            res.status(200).json({
                success: true,
                data: slot,
                message: 'Slot updated successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteSlot(req, res, next) {
        try {
            const { id } = req.params;
            const result = await availabilityService.deleteSlot(req.user.id, id);
            res.status(200).json({
                success: true,
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new AvailabilityController();
