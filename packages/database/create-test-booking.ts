import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Create a test booking in PENDING_TEACHER_APPROVAL status with CORRECT IDs
    const booking = await prisma.booking.create({
        data: {
            id: 'booking-test-' + Date.now(),
            bookedByUserId: 'ec11c350-b455-4c8a-afd4-9b696b8c8b4b', // Parent Fatima (user ID)
            childId: '50d25f09-9564-43de-b081-0f44d207a873', // Child Mohammed (CORRECT child ID from DB)
            teacherId: 'd8f82da5-076a-4a9c-8d61-3abf43ad0e0c', // Teacher Ahmed (profile ID)
            subjectId: 'c20a54d7-3bd5-43cb-9bdc-eb6717260f8c', // Mathematics
            startTime: new Date('2025-12-22T10:00:00.000Z'),
            endTime: new Date('2025-12-22T11:00:00.000Z'),
            price: 150,
            status: 'PENDING_TEACHER_APPROVAL',
            beneficiaryType: 'CHILD',
            commissionRate: 0.18,
        },
    });

    console.log('✅ Test booking created successfully!');
    console.log('Booking ID:', booking.id);
    console.log('Status:', booking.status);
    console.log('Price:', booking.price);
    console.log('Teacher Profile ID:', booking.teacherId);
    console.log('Parent User ID:', booking.bookedByUserId);

    // Verify transaction count is still 5 (no payment lock created yet)
    const transactionCount = await prisma.transaction.count();
    console.log('\n📊 Current transaction count:', transactionCount);
    console.log('Expected: 5 (no payment lock yet)');

    // Show parent wallet balance
    const parentWallet = await prisma.wallet.findFirst({
        where: { userId: 'ec11c350-b455-4c8a-afd4-9b696b8c8b4b' },
    });
    console.log('\n💰 Parent Fatima wallet BEFORE approval:');
    console.log('Balance:', parentWallet?.balance);
    console.log('Pending Balance:', parentWallet?.pendingBalance);

    console.log('\n🎯 Next: Call POST /bookings/' + booking.id + '/approve to test payment lock');
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
