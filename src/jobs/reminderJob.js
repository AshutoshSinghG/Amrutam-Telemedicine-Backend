import { prisma } from '../config/database.js';
import { logger } from '../config/logger.js';
import { config } from '../config/env.js';
import { addHours } from '../utils/time.js';

let reminderInterval;

// Check for upcoming consultations and send reminders
const checkUpcomingConsultations = async () => {
    try {
        const now = new Date();
        const reminderWindow = addHours(now, config.REMINDER_HOURS_BEFORE);

        const upcomingConsultations = await prisma.consultation.findMany({
            where: {
                status: 'CONFIRMED',
                slot: {
                    startTime: {
                        gte: now,
                        lte: reminderWindow,
                    },
                },
            },
            include: {
                patient: { include: { profile: true } },
                doctor: { include: { profile: true } },
                slot: true,
            },
        });

        for (const consultation of upcomingConsultations) {
            // Send reminder (stubbed - would integrate with email/SMS service)
            logger.info(
                {
                    consultationId: consultation.id,
                    patientEmail: consultation.patient.email,
                    doctorEmail: consultation.doctor.email,
                    slotTime: consultation.slot.startTime,
                },
                `[REMINDER STUB] Consultation reminder: ${consultation.patient.profile.fullName} with Dr. ${consultation.doctor.profile.fullName} at ${consultation.slot.startTime}`
            );
        }

        if (upcomingConsultations.length > 0) {
            logger.info({ count: upcomingConsultations.length }, 'Sent consultation reminders');
        }
    } catch (error) {
        logger.error({ error }, 'Error checking upcoming consultations');
    }
};

export const startReminderJob = () => {
    // Run every 15 minutes
    const interval = 15 * 60 * 1000;

    logger.info({ intervalMinutes: 15 }, 'Starting reminder job');

    // Run immediately on start
    checkUpcomingConsultations();

    // Then run on interval
    reminderInterval = setInterval(checkUpcomingConsultations, interval);
};

export const stopReminderJob = () => {
    if (reminderInterval) {
        clearInterval(reminderInterval);
        logger.info('Reminder job stopped');
    }
};
