import { PrismaClient, UserRole, Gender } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env from root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding STAGING E2E data...');

    const commonPassword = 'password123';
    const hashedPassword = await bcrypt.hash(commonPassword, 10);

    // Clean up existing E2E users
    const users = await prisma.user.findMany({
        where: {
            email: { in: ['teacher_e2e@sidra.com', 'parent_e2e@sidra.com'] }
        }
    });

    const userIds = users.map(u => u.id);

    if (userIds.length > 0) {
        // Delete dependencies first due to missing Cascades
        await prisma.booking.deleteMany({
            where: {
                OR: [
                    { teacherProfile: { userId: { in: userIds } } },
                    { bookedByUserId: { in: userIds } }
                ]
            }
        });

        const parentProfiles = await prisma.parentProfile.findMany({
            where: { userId: { in: userIds } }
        });
        const parentProfileIds = parentProfiles.map(p => p.id);

        if (parentProfileIds.length > 0) {
            await prisma.child.deleteMany({
                where: { parentId: { in: parentProfileIds } }
            });
            await prisma.parentProfile.deleteMany({
                where: { id: { in: parentProfileIds } }
            });
        }

        await prisma.teacherProfile.deleteMany({
            where: { userId: { in: userIds } }
        });

        await prisma.user.deleteMany({
            where: { id: { in: userIds } }
        });
        console.log('Cleaned up previous E2E users.');
    }

    // Get Base Data
    const math = await prisma.subject.findFirst({ where: { nameEn: 'Mathematics' } });
    const sudanese = await prisma.curriculum.findFirst({ where: { nameEn: 'Sudanese Curriculum' } });

    if (!math || !sudanese) {
        throw new Error("Missing base data (Math or Sudanese Curriculum). Run main seed first.");
    }

    // 1. Create Teacher
    const teacher = await prisma.user.create({
        data: {
            email: 'teacher_e2e@sidra.com',
            passwordHash: hashedPassword,
            role: UserRole.TEACHER,
            isVerified: true,
            isActive: true,
            teacherProfile: {
                create: {
                    displayName: "Teacher E2E",
                    bio: 'Experienced E2E Teacher for testing.',
                    yearsOfExperience: 10,
                    education: 'PhD in Testing',
                    gender: Gender.MALE,
                    hasCompletedOnboarding: true,
                    onboardingStep: 4,
                    timezone: 'UTC', // Explicitly set UTC
                    availability: {
                        create: [
                            { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '17:00' },
                            { dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '17:00' },
                            { dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '17:00' },
                            { dayOfWeek: 'THURSDAY', startTime: '09:00', endTime: '17:00' },
                            { dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '17:00' },
                            { dayOfWeek: 'SATURDAY', startTime: '09:00', endTime: '17:00' },
                            { dayOfWeek: 'SUNDAY', startTime: '09:00', endTime: '17:00' },
                        ]
                    },
                    subjects: {
                        create: {
                            subjectId: math.id,
                            curriculumId: sudanese.id,
                            pricePerHour: 1000,
                        }
                    }
                }
            }
        },
    });
    console.log(`Created Teacher: ${teacher.email}`);

    // 2. Create Parent
    const parent = await prisma.user.create({
        data: {
            email: 'parent_e2e@sidra.com',
            passwordHash: hashedPassword,
            role: UserRole.PARENT,
            isVerified: true,
            isActive: true,
            parentProfile: {
                create: {
                    children: {
                        create: [
                            { name: "Child Alpha", gradeLevel: "Year 1" }
                        ]
                    }
                }
            }
        },
    });
    console.log(`Created Parent: ${parent.email}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
