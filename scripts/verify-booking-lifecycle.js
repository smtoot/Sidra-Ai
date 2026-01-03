
const fetch = require('node-fetch');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5001';

// Env setup
const paths = [
    path.join(__dirname, '../apps/api/.env'),
    path.join(__dirname, 'packages/database/.env'),
    path.join(__dirname, '../packages/database/.env'),
    path.join(__dirname, '../packages/database/prisma/.env')
];
let databaseUrl = 'postgresql://postgres:postgres@localhost:5432/sidra_db?schema=public';
for (const envPath of paths) {
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/DATABASE_URL=(.*)/);
        if (match && match[1]) {
            let url = match[1].trim();
            if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) url = url.slice(1, -1);
            if (url) { databaseUrl = url; break; }
        }
    }
}

const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

async function createTestUsers(prefix) {
    const timestamp = Date.now();
    const teacherEmail = `teacher.${prefix}.${timestamp}@test.com`;
    const parentEmail = `parent.${prefix}.${timestamp}@test.com`;

    // Teacher
    await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: `9${timestamp.toString().slice(-8)}`, email: teacherEmail, password: 'Password123!', firstName: 'Test', lastName: 'T', role: 'TEACHER' })
    });
    const teacherUser = await prisma.user.findFirst({ where: { email: teacherEmail }, include: { teacherProfile: true } });
    await prisma.teacherProfile.update({
        where: { userId: teacherUser.id },
        data: { applicationStatus: 'APPROVED', bio: 'Test Bio' }
    });
    // Wallet for Teacher (Receive funds)
    await prisma.wallet.upsert({
        where: { userId: teacherUser.id },
        create: { userId: teacherUser.id, balance: 0, currency: 'SDG' },
        update: { balance: 0 }
    });

    // Subject & Availability
    let subject = await prisma.subject.findFirst();
    let curriculum = await prisma.curriculum.findFirst();
    await prisma.teacherSubject.create({
        data: { teacherId: teacherUser.teacherProfile.id, subjectId: subject.id, curriculumId: curriculum.id, pricePerHour: 100 }
    });
    for (const day of ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']) {
        await prisma.availability.create({
            data: { teacherId: teacherUser.teacherProfile.id, dayOfWeek: day, startTime: '00:00', endTime: '23:59', isRecurring: true }
        });
    }

    // Parent
    const parentRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: `8${timestamp.toString().slice(-8)}`, email: parentEmail, password: 'Password123!', firstName: 'Test', lastName: 'P', role: 'PARENT' })
    });
    const parentAuth = await parentRes.json();
    const parentUser = await prisma.user.findFirst({ where: { email: parentEmail }, include: { parentProfile: true } });

    // Fund Parent
    await prisma.wallet.upsert({
        where: { userId: parentUser.id },
        create: { userId: parentUser.id, balance: 5000, currency: 'SDG' },
        update: { balance: 5000 }
    });

    // Parent Profile & Child
    if (!parentUser.parentProfile) await prisma.parentProfile.create({ data: { userId: parentUser.id, city: 'KRT' } });
    const child = await prisma.child.create({ data: { parentId: parentUser.parentProfile.id || (await prisma.parentProfile.findFirst({ where: { userId: parentUser.id } })).id, name: 'Child' } });

    // Tier
    let tier = await prisma.packageTier.findFirst({ where: { isActive: true } });
    if (!tier) tier = await prisma.packageTier.create({ data: { nameAr: 'T', nameEn: 'T', sessionCount: 4, discountPercent: 10, isActive: true, displayOrder: 1, durationWeeks: 4, gracePeriodDays: 7 } });

    return { teacherUser, parentUser, parentToken: parentAuth.access_token, child, subject, tier };
}

async function runSingleSessionFlow() {
    console.log('\n--- Scenario A: Single Session Flow ---');
    const { teacherUser, parentUser, parentToken, child, subject } = await createTestUsers('single');

    // 1. Create Booking
    const bookingRes = await fetch(`${BASE_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${parentToken}` },
        body: JSON.stringify({
            teacherId: teacherUser.teacherProfile.id,
            subjectId: subject.id,
            childId: child.id,
            startTime: new Date(Date.now() + 86400000).toISOString(),
            endTime: new Date(Date.now() + 86400000 + 3600000).toISOString(),
            termsAccepted: true,
            price: 0
        })
    });
    const booking = await bookingRes.json();
    console.log('Booking Created:', booking.id, booking.status);

    // 2. Approve
    await prisma.booking.update({ where: { id: booking.id }, data: { status: 'WAITING_FOR_PAYMENT' } });
    console.log('Booking Approved');

    // 3. Pay
    const payRes = await fetch(`${BASE_URL}/bookings/${booking.id}/pay`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${parentToken}` } });
    if (!payRes.ok) throw new Error('Payment Failed: ' + await payRes.text());
    console.log('Payment Successful');

    // 4. Complete
    await prisma.booking.update({ where: { id: booking.id }, data: { status: 'PENDING_CONFIRMATION' } });
    console.log('Session Completed (Teacher Mock)');

    // 5. Confirm (Release)
    const confirmRes = await fetch(`${BASE_URL}/bookings/${booking.id}/confirm-early`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${parentToken}` } });
    if (!confirmRes.ok) throw new Error('Confirm Failed: ' + await confirmRes.text());
    console.log('Session Confirmed');

    // Check Balances
    const teacherWallet = await prisma.wallet.findUnique({ where: { userId: teacherUser.id } });
    const parentWallet = await prisma.wallet.findUnique({ where: { userId: parentUser.id } });

    // Parent should have ~4900 (100 price). Teacher should have +82 (100 - 18%).
    console.log(`Parent Balance: ${parentWallet.balance} (Exp ~4900)`);
    console.log(`Teacher Balance: ${teacherWallet.balance} (Exp 82)`);
    if (parentWallet.balance > 4900 || teacherWallet.balance < 82) throw new Error('Balance mismatch!');
}

