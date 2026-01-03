/**
 * Database Index Management Script
 * 
 * This script creates indexes that cannot be managed through Prisma schema (e.g., partial indexes).
 * Run this script after `prisma db push` to ensure all performance indexes are in place.
 * 
 * Usage: npx ts-node scripts/db/ensure-indexes.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Ensuring database indexes...');

    // =================================================================
    // PARTIAL UNIQUE INDEX: Prevent double-booking for ACTIVE slots only
    // =================================================================
    // This allows cancelled/rejected bookings to stay in DB without
    // blocking new bookings for the same slot.
    // 
    // The standard @@unique([teacherId, startTime]) in Prisma blocks ALL
    // bookings regardless of status. This partial index only blocks
    // active statuses.
    // =================================================================

    try {
        await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "unique_active_booking_slot"
      ON "bookings" ("teacherId", "startTime")
      WHERE "status" NOT IN (
        'CANCELLED_BY_PARENT',
        'CANCELLED_BY_TEACHER',
        'REJECTED_BY_TEACHER',
        'EXPIRED'
      );
    `;
        console.log('✅ Partial unique index "unique_active_booking_slot" ensured.');
    } catch (error: any) {
        // Index might already exist - that's fine
        if (error.code === '42P07' || error.message?.includes('already exists')) {
            console.log('ℹ️  Index "unique_active_booking_slot" already exists.');
        } else {
            console.error('❌ Failed to create partial index:', error.message);
            throw error;
        }
    }

    console.log('✅ All indexes ensured successfully.');
}

main()
    .catch((e) => {
        console.error('Script failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
