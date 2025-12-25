
import { PrismaClient, TransactionType } from '@prisma/client';
import { ReadableIdService } from '../apps/api/src/common/readable-id/readable-id.service';

// Mock ReadableIdService to use Prisma directly or reuse logic
// Since we can't easily import the NestJS service here without context, 
// we'll implement a simplified version or try to run this within Nest context.
// For simplicity, we will assume we can use Prisma directly and implement the generation logic.
// Or better, creating a standalone script that instantiates Prisma.

const prisma = new PrismaClient();

async function backfill() {
    console.log('Starting backfill of Readable IDs...');

    // 1. Wallets
    const wallets = await prisma.wallet.findMany({ where: { readableId: null } });
    console.log(`Found ${wallets.length} wallets to backfill.`);

    let walletCounter = 1;
    // Get max current global counter if any (simulated) - ideally we should rely on the service logic.
    // For backfill, we can just start from 1 if no readable IDs exist, or we need to be careful.
    // If we want to safely backfill, we should likely generate IDs sequentially.

    // NOTE: This script assumes we are starting fresh or appending. 
    // If IDs already exist, we should fetch the latest sequence.
    // However, ReadableIdService uses a separate Counter table. 
    // If we bypass it, we might cause collisions.
    // The best way is to use the logic from ReadableIdService.

    // We will simulate the logic:

    // BACKFILL WALLETS (Global sequence)
    // We need to fetch the current counter for WALLET from ReadableIdCounter if it exists
    let walletSeq = await getNextSequence('WALLET');

    for (const wallet of wallets) {
        const readableId = `WAL-${String(walletSeq).padStart(6, '0')}`;
        await prisma.wallet.update({
            where: { id: wallet.id },
            data: { readableId }
        });
        console.log(`Updated Wallet ${wallet.id} -> ${readableId}`);
        walletSeq++;
    }
    await updateSequence('WALLET', walletSeq);

    // 2. Transactions
    // Transactions are monthly based: TX-YYMM-XXXX
    const transactions = await prisma.transaction.findMany({
        where: { readableId: null },
        orderBy: { createdAt: 'asc' }
    });
    console.log(`Found ${transactions.length} transactions to backfill.`);

    // Group by Month
    const txByMonth: Record<string, typeof transactions> = {};
    for (const tx of transactions) {
        const date = new Date(tx.createdAt);
        const key = `${date.getFullYear().toString().slice(-2)}${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!txByMonth[key]) txByMonth[key] = [];
        txByMonth[key].push(tx);
    }

    for (const [yymm, txs] of Object.entries(txByMonth)) {
        // Get sequence for this month
        let seq = await getNextSequence('TRANSACTION', yymm);

        for (const tx of txs) {
            const readableId = `TX-${yymm}-${String(seq).padStart(4, '0')}`;
            await prisma.transaction.update({
                where: { id: tx.id },
                data: { readableId }
            });
            process.stdout.write('.'); // progress
            seq++;
        }
        await updateSequence('TRANSACTION', seq, yymm);
        console.log(`\nCompleted Month ${yymm}`);
    }

    // 3. Packages
    // PKG-YYMM-XXXX
    const packages = await prisma.studentPackage.findMany({
        where: { readableId: null },
        orderBy: { purchasedAt: 'asc' }
    });
    console.log(`Found ${packages.length} packages to backfill.`);

    const pkgByMonth: Record<string, typeof packages> = {};
    for (const pkg of packages) {
        const date = new Date(pkg.purchasedAt);
        const key = `${date.getFullYear().toString().slice(-2)}${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!pkgByMonth[key]) pkgByMonth[key] = [];
        pkgByMonth[key].push(pkg);
    }

    for (const [yymm, pkgs] of Object.entries(pkgByMonth)) {
        let seq = await getNextSequence('PACKAGE', yymm);
        for (const pkg of pkgs) {
            const readableId = `PKG-${yymm}-${String(seq).padStart(4, '0')}`;
            await prisma.studentPackage.update({
                where: { id: pkg.id },
                data: { readableId }
            });
            process.stdout.write('.');
            seq++;
        }
        await updateSequence('PACKAGE', seq, yymm);
        console.log(`\nCompleted Packages Month ${yymm}`);
    }

    // 4. Bookings
    // BOOK-YYMM-XXXX
    const bookings = await prisma.booking.findMany({
        where: { readableId: null },
        orderBy: { createdAt: 'asc' }
    });
    console.log(`Found ${bookings.length} bookings to backfill.`);

    const bookingsByMonth: Record<string, typeof bookings> = {};
    for (const b of bookings) {
        const date = new Date(b.createdAt);
        const key = `${date.getFullYear().toString().slice(-2)}${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!bookingsByMonth[key]) bookingsByMonth[key] = [];
        bookingsByMonth[key].push(b);
    }

    for (const [yymm, bks] of Object.entries(bookingsByMonth)) {
        let seq = await getNextSequence('BOOKING', yymm);
        for (const b of bks) {
            const readableId = `BOOK-${yymm}-${String(seq).padStart(4, '0')}`;
            await prisma.booking.update({
                where: { id: b.id },
                data: { readableId }
            });
            process.stdout.write('.');
            seq++;
        }
        await updateSequence('BOOKING', seq, yymm);
        console.log(`\nCompleted Bookings Month ${yymm}`);
    }

    console.log('Backfill complete!');
}

async function getNextSequence(type: string, yearMonth?: string): Promise<number> {
    const record = await prisma.readableIdCounter.findFirst({
        where: {
            type,
            yearMonth: yearMonth || null
        }
    });

    if (record) {
        return record.counter + 1;
    }

    return 1;
}

async function updateSequence(type: string, nextSeq: number, yearMonth?: string) {
    const currentSeq = nextSeq - 1;

    const existing = await prisma.readableIdCounter.findFirst({
        where: {
            type,
            yearMonth: yearMonth || null
        }
    });

    if (existing) {
        await prisma.readableIdCounter.update({
            where: { id: existing.id },
            data: { counter: currentSeq }
        });
    } else {
        await prisma.readableIdCounter.create({
            data: {
                type,
                yearMonth: yearMonth || null,
                counter: currentSeq
            }
        });
    }
}

backfill()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
