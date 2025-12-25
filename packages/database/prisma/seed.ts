import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive seed with proper transactions...');

  const pw = await bcrypt.hash('password123', 10);
  const now = new Date();

  // Clear data
  console.log('🧹 Clearing old data...');
  await prisma.transaction.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.teacherSubjectGrade.deleteMany();
  await prisma.teacherSubject.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.child.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.teacherProfile.deleteMany();
  await prisma.parentProfile.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.systemSettings.deleteMany();

  // 1. System Settings
  console.log('⚙️  Creating system settings...');
  await prisma.systemSettings.create({
    data: {
      id: 'default',
      disputeWindowHours: 48,
      reminderIntervals: [6, 12, 24],
      autoReleaseEnabled: true,
      confirmationWindowHours: 48,
      reminderHoursBeforeRelease: 6,
      defaultCommissionRate: 0.18,
    },
  });

  // 2. Create Subjects
  console.log('📖 Creating subjects...');
  const math = await prisma.subject.create({
    data: { nameAr: 'الرياضيات', nameEn: 'Mathematics' }
  });

  const english = await prisma.subject.create({
    data: { nameAr: 'اللغة الإنجليزية', nameEn: 'English' }
  });

  const science = await prisma.subject.create({
    data: { nameAr: 'العلوم', nameEn: 'Science' }
  });

  // 3. Create Users
  console.log('👥 Creating users...');
  const teacher = await prisma.user.create({
    data: {
      phoneNumber: '0500000002',
      email: 'teacher@sidra.com',
      passwordHash: pw,
      role: 'TEACHER',
      isVerified: true,
      teacherProfile: {
        create: {
          displayName: 'أحمد المعلم',
          fullName: 'أحمد محمد العلي',
          bio: 'معلم رياضيات وعلوم خبرة 10 سنوات في التدريس',
          education: 'بكالوريوس رياضيات - جامعة الملك سعود',
          yearsOfExperience: 10,
          applicationStatus: 'APPROVED',
          hasCompletedOnboarding: true,
          timezone: 'Asia/Riyadh',
        },
      },
    },
  });

  const parent = await prisma.user.create({
    data: {
      phoneNumber: '0500000004',
      email: 'parent@sidra.com',
      passwordHash: pw,
      role: 'PARENT',
      isVerified: true,
      parentProfile: { create: {} },
    },
  });

  const student = await prisma.user.create({
    data: {
      phoneNumber: '0500000006',
      email: 'student@sidra.com',
      passwordHash: pw,
      role: 'STUDENT',
      isVerified: true,
      studentProfile: { create: {} },
    },
  });

  // 4. Create Child
  console.log('👶 Creating children...');
  const parentProfile = await prisma.parentProfile.findUnique({
    where: { userId: parent.id }
  });

  const child = await prisma.child.create({
    data: {
      name: 'محمد',
      gradeLevel: 'الصف التاسع',
      parentId: parentProfile!.id,
    },
  });

  // 5. Create Wallets WITH INITIAL BALANCES
  console.log('💰 Creating wallets with balances...');
  const teacherWallet = await prisma.wallet.create({
    data: {
      userId: teacher.id,
      balance: 500,  // Teacher has some existing balance
      pendingBalance: 0
    }
  });

  // Parent starts with 1200 (will spend 200 on 2 bookings)
  const parentWallet = await prisma.wallet.create({
    data: {
      userId: parent.id,
      balance: 1000,  // After 2 bookings locked (1200 - 200 = 1000)
      pendingBalance: 200  // 2 bookings × 100 each locked in escrow
    }
  });

  const studentWallet = await prisma.wallet.create({
    data: {
      userId: student.id,
      balance: 200,  // After 1 booking locked (300 - 100 = 200)
      pendingBalance: 100  // 1 booking locked
    }
  });

  // 6. Get Teacher Profile
  const teacherProfile = await prisma.teacherProfile.findUnique({
    where: { userId: teacher.id },
  });

  // 7. Create teacher availability
  console.log('📅 Creating teacher availability...');
  await prisma.availability.createMany({
    data: [
      { teacherId: teacherProfile!.id, dayOfWeek: 'SUNDAY', startTime: '09:00', endTime: '17:00' },
      { teacherId: teacherProfile!.id, dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '17:00' },
      { teacherId: teacherProfile!.id, dayOfWeek: 'TUESDAY', startTime: '14:00', endTime: '20:00' },
      { teacherId: teacherProfile!.id, dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '17:00' },
      { teacherId: teacherProfile!.id, dayOfWeek: 'THURSDAY', startTime: '09:00', endTime: '15:00' },
    ],
  });

  // 8. Create test bookings WITH PROPER TRANSACTIONS
  console.log('📝 Creating test bookings with transactions...');
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // === BOOKING 1: SCHEDULED (past - for teacher to mark complete) ===
  const booking1 = await prisma.booking.create({
    data: {
      bookedByUserId: parent.id,
      beneficiaryType: 'CHILD',
      childId: child.id,
      teacherId: teacherProfile!.id,
      subjectId: math.id,
      startTime: yesterday,
      endTime: new Date(yesterday.getTime() + 60 * 60 * 1000),
      price: 100,
      commissionRate: 0.18,
      status: 'SCHEDULED',
      timezone: 'Asia/Riyadh',
    },
  });

  // Create PAYMENT_LOCK transaction for booking1
  await prisma.transaction.create({
    data: {
      walletId: parentWallet.id,
      amount: 100,
      type: 'PAYMENT_LOCK',
      status: 'APPROVED',
      adminNote: `Funds locked for booking ${booking1.id}`,
    },
  });

  // === BOOKING 2: PENDING_CONFIRMATION (with dispute window - completed but not confirmed) ===
  const booking2 = await prisma.booking.create({
    data: {
      bookedByUserId: parent.id,
      beneficiaryType: 'CHILD',
      childId: child.id,
      teacherId: teacherProfile!.id,
      subjectId: math.id,
      startTime: new Date(now.getTime() - 60 * 60 * 1000),
      endTime: now,
      price: 100,
      commissionRate: 0.18,
      status: 'PENDING_CONFIRMATION',
      disputeWindowOpensAt: now,
      disputeWindowClosesAt: new Date(now.getTime() + 47 * 60 * 60 * 1000),
      teacherCompletedAt: now,
      paymentReleasedAt: now,  // Payment was released when marked complete
      timezone: 'Asia/Riyadh',
    },
  });

  // PAYMENT_LOCK for booking2 (when it was first scheduled)
  await prisma.transaction.create({
    data: {
      walletId: parentWallet.id,
      amount: 100,
      type: 'PAYMENT_LOCK',
      status: 'APPROVED',
      adminNote: `Funds locked for booking ${booking2.id}`,
    },
  });

  // PAYMENT_RELEASE for booking2 (parent's escrow released)
  await prisma.transaction.create({
    data: {
      walletId: parentWallet.id,
      amount: -100,  // Negative = money leaving
      type: 'PAYMENT_RELEASE',
      status: 'APPROVED',
      adminNote: `Payment for booking ${booking2.id}`,
    },
  });

  // PAYMENT_RELEASE for booking2 (teacher receives 82 = 100 - 18% commission)
  const teacherEarnings2 = 100 * (1 - 0.18);
  await prisma.transaction.create({
    data: {
      walletId: teacherWallet.id,
      amount: teacherEarnings2,
      type: 'PAYMENT_RELEASE',
      status: 'APPROVED',
      adminNote: `Earnings from booking ${booking2.id} (18% commission deducted)`,
    },
  });

  // Update teacher balance to reflect payment received
  await prisma.wallet.update({
    where: { id: teacherWallet.id },
    data: { balance: 500 + teacherEarnings2 }, // 500 + 82 = 582
  });

  // Update parent pendingBalance (one booking released, one still pending)
  await prisma.wallet.update({
    where: { id: parentWallet.id },
    data: { pendingBalance: 100 }, // Only booking1 still locked
  });

  // === BOOKING 3: Future SCHEDULED booking (student booking) ===
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const booking3 = await prisma.booking.create({
    data: {
      bookedByUserId: student.id,
      beneficiaryType: 'STUDENT',
      studentUserId: student.id,
      teacherId: teacherProfile!.id,
      subjectId: science.id,
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000),
      price: 100,
      commissionRate: 0.18,
      status: 'SCHEDULED',
      timezone: 'Asia/Riyadh',
    },
  });

  // PAYMENT_LOCK for booking3
  await prisma.transaction.create({
    data: {
      walletId: studentWallet.id,
      amount: 100,
      type: 'PAYMENT_LOCK',
      status: 'APPROVED',
      adminNote: `Funds locked for booking ${booking3.id}`,
    },
  });

  // 9. Create notification for pending confirmation
  console.log('🔔 Creating notifications...');
  await prisma.notification.create({
    data: {
      userId: parent.id,
      title: 'جلسة مكتملة - Session Completed',
      message: 'أكمل المعلم الجلسة. لديك 48 ساعة للمراجعة أو فتح نزاع إذا لزم الأمر.',
      type: 'BOOKING_APPROVED',
      link: `/parent/bookings`,
      metadata: {
        bookingId: booking2.id,
        disputeDeadline: new Date(now.getTime() + 47 * 60 * 60 * 1000).toISOString(),
      },
      status: 'UNREAD',
    },
  });

  // 10. Verification Queries
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ SEED COMPLETE - VERIFICATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const allTransactions = await prisma.transaction.findMany({
    include: { wallet: { include: { user: true } } },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`📊 Total Transactions Created: ${allTransactions.length}`);
  allTransactions.forEach((tx, i) => {
    console.log(`  ${i + 1}. ${tx.type} | ${tx.amount} SDG | ${tx.wallet.user.phoneNumber} | ${tx.adminNote}`);
  });

  const finalBalances = await prisma.wallet.findMany({
    include: { user: true }
  });

  console.log('\n💰 Final Wallet Balances:');
  finalBalances.forEach(w => {
    console.log(`  ${w.user.phoneNumber}: Balance=${w.balance}, Pending=${w.pendingBalance}`);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Test Accounts:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👨‍🏫 Teacher: 0500000002 / password123');
  console.log('   Balance: 582 SDG (500 initial + 82 from booking2)');
  console.log('👨‍👩‍👧 Parent: 0500000004 / password123');
  console.log('   Balance: 1000 SDG, Pending: 100 SDG (booking1 locked)');
  console.log('🎓 Student: 0500000006 / password123');
  console.log('   Balance: 200 SDG, Pending: 100 SDG (booking3 locked)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📊 Test Bookings:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`1. SCHEDULED (${booking1.id})`);
  console.log('   → 100 SDG locked in parent escrow');
  console.log('   → Teacher can mark complete');
  console.log(`2. PENDING_CONFIRMATION (${booking2.id})`);
  console.log('   → Payment already released (82 SDG to teacher)');
  console.log('   → Parent can confirm or dispute (47h remaining)');
  console.log(`3. SCHEDULED future (${booking3.id})`);
  console.log('   → 100 SDG locked in student escrow');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🧪 READY FOR E2E TESTING!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
