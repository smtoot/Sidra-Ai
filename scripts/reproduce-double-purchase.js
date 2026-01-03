
const fetch = require('node-fetch');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5001';

// Read .env file manually from possible locations
const paths = [
    path.join(__dirname, '../apps/api/.env'),
    path.join(__dirname, 'packages/database/.env'),
    path.join(__dirname, '../packages/database/.env'),
    path.join(__dirname, '../packages/database/prisma/.env')
];

let databaseUrl = 'postgresql://postgres:postgres@localhost:5432/sidra_db?schema=public'; // fallback

for (const envPath of paths) {
    if (fs.existsSync(envPath)) {
        console.log(`Found .env at ${envPath}`);
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/DATABASE_URL=(.*)/);
        if (match && match[1]) {
            let url = match[1].trim();
            if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
                url = url.slice(1, -1);
            }
            if (url) {
                databaseUrl = url;
                console.log('Loaded DATABASE_URL from file');
                break;
            }
        }
    }
}
console.log('Using DATABASE_URL:', databaseUrl ? databaseUrl.replace(/:[^:]*@/, ':****@') : 'Not Found');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: databaseUrl,
        },
    },
});

async function main() {
    console.log('--- Starting Double Spend Reproduction ---');
    const timestamp = Date.now();
    const teacherEmail = `teacher.crash.${timestamp}@test.com`;
    const parentEmail = `parent.crash.${timestamp}@test.com`;

    // 1. Create Users via API (Ensures valid passwords/tokens)
    console.log(`Creating Users: ${teacherEmail} / ${parentEmail}`);

    // Teacher Register
    const teacherRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            phoneNumber: `99${timestamp.toString().slice(-7)}`,
            email: teacherEmail,
            password: 'Password123!',
            firstName: 'Crash', lastName: 'T', role: 'TEACHER'
        })
    });
    if (!teacherRes.ok) throw new Error('Teacher Register Failed: ' + await teacherRes.text());

    // Parent Register
    const parentRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            phoneNumber: `88${timestamp.toString().slice(-7)}`,
            email: parentEmail,
            password: 'Password123!',
            firstName: 'Crash', lastName: 'P', role: 'PARENT'
        })
    });
    if (!parentRes.ok) throw new Error('Parent Register Failed: ' + await parentRes.text());
    const parentAuth = await parentRes.json();
    const parentToken = parentAuth.access_token;

    // 2. Fetch IDs from DB (API response might not have them)
    // Wait a bit for async DB write? Usually consistent with API return.
    const teacherUser = await prisma.user.findFirst({
        where: { email: teacherEmail },
        include: { teacherProfile: true }
    });
    const parentUser = await prisma.user.findFirst({
        where: { email: parentEmail },
        include: { parentProfile: true }
    });

    if (!teacherUser || !parentUser) throw new Error('Failed to find users in DB');
    console.log(`Users verified in DB: TeacherID=${teacherUser.id}, ParentID=${parentUser.id}`);

    // 3. Setup Data via DB (Approve Teacher, Fund Wallet)
    await prisma.teacherProfile.update({
        where: { userId: teacherUser.id },
        data: { applicationStatus: 'APPROVED', bio: 'Test Bio' }
    });

    // Check if TeacherSubject exists, if not create one
    let subject = await prisma.subject.findFirst();
    if (!subject) throw new Error('No subjects found in DB');

    let curriculum = await prisma.curriculum.findFirst();
    if (!curriculum) throw new Error('No curriculum found in DB');

    // Assign Subject
    await prisma.teacherSubject.create({
        data: {
            teacherId: teacherUser.teacherProfile.id,
            subjectId: subject.id,
            curriculumId: curriculum.id,
            pricePerHour: 100,
        }
    });

    // Set Availability (All Days 09:00 - 22:00)
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    for (const day of days) {
        await prisma.availability.create({
            data: {
                teacherId: teacherUser.teacherProfile.id,
                dayOfWeek: day,
                startTime: '00:00',
                endTime: '23:59',
                isRecurring: true
            }
        });
    }

    // Ensure Tier Exists
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

    // Fund Parent Wallet
    await prisma.wallet.upsert({
        where: { userId: parentUser.id },
        create: { userId: parentUser.id, balance: 5000, currency: 'SDG' },
        update: { balance: 5000 }
    });
    console.log('Wallet funded: 5000 SDG');

    // 4. Create Child & Booking via API (using IDs)
    // Ensure Parent Profile exists
    let parentProfile = parentUser.parentProfile;
    if (!parentProfile) {
        parentProfile = await prisma.parentProfile.create({
            data: { userId: parentUser.id, city: 'Khartoum' }
        });
    }

    const child = await prisma.child.create({
        data: { parentId: parentProfile.id, name: 'Crash Kid' }
    });

    console.log('Creating Booking Request...');
    const bookingRes = await fetch(`${BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${parentToken}`
        },
        body: JSON.stringify({
            teacherId: teacherUser.teacherProfile.id,
            subjectId: subject.id,
            childId: child.id,
            startTime: new Date(Date.now() + 86400000).toISOString(),
            endTime: new Date(Date.now() + 86400000 + 3600000).toISOString(),
            bookingNotes: 'SIMULATE_CRASH', // TRIGGER
            tierId: tier.id,
            termsAccepted: true,
            price: 0 // Will be recalculated by backend? Or ignored? Validation requires it.
        })
    });

    if (!bookingRes.ok) {
        console.error('Booking Error:', await bookingRes.text());
        return;
    }
    const booking = await bookingRes.json();
    console.log('Booking Created:', booking.id, booking.status);

    // Teacher Approve (DB Hack to skip auth)
    await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'WAITING_FOR_PAYMENT', pendingTierId: tier.id }
    });
    console.log('Booking Approved -> WAITING_FOR_PAYMENT');

    // 5. ATTACK: Double Spend
    console.log('--- Attempt 1: Paying (Expecting Crash) ---');
    try {
        const pay1 = await fetch(`${BASE_URL}/bookings/${booking.id}/pay`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${parentToken}` }
        });
        console.log('Pay 1 Status:', pay1.status);
    } catch (e) {
        console.log('Pay 1 Crashed (Network Error):', e.message);
    }

    // Verify first charge happened
    const w1 = await prisma.wallet.findUnique({ where: { userId: parentUser.id } });
    console.log(`Balance after Crash: ${w1.balance} (Should be less than 5000)`);

    console.log('--- Attempt 2: Paying (Retry) ---');
    // REMOVE Crash Trigger
    await prisma.booking.update({
        where: { id: booking.id },
        data: { bookingNotes: 'RETRY_SUCCESS' }
    });

    const pay2 = await fetch(`${BASE_URL}/bookings/${booking.id}/pay`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${parentToken}` }
    });
    console.log('Pay 2 Status:', pay2.status);

    const w2 = await prisma.wallet.findUnique({ where: { userId: parentUser.id } });
    console.log(`Final Balance: ${w2.balance}`);

    // Calculate Expected
    if (Number(w2.balance) < Number(w1.balance)) {
        console.log('🚨 DOUBLE SPEND CONFIRMED! Balance decreased again.');
    } else {
        console.log('✅ Single Spend confirmed (Safe).');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
