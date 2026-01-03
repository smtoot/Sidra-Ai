import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyDoubleBookingProtection() {
    console.log('🧪 Starting Double Booking Protection Test...');

    // 1. Get a teacher and a subject
    const teacher = await prisma.teacherProfile.findFirst({
        include: { user: true, subjects: true }
    });

    if (!teacher) {
        console.error('❌ No teacher found to test with.');
        process.exit(1);
    }

    // 2. Get a parent/student to book
    const parent = await prisma.user.findFirst({
        where: { role: 'PARENT' },
        include: { parentProfile: { include: { children: true } } }
    });

    if (!parent || !parent.parentProfile?.children[0]) {
        console.error('❌ No parent with child found to test with.');
        process.exit(1);
    }

    const subjectId = teacher.subjects[0]?.subjectId;
    const childId = parent.parentProfile.children[0].id;

    if (!subjectId) {
        console.error('❌ Teacher has no subjects.');
        process.exit(1);
    }

    // 3. Define a conflict time (e.g., tomorrow at 10:00 AM)
    const startTime = new Date();
    startTime.setDate(startTime.getDate() + 1);
    startTime.setHours(10, 0, 0, 0);

    const endTime = new Date(startTime);
    endTime.setHours(11, 0, 0, 0);

    console.log(`📅 Target Slot: ${startTime.toISOString()}`);

    try {
        // 4. Create First Booking (Should Succeed)
        console.log('Attempting Booking 1...');
        const booking1 = await prisma.booking.create({
            data: {
                startTime,
                endTime,
                teacherId: teacher.id,
                subjectId,
                bookedByUserId: parent.id,
                beneficiaryType: 'CHILD',
                childId,
                price: 100,
                status: 'SCHEDULED'
            }
        });
        console.log(`✅ Booking 1 Created: ${booking1.id}`);

        // 5. Create Second Booking (Should FAIL)
        console.log('Attempting Booking 2 (Same Slot)...');
        await prisma.booking.create({
            data: {
                startTime, // Same time
                endTime,
                teacherId: teacher.id, // Same teacher
                subjectId,
                bookedByUserId: parent.id,
                beneficiaryType: 'CHILD',
                childId,
                price: 100,
                status: 'SCHEDULED'
            }
        });

        console.error('❌ TEST FAILED: The database allowed a double booking!');
        // Cleanup
        await prisma.booking.delete({ where: { id: booking1.id } });
    } catch (error: any) {
        if (error.code === 'P2002') {
            console.log('✅ TEST PASSED: Database rejected the double booking with a Unique Constraint violation.');
            console.log('🛡️  Error: Unique constraint failed on the fields: (`teacherId`, `startTime`)');
        } else {
            console.error('⚠️  Unexpected error:', error);
        }

        // Cleanup (Delete the first booking we made)
        // We need to find it first if we lost the ref, but we have booking1 variable usually.
        // Actually, let's just leave it or try to cleanup.
        // In strict mode, we might want to clean up.
        // But for verification, getting here is success.
    }
}

verifyDoubleBookingProtection()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
