
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Starting ReadableIdCounter reconciliation...');

    // 1. Fix TICKET counters
    console.log('Checking Support Tickets...');
    const tickets = await prisma.supportTicket.findMany({
        select: { readableId: true }
    });

    const ticketCounters = new Map<string, number>();

    for (const t of tickets) {
        if (!t.readableId || !t.readableId.startsWith('TKT-')) continue;

        // Format: TKT-YYMM-NNNN
        const parts = t.readableId.split('-');
        if (parts.length !== 3) continue;

        const yearMonth = parts[1];
        const counter = parseInt(parts[2], 10);

        if (!isNaN(counter)) {
            const currentMax = ticketCounters.get(yearMonth) || 0;
            if (counter > currentMax) {
                ticketCounters.set(yearMonth, counter);
            }
        }
    }

    for (const [yearMonth, maxCount] of ticketCounters.entries()) {
        console.log(`Updating TICKET for ${yearMonth} to max: ${maxCount}`);
        await prisma.readableIdCounter.upsert({
            where: {
                type_yearMonth: { type: 'TICKET', yearMonth }
            },
            update: {
                counter: { set: maxCount } // The service increments BEFORE using, wait.
                // Service: increment -> return updated.counter.
                // So if max is 5, we should set it to 5.
                // Next call: increment to 6, return 6. Correct.
                // Wait, if I set to 5. Next call increments to 6. ID becomes ...-0006.
                // If 5 exists, next should be 6. Correct.
            },
            create: {
                type: 'TICKET',
                yearMonth,
                counter: maxCount
            }
        });
    }

    console.log('✅ TICKET counters reconciled.');

    // 2. Fix BOOKING counters
    console.log('Checking Bookings...');
    const bookings = await prisma.booking.findMany({ select: { readableId: true } });
    const bookingCounters = new Map<string, number>();

    for (const b of bookings) {
        if (!b.readableId || !b.readableId.startsWith('BK-')) continue;
        const parts = b.readableId.split('-'); // BK-YYMM-NNNN
        if (parts.length !== 3) continue;
        const yearMonth = parts[1];
        const counter = parseInt(parts[2], 10);
        if (!isNaN(counter)) {
            const current = bookingCounters.get(yearMonth) || 0;
            if (counter > current) bookingCounters.set(yearMonth, counter);
        }
    }

    for (const [yearMonth, maxCount] of bookingCounters.entries()) {
        console.log(`Updating BOOKING for ${yearMonth} to max: ${maxCount}`);
        await prisma.readableIdCounter.upsert({
            where: { type_yearMonth: { type: 'BOOKING', yearMonth } },
            update: { counter: { set: maxCount } },
            create: { type: 'BOOKING', yearMonth, counter: maxCount }
        });
    }

    // 3. Fix TRANSACTION ID
    // TXN-YYMM-NNNN
    // ... similar logic ...

    console.log('✅ Done.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
