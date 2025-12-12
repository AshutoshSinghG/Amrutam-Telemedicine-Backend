import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/crypto.js';
import { logger } from '../src/config/logger.js';

const prisma = new PrismaClient();

async function main() {
    logger.info('Starting database seed...');

    // Create admin user
    const adminPassword = await hashPassword('Admin@123456');
    const admin = await prisma.user.upsert({
        where: { email: 'admin@amrutam.health' },
        update: {},
        create: {
            email: 'admin@amrutam.health',
            passwordHash: adminPassword,
            role: 'ADMIN',
            isEmailVerified: true,
            mfaEnabled: true,
            profile: {
                create: {
                    fullName: 'System Administrator',
                    gender: 'PREFER_NOT_TO_SAY',
                },
            },
        },
    });

    logger.info({ userId: admin.id }, 'Admin user created');

    // Create sample doctor
    const doctorPassword = await hashPassword('Doctor@123456');
    const doctorUser = await prisma.user.upsert({
        where: { email: 'doctor@amrutam.health' },
        update: {},
        create: {
            email: 'doctor@amrutam.health',
            passwordHash: doctorPassword,
            role: 'DOCTOR',
            isEmailVerified: true,
            profile: {
                create: {
                    fullName: 'Dr. Sarah Johnson',
                    gender: 'FEMALE',
                    phone: '+91-9876543210',
                },
            },
        },
    });

    const doctor = await prisma.doctor.upsert({
        where: { userId: doctorUser.id },
        update: {},
        create: {
            userId: doctorUser.id,
            specialization: 'General Medicine',
            yearsOfExperience: 10,
            registrationNumber: 'MED-2014-12345',
            clinicName: 'Amrutam Health Clinic',
            consultationFee: 500,
            languagesSpoken: ['English', 'Hindi'],
            bio: 'Experienced general physician with focus on preventive care',
            isApproved: true,
            rating: 4.5,
        },
    });

    logger.info({ doctorId: doctor.id }, 'Sample doctor created');

    // Create sample patient
    const patientPassword = await hashPassword('Patient@123456');
    const patient = await prisma.user.upsert({
        where: { email: 'patient@amrutam.health' },
        update: {},
        create: {
            email: 'patient@amrutam.health',
            passwordHash: patientPassword,
            role: 'PATIENT',
            isEmailVerified: true,
            profile: {
                create: {
                    fullName: 'John Doe',
                    gender: 'MALE',
                    dateOfBirth: new Date('1990-01-15'),
                    phone: '+91-9876543211',
                },
            },
        },
    });

    logger.info({ userId: patient.id }, 'Sample patient created');

    logger.info('Database seed completed successfully!');
    logger.info('Sample credentials:');
    logger.info('  Admin: admin@amrutam.health / Admin@123456');
    logger.info('  Doctor: doctor@amrutam.health / Doctor@123456');
    logger.info('  Patient: patient@amrutam.health / Patient@123456');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
