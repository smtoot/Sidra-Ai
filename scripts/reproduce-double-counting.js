
const fetch = require('node-fetch');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5001';

// Read .env file manually
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
            if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
                url = url.slice(1, -1);
            }
            if (url) {
                databaseUrl = url;
                break;
            }
        }
    }
}

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: databaseUrl,
        },
    },
});

async function main() {
    console.log('--- Starting Double Counting Reproduction ---');
    const timestamp = Date.now();
    const teacherEmail = `teacher.cnt.${timestamp}@test.com`;
    const parentEmail = `parent.cnt.${timestamp}@test.com`;

    // 1. Create Users
    console.log(`Creating Users: ${teacherEmail} / ${parentEmail}`);

    // Teacher Register
    const teacherRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            phoneNumber: `97${timestamp.toString().slice(-7)}`,
            email: teacherEmail,
            password: 'Password123!',
            firstName: 'Count', lastName: 'T', role: 'TEACHER'
        })
    });
    if (!teacherRes.ok) throw new Error('Teacher Register Failed: ' + await teacherRes.text());

    // Parent Register
    const parentRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            phoneNumber: `87${timestamp.toString().slice(-7)}`,
            email: parentEmail,
            password: 'Password123!',
            firstName: 'Count', lastName: 'P', role: 'PARENT'
        })
    });
    if (!parentRes.ok) throw new Error('Parent Register Failed: ' + await parentRes.text());
    const parentAuth = await parentRes.json();
    const parentToken = parentAuth.access_token;

    // Fetch IDs
    const teacherUser = await prisma.user.findFirst({ where: { email: teacherEmail }, include: { teacherProfile: true } });
    const parentUser = await prisma.user.findFirst({ where: { email: parentEmail }, include: { parentProfile: true } });

    // 2. Setup Data
    await prisma.teacherProfile.update({
        where: { userId: teacherUser.id },
        data: { applicationStatus: 'APPROVED', bio: 'Test Bio' }
    });

    let subject = await prisma.subject.findFirst();
    let curriculum = await prisma.curriculum.findFirst();

    await prisma.teacherSubject.create({
        data: { teacherId: teacherUser.teacherProfile.id, subjectId: subject.id, curriculumId: curriculum.id, pricePerHour: 100 }
    });

    // Availability
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    for (const day of days) {
        await prisma.availability.create({
            data: { teacherId: teacherUser.teacherProfile.id, dayOfWeek: day, startTime: '00:00', endTime: '23:59', isRecurring: true }
        });
    }

    // Tier
    let tier = await prisma.packageTier.findFirst({ where: { isActive: true } });
    if (!tier) {
        tier = await prisma.packageTier.create({
            data: {
                nameAr: 'Test Tier', nameEn: 'Test Tier',
                sessionCount: 4, discountPercent: 10,
                recurringRatio: 1, floatingRatio: 0,
                rescheduleLimit: 1, durationWeeks: 4, gracePeriodDays: 7,
                isActive: true, displayOrder: 1
            }
        });
    }

    // Fund Wallet (Parent)
    await prisma.wallet.upsert({
        where: { userId: parentUser.id },
        create: { userId: parentUser.id, balance: 5000, currency: 'SDG' },
        update: { balance: 5000 }
    });

    // Create Wallet (Teacher) - Required for receiving payment
    await prisma.wallet.upsert({
        where: { userId: teacherUser.id },
        create: { userId: teacherUser.id, balance: 0, currency: 'SDG' },
        update: { balance: 0 }
    });

    // Parent Profile & Child
    let parentProfile = parentUser.parentProfile;
    if (!parentProfile) {
        parentProfile = await prisma.parentProfile.create({ data: { userId: parentUser.id, city: 'Khartoum' } });
    }
    const child = await prisma.child.create({ data: { parentId: parentProfile.id, name: 'Count Kid' } });

    // 3. Create Booking
    console.log('Creating Booking Request...');
    const bookingRes = await fetch(`${BASE_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${parentToken}` },
        body: JSON.stringify({
            teacherId: teacherUser.teacherProfile.id,
            subjectId: subject.id,
            childId: child.id,
            startTime: new Date(Date.now() + 86400000).toISOString(),
            endTime: new Date(Date.now() + 86400000 + 3600000).toISOString(),
            bookingNotes: 'TEST_Double_Count',
            tierId: tier.id,
            termsAccepted: true,
            price: 0
        })
    });
    const booking = await bookingRes.json();
    console.log('Booking Created:', booking.id, booking.status);

    // Approve
    await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'WAITING_FOR_PAYMENT', pendingTierId: tier.id }
    });

    // 4. Pay (Purchase + Redeem)
    console.log('--- Paying (Purchase Package + Redeem Session 1) ---');
    const payRes = await fetch(`${BASE_URL}/bookings/${booking.id}/pay`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${parentToken}` }
    });
    console.log('Pay Status:', payRes.status);
    if (!payRes.ok) console.log(await payRes.text());

    // Check Sessions Used
    const pkg1 = await prisma.studentPackage.findFirst({ where: { payerId: parentUser.id } });
    console.log(`Sessions Used (After Payment): ${pkg1.sessionsUsed} / ${pkg1.sessionCount}`);
    if (pkg1.sessionsUsed !== 1) console.log('⚠️ UNEXPECTED: Should be 1');

    // 5. Complete Session (Teacher side - simulate via DB or API)
    // Teacher API completeSession requires token. Let's cheat with DB to PENDING_CONFIRMATION
    // Actually, confirmSessionEarly requires PENDING_CONFIRMATION OR SCHEDULED?
    // Let's use DB to set to PENDING_CONFIRMATION to skip teacher part
    await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'PENDING_CONFIRMATION', teacherCompletedAt: new Date() }
    });
    console.log('Session marked PENDING_CONFIRMATION');

    // 6. Confirm Session (Parent)
    console.log('--- Confirming Session (Release) ---');
    const confirmRes = await fetch(`${BASE_URL}/bookings/${booking.id}/confirm-early`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${parentToken}` }
    });
    console.log('Confirm Status:', confirmRes.status);
    if (!confirmRes.ok) console.log(await confirmRes.text());

    // 7. Check Sessions Used Again
    const pkg2 = await prisma.studentPackage.findFirst({ where: { id: pkg1.id } });
    console.log(`Sessions Used (After Confirm): ${pkg2.sessionsUsed} / ${pkg2.sessionCount}`);

    if (pkg2.sessionsUsed === 2) {
        console.log('🚨 BUG CONFIRMED: Sessions Double Counted!');
    } else if (pkg2.sessionsUsed === 1) {
        console.log('✅ Usage Correct (1).');
    } else {
        console.log(`❓ Weird State: ${pkg2.sessionsUsed}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
