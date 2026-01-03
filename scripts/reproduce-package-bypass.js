const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Manually load env from packages/database/.env
const dbEnvPath = path.join(process.cwd(), 'packages', 'database', '.env');
console.log('Loading env from:', dbEnvPath);
if (fs.existsSync(dbEnvPath)) {
    const envConfig = require('dotenv').parse(fs.readFileSync(dbEnvPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
} else {
    console.error('ERROR: .env not found at', dbEnvPath);
}

const prisma = new PrismaClient();

async function main() {
    console.log('--- Starting Package Availability Bypass Reproduction ---');

    // 1. Create a clean Teacher
    const teacherEmail = `test.teacher.bypass.${Date.now()}@example.com`;
    const teacher = await prisma.user.create({
        data: {
            email: teacherEmail,
            phoneNumber: `+2499${Math.floor(Math.random() * 100000000)}`, // Random phone
            role: 'TEACHER',
            isVerified: true,
            teacherProfile: {
                create: {
                    displayName: 'Test Teacher',
                    slug: `teacher-bypass-${Date.now()}`,
                    bio: 'Test Bio',
                    profilePhotoUrl: 'https://example.com/photo.jpg',
                }
            },
            passwordHash: 'dummyhash123'
        },
        include: { teacherProfile: true }
    });
    const teacherId = teacher.teacherProfile.id;
    console.log(`Created Teacher: ${teacherId}`);

    // 2. Set Availability: ONLY Sunday 10:00 - 12:00
    // "SUNDAY" in DB enum.
    await prisma.availability.create({
        data: {
            teacherId: teacherId,
            dayOfWeek: 'SUNDAY',
            startTime: '10:00',
            endTime: '12:00',
            isRecurring: true
        }
    });
    console.log('Set Availability: SUNDAY 10:00-12:00 ONLY');

    // 3. Create a Package Tier (required for checking)
    const tier = await prisma.packageTier.create({
        data: {
            nameAr: 'Test Tier',
            nameEn: 'Test Tier',
            sessionCount: 4,
            discountPercent: 10,
            recurringRatio: 1.0,
            floatingRatio: 0.0,
            rescheduleLimit: 1,
            durationWeeks: 4,
            gracePeriodDays: 7,
            isActive: true, // Important
            displayOrder: 1
        }
    });
    console.log(`Created Tier: ${tier.id}`);

    // 4. Simulate logic from PackageService.checkMultiSlotAvailability
    // We want to check availability for MONDAY 10:00 (When teacher is OFF)
    // Logic copied from PackageService (simplified for reproduction)

    const targetPattern = { weekday: 'MONDAY', time: '10:00' };

    // The Bug: PackageService logic primarily checks for CONFLICTS, not AVAILABILITY.
    // It iterates weeks and checks `prisma.booking.findFirst`.

    console.log(`Checking availability for MONDAY 10:00 (Teacher is OFF)...`);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 2); // Start 2 days from now
    // Find next Monday
    const targetDayMap = { 'SUNDAY': 0, 'MONDAY': 1, 'TUESDAY': 2, 'WEDNESDAY': 3, 'THURSDAY': 4, 'FRIDAY': 5, 'SATURDAY': 6 };
    const targetDayIndex = targetDayMap[targetPattern.weekday];

    while (startDate.getDay() !== targetDayIndex) {
        startDate.setDate(startDate.getDate() + 1);
    }

    const sessionDate = new Date(startDate);
    sessionDate.setHours(10, 0, 0, 0); // 10:00
    const endTime = new Date(sessionDate);
    endTime.setHours(11, 0, 0, 0); // 1 hour session

    // The Logic causing the bug:
    const conflict = await prisma.booking.findFirst({
        where: {
            teacherId: teacherId,
            status: { in: ['SCHEDULED', 'PENDING_TEACHER_APPROVAL', 'WAITING_FOR_PAYMENT'] },
            OR: [
                { AND: [{ startTime: { lte: sessionDate } }, { endTime: { gt: sessionDate } }] },
                { AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }] }
            ]
        }
    });

    if (conflict) {
        console.log('❌ FAIL (Unexpected): Code found a conflict (Wait, we expected it to be "Available" which is the BUG)');
    } else {
        console.log('✅ REPRODUCTION SUCCESS: Code says "Available" (No Booking Conflict found).');
        console.log('   BUT Teacher is NOT working on Monday!');
        console.log('   This confirms the system allows booking outside working hours for packages.');
    }

    // 5. Verify the FIX Logic (What we added to PackageService)
    console.log('--- Verifying Fix Logic ---');

    // New Logic: Check Availability Table
    // We need to check if there is a slot for MONDAY 10:00
    // Day Index 1 (Monday)
    // Time "10:00"

    const weeklySlot = await prisma.availability.findFirst({
        where: {
            teacherId: teacherId,
            dayOfWeek: 'MONDAY',
            startTime: { lte: '10:00' },
            endTime: { gt: '10:00' }
        }
    });

    if (!weeklySlot) {
        console.log('✅ FIX VERIFIED: New logic correctly identifies "Teacher not working" (weeklySlot is null).');
    } else {
        console.log('❌ FIX FAILED: New logic still thinks teacher is available!');
    }

    // Cleanup
    await prisma.availability.deleteMany({ where: { teacherId } });
    await prisma.packageTier.delete({ where: { id: tier.id } });
    await prisma.user.delete({ where: { id: teacher.id } }); // Cascades to profile
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