async function runPackageFlow() {
    console.log('\n--- Scenario B: Package Flow ---');
    const { teacherUser, parentUser, parentToken, child, subject, tier } = await createTestUsers('pkg');

    // 1. Create Booking (Purchase Pkg)
    const bookingRes = await fetch(`${BASE_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${parentToken}` },
        body: JSON.stringify({
            teacherId: teacherUser.teacherProfile.id,
            subjectId: subject.id,
            childId: child.id,
            startTime: new Date(Date.now() + 86400000).toISOString(),
            endTime: new Date(Date.now() + 86400000 + 3600000).toISOString(),
            termsAccepted: true,
            tierId: tier.id,
            price: 0
        })
    });
    const booking = await bookingRes.json();
    console.log('Booking (Pkg) Created:', booking.id);

    // 2. Approve
    await prisma.booking.update({ where: { id: booking.id }, data: { status: 'WAITING_FOR_PAYMENT', pendingTierId: tier.id } });

    // 3. Pay (Purchase + Redeem)
    const payRes = await fetch(`${BASE_URL}/bookings/${booking.id}/pay`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${parentToken}` } });
    if (!payRes.ok) throw new Error('Payment Failed: ' + await payRes.text());
    console.log('Package Purchase + Redemption Successful');

    // Check Usage
    const pkg = await prisma.studentPackage.findFirst({ where: { payerId: parentUser.id } });
    console.log(`Pkg Usage: ${pkg.sessionsUsed}/4`);
    if (pkg.sessionsUsed !== 1) throw new Error('Usage mismatch!');

    // 4. Complete
    await prisma.booking.update({ where: { id: booking.id }, data: { status: 'PENDING_CONFIRMATION' } });

    // 5. Confirm (Release)
    const confirmRes = await fetch(`${BASE_URL}/bookings/${booking.id}/confirm-early`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${parentToken}` } });
    if (!confirmRes.ok) throw new Error('Confirm Failed: ' + await confirmRes.text());
    console.log('Package Session Confirmed');

    // Check Usage Again (Should stay 1, not 2) - Double Count Check
    const pkg2 = await prisma.studentPackage.findUnique({ where: { id: pkg.id } });
    console.log(`Pkg Usage After Release: ${pkg2.sessionsUsed}/4`);
    if (pkg2.sessionsUsed !== 1) throw new Error('DOUBLE COUNT DETECTED!');

    // Check Teacher Balance (Funds from Escrow)
    const teacherWallet = await prisma.wallet.findUnique({ where: { userId: teacherUser.id } });
    // Price breakdown: 4 sessions, 10% off.
    // 100 * 4 = 400. 10% off = 360.
    // Per session = 90.
    // Teacher gets 90 * 0.82 = 73.8.
    console.log(`Teacher Balance: ${teacherWallet.balance} (Exp ~73.8)`);
    if (teacherWallet.balance < 73) throw new Error('Teacher not paid!');

    // Dynamic Expectation
    const pricePerHour = 100;
    const discount = (100 - tier.discountPercent) / 100;
    const sessionPrice = pricePerHour * discount;
    const expectedTotal = sessionPrice * tier.sessionCount;
    const expectedBalance = 5000 - expectedTotal;

    // Check Parent Balance
    const parentWallet = await prisma.wallet.findUnique({ where: { userId: parentUser.id } });
    console.log(`Parent Balance: ${parentWallet.balance} (Exp ${expectedBalance} from Pkg cost ${expectedTotal})`);

    // Allow small float variance if logic uses floats (though backend uses normalizeMoney)
    // normalizeMoney uses Math.round, so exact integer match expected
    if (Math.abs(parentWallet.balance - expectedBalance) > 1) {
        throw new Error(`Parent balance wrong! Got ${parentWallet.balance}, Exp ${expectedBalance}`);
    }
}

async function main() {
    try {
        await runSingleSessionFlow();
        await runPackageFlow();
        console.log('\n✅ ALL SCENARIOS PASSED.');
    } catch (e) {
        console.error('❌ VALIDATION FAILED:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
