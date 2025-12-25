// Smoke Test Verification Script
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('\\n========================================');
    console.log('  SMOKE TEST - DATABASE VERIFICATION');
    console.log('========================================\\n');

    // 1. List all wallets with balances
    console.log('📊 WALLET BALANCES:');
    console.log('-------------------');
    const wallets = await prisma.wallet.findMany({
        include: {
            user: { select: { id: true, phoneNumber: true, role: true } }
        }
    });

    wallets.forEach(w => {
        console.log(`  ${w.user.role.padEnd(10)} | ${w.user.phoneNumber} | Balance: ${w.balance} | Pending: ${w.pendingBalance}`);
    });

    // 2. Recent bookings
    console.log('\\n📅 RECENT BOOKINGS (last 5):');
    console.log('-----------------------------');
    const bookings = await prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
            bookedByUser: { select: { phoneNumber: true, role: true } },
            teacherProfile: { include: { user: { select: { phoneNumber: true } } } }
        }
    });

    bookings.forEach(b => {
        console.log(`  ID: ${b.id.slice(0, 8)}... | Status: ${b.status.padEnd(22)} | Price: ${b.price} | Parent: ${b.bookedByUser.phoneNumber} | Teacher: ${b.teacherProfile.user.phoneNumber}`);
    });

    // 3. Recent transactions
    console.log('\\n💰 RECENT TRANSACTIONS (last 10):');
    console.log('---------------------------------');
    const transactions = await prisma.transaction.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
            wallet: { include: { user: { select: { phoneNumber: true, role: true } } } }
        }
    });

    transactions.forEach(t => {
        console.log(`  ${t.type.padEnd(16)} | ${t.wallet.user.role.padEnd(10)} | Amount: ${t.amount} | Note: ${(t.adminNote || 'N/A').slice(0, 40)}`);
    });

    // 4. Check for TeacherSubjects (price per hour)
    console.log('\\n👨‍🏫 TEACHER PRICING:');
    console.log('--------------------');
    const teacherSubjects = await prisma.teacherSubject.findMany({
        take: 5,
        include: {
            teacherProfile: { include: { user: { select: { phoneNumber: true } } } },
            subject: { select: { nameAr: true } }
        }
    });

    teacherSubjects.forEach(ts => {
        console.log(`  ${ts.teacherProfile.user.phoneNumber} | ${ts.subject.nameAr} | ₹${ts.pricePerHour}/hr`);
    });

    console.log('\\n========================================');
    console.log('  VERIFICATION COMPLETE');
    console.log('========================================\\n');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
