/**
 * Cleanup Script: Remove existing DemoSession records that block users
 * from booking new demos after teacher rejection.
 * 
 * Run with: node scripts/cleanup-rejected-demos.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Finding DemoSessions for rejected bookings...');

    // Find all rejected demo bookings (price = 0, status = REJECTED_BY_TEACHER)
    const rejectedDemoBookings = await prisma.booking.findMany({
        where: {
            price: 0, // Demo bookings have price = 0
            status: 'REJECTED_BY_TEACHER',
        },
        select: {
            id: true,
            bookedByUserId: true,
            teacherId: true,
            readableId: true,
            createdAt: true,
        },
    });

    console.log(`Found ${rejectedDemoBookings.length} rejected demo booking(s)`);

    let deletedCount = 0;

    for (const booking of rejectedDemoBookings) {
        // Delete the corresponding DemoSession record if it exists
        const deleted = await prisma.demoSession.deleteMany({
            where: {
                demoOwnerId: booking.bookedByUserId,
                teacherId: booking.teacherId,
                status: 'SCHEDULED', // Only delete scheduled ones
            },
        });

        if (deleted.count > 0) {
            console.log(`Deleted DemoSession for booking ${booking.readableId} (user ${booking.bookedByUserId} -> teacher ${booking.teacherId})`);
            deletedCount += deleted.count;
        }
    }

    // Also delete any orphaned DemoSession with SCHEDULED status
    // that doesn't have an active booking (covers edge cases)
    const orphanedDemos = await prisma.demoSession.findMany({
        where: { status: 'SCHEDULED' },
        select: { id: true, demoOwnerId: true, teacherId: true },
    });

    console.log(`\nChecking ${orphanedDemos.length} scheduled DemoSession(s) for orphans...`);

    for (const demo of orphanedDemos) {
        // Check if there's an active pending booking
        const activeBooking = await prisma.booking.findFirst({
            where: {
                bookedByUserId: demo.demoOwnerId,
                teacherId: demo.teacherId,
                price: 0,
                status: 'PENDING_TEACHER_APPROVAL',
            },
        });

        if (!activeBooking) {
            // This is an orphan - delete it
            await prisma.demoSession.delete({ where: { id: demo.id } });
            console.log(`Deleted orphaned DemoSession ${demo.id}`);
            deletedCount++;
        }
    }

    console.log(`\nDone! Deleted ${deletedCount} blocking DemoSession record(s)`);
    console.log('Users can now book new demos with teachers who previously rejected them.');
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
