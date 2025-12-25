
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Slug Generation Logic
const transliterationMap: Record<string, string> = {
    'أ': 'a', 'إ': 'e', 'آ': 'a', 'ا': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th',
    'ج': 'j', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'th', 'ر': 'r', 'ز': 'z',
    'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a',
    'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
    'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ة': 'h', 'ء': '', 'ؤ': 'o',
    'ئ': 'e'
};

function transliterate(text: string): string {
    let result = '';
    for (const char of text) {
        if (transliterationMap[char]) {
            result += transliterationMap[char];
        } else if (/[a-zA-Z0-9]/.test(char)) {
            result += char;
        } else if (char === ' ' || char === '-') {
            result += '-';
        }
    }
    return result;
}

function generateSlug(displayName: string): string | null {
    if (!displayName) return null;
    let slug: string | null = transliterate(displayName).toLowerCase();
    slug = slug.replace(/[^a-z0-9-]/g, '');
    slug = slug.replace(/-+/g, '-');
    slug = slug.replace(/^-|-$/g, '');
    if (slug.length < 3) slug = null;
    if (slug && slug.length > 50) slug = slug.substring(0, 50);
    return slug;
}

// Readable ID Generation Logic
async function generateReadableId(type: 'BOOKING' | 'TRANSACTION' | 'PACKAGE' | 'WALLET', date?: Date): Promise<string> {
    const prefixMap = {
        BOOKING: 'BK',
        TRANSACTION: 'TX',
        PACKAGE: 'PKG',
        WALLET: 'WAL'
    };

    const prefix = prefixMap[type];

    if (type === 'WALLET') {
        // Global sequential for wallets: WAL-000001
        const counterName = 'WALLET_GLOBAL';
        // Upsert counter
        let counter = await prisma.readableIdCounter.findUnique({
            where: { type_yearMonth: { type: 'WALLET', yearMonth: 'GLOBAL' } }
        });

        if (!counter) {
            counter = await prisma.readableIdCounter.create({
                data: { type: 'WALLET', yearMonth: 'GLOBAL', counter: 0 }
            });
        }

        const updated = await prisma.readableIdCounter.update({
            where: { id: counter.id },
            data: { counter: { increment: 1 } }
        });

        return `${prefix}-${updated.counter.toString().padStart(6, '0')}`;
    } else {
        // Monthly sequential: BK-2512-0001
        const d = date || new Date();
        const yearMonth = `${(d.getFullYear() % 100).toString().padStart(2, '0')}${(d.getMonth() + 1).toString().padStart(2, '0')}`;

        let counter = await prisma.readableIdCounter.findUnique({
            where: { type_yearMonth: { type, yearMonth } }
        });

        if (!counter) {
            // Try creating, handle race condition if running in parallel (though script is sequential)
            try {
                counter = await prisma.readableIdCounter.create({
                    data: { type, yearMonth, counter: 0 }
                });
            } catch (e) {
                counter = await prisma.readableIdCounter.findUnique({
                    where: { type_yearMonth: { type, yearMonth } }
                });
            }
        }

        if (!counter) throw new Error('Failed to init counter');

        const updated = await prisma.readableIdCounter.update({
            where: { id: counter.id },
            data: { counter: { increment: 1 } }
        });

        return `${prefix}-${yearMonth}-${updated.counter.toString().padStart(4, '0')}`;
    }
}

async function main() {
    console.log('Starting backfill...');

    // 1. Backfill Teacher Slugs
    console.log('--- Backfilling Teacher Slugs ---');
    const teachers = await prisma.teacherProfile.findMany({
        where: { slug: null, displayName: { not: null } }
    });

    for (const teacher of teachers) {
        if (!teacher.displayName) continue;
        let slug = generateSlug(teacher.displayName);
        if (slug) {
            // Ensure uniqueness
            let uniqueSlug = slug;
            let counter = 1;
            while (await prisma.teacherProfile.findFirst({ where: { slug: uniqueSlug } })) {
                uniqueSlug = `${slug}-${counter}`;
                counter++;
            }

            console.log(`Updating teacher ${teacher.displayName} -> ${uniqueSlug}`);
            await prisma.teacherProfile.update({
                where: { id: teacher.id },
                data: { slug: uniqueSlug }
            });
        }
    }

    // 2. Backfill Booking Readable IDs
    console.log('\n--- Backfilling Booking Readable IDs ---');
    const bookings = await prisma.booking.findMany({
        where: { readableId: null },
        orderBy: { createdAt: 'asc' } // Process oldest first to keep order somewhat logical
    });

    for (const booking of bookings) {
        const readableId = await generateReadableId('BOOKING', booking.createdAt);
        console.log(`Updating booking ${booking.id} -> ${readableId}`);
        await prisma.booking.update({
            where: { id: booking.id },
            data: { readableId }
        });
    }

    // 3. Backfill Transaction Readable IDs
    console.log('\n--- Backfilling Transaction Readable IDs ---');
    const transactions = await prisma.transaction.findMany({
        where: { readableId: null },
        orderBy: { createdAt: 'asc' }
    });

    for (const tx of transactions) {
        const readableId = await generateReadableId('TRANSACTION', tx.createdAt);
        console.log(`Updating transaction ${tx.id} -> ${readableId}`);
        await prisma.transaction.update({
            where: { id: tx.id },
            data: { readableId }
        });
    }

    // 4. Backfill Wallets
    console.log('\n--- Backfilling Wallet Readable IDs ---');
    const wallets = await prisma.wallet.findMany({
        where: { readableId: null },
        orderBy: { createdAt: 'asc' }
    });

    for (const wallet of wallets) {
        const readableId = await generateReadableId('WALLET', wallet.createdAt);
        console.log(`Updating wallet ${wallet.id} -> ${readableId}`);
        await prisma.wallet.update({
            where: { id: wallet.id },
            data: { readableId }
        });
    }

    // 5. Backfill Student Packages
    console.log('\n--- Backfilling Student Package Readable IDs ---');
    const packages = await prisma.studentPackage.findMany({
        where: { readableId: null },
        orderBy: { purchasedAt: 'asc' }
    });

    for (const pkg of packages) {
        const readableId = await generateReadableId('PACKAGE', pkg.purchasedAt);
        console.log(`Updating package ${pkg.id} -> ${readableId}`);
        await prisma.studentPackage.update({
            where: { id: pkg.id },
            data: { readableId }
        });
    }

    console.log('\nBackfill complete! ✅');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
