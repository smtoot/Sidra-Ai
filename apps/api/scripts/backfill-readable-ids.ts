/**
 * Backfill Readable IDs for Existing Records
 *
 * This script adds readable IDs to existing records that don't have them.
 * It's safe to run multiple times - it will only update records where readableId is null.
 *
 * Usage: npx ts-node scripts/backfill-readable-ids.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Counter cache to track next ID for each type/yearMonth
const counterCache: Map<string, number> = new Map();

async function getNextId(type: string, yearMonth: string, prefix: string, padding: number): Promise<string> {
    const key = `${type}:${yearMonth}`;

    if (!counterCache.has(key)) {
        // Get current max counter from DB
        const existing = await prisma.readable_id_counters.findUnique({
            where: { type_yearMonth: { type, yearMonth } }
        });
        counterCache.set(key, existing?.counter || 0);
    }

    const nextCounter = counterCache.get(key)! + 1;
    counterCache.set(key, nextCounter);

    return `${prefix}-${nextCounter.toString().padStart(padding, '0')}`;
}

async function updateCounters(): Promise<void> {
    // Persist all counter updates to DB
    for (const [key, counter] of counterCache.entries()) {
        const [type, yearMonth] = key.split(':');
        await prisma.readable_id_counters.upsert({
            where: { type_yearMonth: { type, yearMonth } },
            create: { type, yearMonth, counter, updatedAt: new Date() },
            update: { counter, updatedAt: new Date() }
        });
    }
}

async function backfillWallets(): Promise<number> {
    const walletsWithoutId = await prisma.wallets.findMany({
        where: { readableId: null },
        select: { id: true }
    });

    console.log(`Found ${walletsWithoutId.length} wallets without readable ID`);

    for (const wallet of walletsWithoutId) {
        const readableId = await getNextId('WALLET', 'GLOBAL', 'WAL', 6);
        await prisma.wallets.update({
            where: { id: wallet.id },
            data: { readableId }
        });
    }

    return walletsWithoutId.length;
}

async function backfillTransactions(): Promise<number> {
    const txWithoutId = await prisma.transactions.findMany({
        where: { readableId: null },
        select: { id: true, createdAt: true }
    });

    console.log(`Found ${txWithoutId.length} transactions without readable ID`);

    for (const tx of txWithoutId) {
        const d = tx.createdAt;
        const yearMonth = `${(d.getFullYear() % 100).toString().padStart(2, '0')}${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        const readableId = await getNextId('TRANSACTION', yearMonth, `TX-${yearMonth}`, 4);
        await prisma.transactions.update({
            where: { id: tx.id },
            data: { readableId }
        });
    }

    return txWithoutId.length;
}

async function backfillBookings(): Promise<number> {
    const bookingsWithoutId = await prisma.bookings.findMany({
        where: { readableId: null },
        select: { id: true, createdAt: true }
    });

    console.log(`Found ${bookingsWithoutId.length} bookings without readable ID`);

    for (const booking of bookingsWithoutId) {
        const d = booking.createdAt;
        const yearMonth = `${(d.getFullYear() % 100).toString().padStart(2, '0')}${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        const readableId = await getNextId('BOOKING', yearMonth, `BK-${yearMonth}`, 4);
        await prisma.bookings.update({
            where: { id: booking.id },
            data: { readableId }
        });
    }

    return bookingsWithoutId.length;
}

async function backfillPackages(): Promise<number> {
    const packagesWithoutId = await prisma.student_packages.findMany({
        where: { readableId: null },
        select: { id: true, purchasedAt: true }
    });

    console.log(`Found ${packagesWithoutId.length} packages without readable ID`);

    for (const pkg of packagesWithoutId) {
        const d = pkg.purchasedAt;
        const yearMonth = `${(d.getFullYear() % 100).toString().padStart(2, '0')}${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        const readableId = await getNextId('PACKAGE', yearMonth, `PKG-${yearMonth}`, 4);
        await prisma.student_packages.update({
            where: { id: pkg.id },
            data: { readableId }
        });
    }

    return packagesWithoutId.length;
}


async function main() {
    console.log('🚀 Starting Readable ID Backfill...\n');

    try {
        const walletCount = await backfillWallets();
        const txCount = await backfillTransactions();
        const bookingCount = await backfillBookings();
        const packageCount = await backfillPackages();

        // Update counters in DB
        await updateCounters();

        console.log('\n✅ Backfill Complete!');
        console.log('-------------------');
        console.log(`Wallets updated:      ${walletCount}`);
        console.log(`Transactions updated: ${txCount}`);
        console.log(`Bookings updated:     ${bookingCount}`);
        console.log(`Packages updated:     ${packageCount}`);
        console.log(`Total records:        ${walletCount + txCount + bookingCount + packageCount}`);

    } catch (error) {
        console.error('❌ Backfill failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main();
