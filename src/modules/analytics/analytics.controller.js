import analyticsService from './analytics.service.js';

class AnalyticsController {
    async getSummary(req, res, next) {
        try {
            const summary = await analyticsService.getSummary();
            res.status(200).json({
                success: true,
                data: summary,
            });
        } catch (error) {
            next(error);
        }
    }

    async getConsultationsPerDay(req, res, next) {
        try {
            const { startDate, endDate } = req.query;
            const data = await analyticsService.getConsultationsPerDay(startDate, endDate);
            res.status(200).json({
                success: true,
                data,
            });
        } catch (error) {
            next(error);
        }
    }

    async getConversionRate(req, res, next) {
        try {
            const data = await analyticsService.getConversionRate();
            res.status(200).json({
                success: true,
                data,
            });
        } catch (error) {
            next(error);
        }
    }

    async getDoctorUtilization(req, res, next) {
        try {
            const data = await analyticsService.getDoctorUtilization();
            res.status(200).json({
                success: true,
                data,
            });
        } catch (error) {
            next(error);
        }
    }

    async getTopSpecializations(req, res, next) {
        try {
            const { limit } = req.query;
            const data = await analyticsService.getTopSpecializations(limit ? parseInt(limit) : 10);
            res.status(200).json({
                success: true,
                data,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new AnalyticsController();
