import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('========================================');
    console.log('EDGE CASE TEST: INSUFFICIENT BALANCE');
    console.log('========================================\n');

    // Check parent's current balance
    const wallet = await prisma.wallet.findFirst({
        where: { userId: 'ec11c350-b455-4c8a-afd4-9b696b8c8b4b' }
    });

    console.log('💰 Parent Fatima wallet:');
    console.log('  Balance:', wallet?.balance.toString(), 'SDG');
    console.log('  Pending:', wallet?.pendingBalance.toString(), 'SDG');

    // Create a booking with price HIGHER than available balance
    const bookingPrice = 1000; // Parent only has 850 available

    const booking = await prisma.booking.create({
        data: {
            id: 'booking-insufficient-' + Date.now(),
            bookedByUserId: 'ec11c350-b455-4c8a-afd4-9b696b8c8b4b',
            childId: '50d25f09-9564-43de-b081-0f44d207a873',
            teacherId: 'd8f82da5-076a-4a9c-8d61-3abf43ad0e0c',
            subjectId: 'c20a54d7-3bd5-43cb-9bdc-eb6717260f8c',
            startTime: new Date('2025-12-25T10:00:00.000Z'),
            endTime: new Date('2025-12-25T11:00:00.000Z'),
            price: bookingPrice,
            status: 'PENDING_TEACHER_APPROVAL',
            beneficiaryType: 'CHILD',
            commissionRate: 0.18,
        },
    });

    console.log(`\n📝 Created booking: ${booking.id}`);
    console.log(`  Price: ${bookingPrice} SDG (exceeds available balance of 850 SDG)`);
    console.log(`  Status: ${booking.status}`);

    console.log('\n🔍 Insufficient balance test requires calling the API endpoint.');
    console.log('   The balance validation happens in the service layer.');
    console.log(`\n   Run: curl -X PATCH http://localhost:4000/bookings/${booking.id}/approve`);
    console.log(`        -H "Authorization: Bearer <teacher_token>"`);
    console.log('\n   Expected: 400 Bad Request with "Insufficient balance" error');
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
