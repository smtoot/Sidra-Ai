
import { PrismaClient, UserRole, ApplicationStatus, BookingStatus, TransactionType, TransactionStatus, BeneficiaryType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting COMPREHENSIVE seed...');

  const pw = await bcrypt.hash('password123', 10);
  const now = new Date();

  // Helper to clear data in order
  console.log('🧹 Clearing old data...');
  // Delete in reverse order of dependencies
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.packageRedemption.deleteMany();
  await prisma.packageTransaction.deleteMany();
  await prisma.studentPackage.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.teacherSubjectGrade.deleteMany();
  await prisma.teacherSubject.deleteMany();
  await prisma.teacherTeachingApproachTag.deleteMany();
  await prisma.teachingApproachTag.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.availabilityException.deleteMany();
  await prisma.child.deleteMany();
  await prisma.teacherProfile.deleteMany();
  await prisma.parentProfile.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.curriculumSubject.deleteMany();
  await prisma.gradeLevel.deleteMany();
  await prisma.educationalStage.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.curriculum.deleteMany();
  await prisma.packageTier.deleteMany();
  await prisma.systemSettings.deleteMany();
  await prisma.readableIdCounter.deleteMany();

  // 1. System Settings & Configuration
  console.log('⚙️  Creating system settings & configurations...');
  await prisma.systemSettings.create({
    data: {
      id: 'default',
      disputeWindowHours: 48,
      confirmationWindowHours: 48,
      autoReleaseEnabled: true,
      packagesEnabled: true,
      demosEnabled: true,
      currency: 'SDG',
      timezone: 'Africa/Khartoum'
    }
  });

  // UPDATED: Package tiers now require durationWeeks and Smart Pack config
  // Use the dedicated seed-package-tiers.ts for proper Smart Pack setup
  await prisma.packageTier.createMany({
    data: [
      {
        sessionCount: 5,
        discountPercent: 5,
        displayOrder: 1,
        durationWeeks: 4,
        nameAr: 'باقة المبتدئين',
        nameEn: 'Starter Pack'
      },
      {
        sessionCount: 10,
        discountPercent: 8,
        displayOrder: 2,
        durationWeeks: 6,
        nameAr: 'الباقة القياسية',
        nameEn: 'Standard Pack'
      },
      {
        sessionCount: 12,
        discountPercent: 10,
        displayOrder: 3,
        durationWeeks: 7,
        isFeatured: true,
        nameAr: 'الباقة الذكية',
        nameEn: 'Smart Pack'
      },
      {
        sessionCount: 15,
        discountPercent: 15,
        displayOrder: 4,
        durationWeeks: 9,
        nameAr: 'باقة المتميزين',
        nameEn: 'Premium Pack'
      },
    ]
  });

  // 2. Content Hierarchy
  console.log('📚 Creating Curriculum, Stages, Grades & Subjects...');

  // National Curriculum
  const curriculum = await prisma.curriculum.create({
    data: {
      code: 'SUDAN-NATIONAL',
      nameAr: 'المنهج القومي السوداني',
      nameEn: 'Sudanese National Curriculum',
      systemType: 'NATIONAL'
    }
  });

  // Stages
  const primaryStage = await prisma.educationalStage.create({
    data: { curriculumId: curriculum.id, nameAr: 'المرحلة الابتدائية', nameEn: 'Primary Stage', sequence: 1 }
  });
  const interStage = await prisma.educationalStage.create({
    data: { curriculumId: curriculum.id, nameAr: 'المرحلة المتوسطة', nameEn: 'Intermediate Stage', sequence: 2 }
  });
  const secondaryStage = await prisma.educationalStage.create({
    data: { curriculumId: curriculum.id, nameAr: 'المرحلة الثانوية', nameEn: 'Secondary Stage', sequence: 3 }
  });

  // Grades
  const createGrades = async (stageId: string, start: number, end: number, prefix: string) => {
    for (let i = start; i <= end; i++) {
      await prisma.gradeLevel.create({
        data: {
          stageId,
          nameAr: `الصف ${i}`,
          nameEn: `Grade ${i}`,
          code: `${prefix}-${i}`,
          sequence: i
        }
      });
    }
  };

  await createGrades(primaryStage.id, 1, 6, 'PRI');
  await createGrades(interStage.id, 7, 9, 'INT');
  await createGrades(secondaryStage.id, 10, 12, 'SEC');

  // Subjects
  const math = await prisma.subject.create({ data: { nameAr: 'الرياضيات', nameEn: 'Mathematics' } });
  const english = await prisma.subject.create({ data: { nameAr: 'اللغة الإنجليزية', nameEn: 'English' } });
  const science = await prisma.subject.create({ data: { nameAr: 'العلوم', nameEn: 'Science' } });
  const arabic = await prisma.subject.create({ data: { nameAr: 'اللغة العربية', nameEn: 'Arabic' } });

  // Link Subjects to Curriculum
  await prisma.curriculumSubject.createMany({
    data: [
      { curriculumId: curriculum.id, subjectId: math.id },
      { curriculumId: curriculum.id, subjectId: english.id },
      { curriculumId: curriculum.id, subjectId: science.id },
      { curriculumId: curriculum.id, subjectId: arabic.id },
    ]
  });

  // Tags
  console.log('🏷️ Creating Tags...');
  const tagPatient = await prisma.teachingApproachTag.create({ data: { labelAr: 'صبور' } });
  const tagInteractive = await prisma.teachingApproachTag.create({ data: { labelAr: 'تفاعلي' } });
  const tagExam = await prisma.teachingApproachTag.create({ data: { labelAr: 'تركيز على الامتحانات' } });

  // 3. Users
  console.log('👥 Creating Users (Admin, Teacher, Parent, Student)...');

  // Admin
  await prisma.user.create({
    data: {
      email: 'admin@sidra.com',
      phoneNumber: '0599999999',
      passwordHash: pw,
      role: 'ADMIN',
      isVerified: true,
      firstName: 'System',
      lastName: 'Admin'
    }
  });

  // Teacher
  const teacherUser = await prisma.user.create({
    data: {
      email: 'teacher@sidra.com',
      phoneNumber: '0500000002',
      passwordHash: pw,
      role: 'TEACHER',
      isVerified: true,
      firstName: 'Ahmad',
      lastName: 'Teacher',
      wallet: { create: { balance: 0, pendingBalance: 0 } },
      teacherProfile: {
        create: {
          displayName: 'أستاذ أحمد',
          fullName: 'أحمد محمد علي',
          slug: 'ahmad-ali',
          slugLockedAt: now,
          bio: 'معلم متخصص في تدريس الرياضيات والعلوم للمراحل المدرسية المختلفة. أعتمد أسلوباً مبسطاً وتفاعلياً.',
          // REMOVED: education field - replaced by TeacherQualification model
          yearsOfExperience: 8,
          applicationStatus: 'APPROVED',
          teachingStyle: 'أركز على فهم الأساسيات وبناء الثقة لدى الطالب من خلال الأمثلة العملية.',
          profilePhotoUrl: 'uploads/demo-avatar-teacher.jpg' // Placeholder
        }
      }
    }
  });

  const teacherProfile = await prisma.teacherProfile.findUniqueOrThrow({ where: { userId: teacherUser.id } });

  // Link Tags
  await prisma.teacherTeachingApproachTag.createMany({
    data: [
      { teacherId: teacherProfile.id, tagId: tagPatient.id },
      { teacherId: teacherProfile.id, tagId: tagInteractive.id }
    ]
  });

  // Teacher Subjects (Price & Grades)
  // Math for Secondary (Grades 10-12)
  const secGrades = await prisma.gradeLevel.findMany({ where: { stageId: secondaryStage.id } });
  const teacherMath = await prisma.teacherSubject.create({
    data: {
      teacherId: teacherProfile.id,
      subjectId: math.id,
      curriculumId: curriculum.id,
      pricePerHour: 5000,
    }
  });
  await prisma.teacherSubjectGrade.createMany({
    data: secGrades.map(g => ({ teacherSubjectId: teacherMath.id, gradeLevelId: g.id }))
  });

  // Science for Intermediate (Grades 7-9)
  const intGrades = await prisma.gradeLevel.findMany({ where: { stageId: interStage.id } });
  const teacherScience = await prisma.teacherSubject.create({
    data: {
      teacherId: teacherProfile.id,
      subjectId: science.id,
      curriculumId: curriculum.id,
      pricePerHour: 4500,
    }
  });
  await prisma.teacherSubjectGrade.createMany({
    data: intGrades.map(g => ({ teacherSubjectId: teacherScience.id, gradeLevelId: g.id }))
  });

  // Availability (Sun-Thu, 4PM-8PM)
  await prisma.availability.createMany({
    data: ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'].map(day => ({
      teacherId: teacherProfile.id,
      dayOfWeek: day as any,
      startTime: '16:00',
      endTime: '20:00'
    }))
  });

  // Parent
  const parentUser = await prisma.user.create({
    data: {
      email: 'parent@sidra.com',
      phoneNumber: '0500000004',
      passwordHash: pw,
      role: 'PARENT',
      isVerified: true,
      firstName: 'Khalid',
      lastName: 'Parent',
      wallet: { create: { balance: 50000, pendingBalance: 0 } }, // 50k deposit
      parentProfile: { create: { city: 'Khartoum' } }
    }
  });
  // Deposit Transaction for Parent
  await prisma.transaction.create({
    data: {
      walletId: (await prisma.wallet.findUniqueOrThrow({ where: { userId: parentUser.id } })).id,
      amount: 50000,
      type: 'DEPOSIT',
      status: 'APPROVED',
      readableId: 'TX-DEP-001'
    }
  });

  // Child
  const child = await prisma.child.create({
    data: {
      parentId: (await prisma.parentProfile.findUniqueOrThrow({ where: { userId: parentUser.id } })).id,
      name: 'Sarah',
      gradeLevel: 'Grade 8'
    }
  });

  // Student
  const studentUser = await prisma.user.create({
    data: {
      email: 'student@sidra.com',
      phoneNumber: '0500000006',
      passwordHash: pw,
      role: 'STUDENT',
      isVerified: true,
      firstName: 'Omar',
      lastName: 'Student',
      wallet: { create: { balance: 20000, pendingBalance: 0 } }, // 20k deposit
      studentProfile: { create: { gradeLevel: 'Grade 11' } }
    }
  });
  // Deposit for Student
  await prisma.transaction.create({
    data: {
      walletId: (await prisma.wallet.findUniqueOrThrow({ where: { userId: studentUser.id } })).id,
      amount: 20000,
      type: 'DEPOSIT',
      status: 'APPROVED',
      readableId: 'TX-DEP-002'
    }
  });


  // 4. Booking Scenarios
  console.log('📅 Creating Booking Scenarios...');

  const studentWallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: studentUser.id } });
  const teacherWallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: teacherUser.id } });

  // SCENARIO A: Student Package Purchase (Math, 10 sessions)
  // Price: 5000/hr * 10 sessions * 0.9 (10% discount) = 45,000. Wait, student only has 20k.
  // Let's adjust package size or balance. Let's give student more money.
  await prisma.wallet.update({ where: { id: studentWallet.id }, data: { balance: { increment: 30000 } } }); // Now 50k

  const pkgPrice = 5000 * 10 * 0.9; // 45,000
  const studentPackage = await prisma.studentPackage.create({
    data: {
      readableId: 'PKG-DEMO-01',
      payerId: studentUser.id,
      studentId: studentUser.id,
      teacherId: teacherProfile.id,
      subjectId: math.id,
      sessionCount: 10,
      sessionsUsed: 0,
      originalPricePerSession: 5000,
      discountedPricePerSession: 4500,
      perSessionReleaseAmount: 4500,
      totalPaid: pkgPrice,
      escrowRemaining: pkgPrice,
      status: 'ACTIVE',
      expiresAt: new Date(now.getFullYear() + 1, 0, 1), // 1 year expiry
    }
  });

  // Deduct from wallet
  await prisma.wallet.update({ where: { id: studentWallet.id }, data: { balance: { decrement: pkgPrice } } });
  await prisma.transaction.create({
    data: {
      walletId: studentWallet.id,
      amount: -pkgPrice, // Negative for deduction
      type: 'PACKAGE_PURCHASE',
      status: 'APPROVED',
      readableId: 'TX-PKG-001',
      adminNote: 'Purchased 10 sessions Math package'
    }
  });

  // SCENARIO B: Completed & Disputed Booking (Parent triggers)
  // Booking ID: BK-DISPUTE-01
  const disputeBooking = await prisma.booking.create({
    data: {
      readableId: 'BK-DISPUTE-01',
      bookedByUserId: parentUser.id,
      beneficiaryType: 'CHILD',
      childId: child.id,
      teacherId: teacherProfile.id,
      subjectId: science.id,
      startTime: new Date(now.getTime() - 48 * 60 * 60 * 1000), // 2 days ago
      endTime: new Date(now.getTime() - 47 * 60 * 60 * 1000),
      price: 4500,
      status: 'DISPUTED',
      disputeWindowOpensAt: new Date(now.getTime() - 47 * 60 * 60 * 1000),
      paymentLockedAt: new Date(now.getTime() - 96 * 60 * 60 * 1000),
    }
  });
  // Create Dispute
  await prisma.dispute.create({
    data: {
      bookingId: disputeBooking.id,
      raisedByUserId: parentUser.id,
      type: 'TECHNICAL_ISSUE',
      description: 'Connection was very bad, could not hear the teacher.',
      status: 'PENDING'
    }
  });
  // Lock funds (Parent Wallet -> Pending)
  // For simplicity moving funds directly to pending
  await prisma.wallet.update({
    where: { userId: parentUser.id },
    data: { balance: { decrement: 4500 }, pendingBalance: { increment: 4500 } }
  });


  // SCENARIO C: Completed & Pending Confirmation (Optimistic Release to Teacher)
  // Booking ID: BK-CONFIRM-01
  const completedBooking = await prisma.booking.create({
    data: {
      readableId: 'BK-CONFIRM-01',
      bookedByUserId: parentUser.id,
      beneficiaryType: 'CHILD',
      childId: child.id,
      teacherId: teacherProfile.id,
      subjectId: science.id,
      startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      endTime: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      price: 4500,
      status: 'PENDING_CONFIRMATION',
      disputeWindowOpensAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      disputeWindowClosesAt: new Date(now.getTime() + 46 * 60 * 60 * 1000), // 48h window
      paymentReleasedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), // Paid to teacher
    }
  });
  // Money moved: Parent -4500, Teacher +3690 (4500 * 0.82)
  await prisma.wallet.update({ where: { userId: parentUser.id }, data: { balance: { decrement: 4500 } } });
  await prisma.wallet.update({ where: { userId: teacherUser.id }, data: { balance: { increment: 3690 } } });

  await prisma.transaction.create({
    data: { walletId: teacherWallet.id, amount: 3690, type: 'PAYMENT_RELEASE', status: 'APPROVED', readableId: 'TX-PAY-002' }
  });


  // SCENARIO D: Scheduled Future Booking (Locked Funds)
  // Booking ID: BK-FUTURE-01
  const futureBooking = await prisma.booking.create({
    data: {
      readableId: 'BK-FUTURE-01',
      bookedByUserId: parentUser.id,
      beneficiaryType: 'CHILD',
      childId: child.id,
      teacherId: teacherProfile.id,
      subjectId: science.id,
      startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
      endTime: new Date(now.getTime() + 25 * 60 * 60 * 1000),
      price: 4500,
      status: 'SCHEDULED',
      paymentLockedAt: now,
    }
  });
  // Lock funds
  await prisma.wallet.update({
    where: { userId: parentUser.id },
    data: { balance: { decrement: 4500 }, pendingBalance: { increment: 4500 } }
  });


  // SCENARIO E: Pending Teacher Request (Student)
  // Booking ID: BK-REQ-01
  await prisma.booking.create({
    data: {
      readableId: 'BK-REQ-01',
      bookedByUserId: studentUser.id,
      beneficiaryType: 'STUDENT',
      studentUserId: studentUser.id,
      teacherId: teacherProfile.id,
      subjectId: math.id,
      startTime: new Date(now.getTime() + 48 * 60 * 60 * 1000), // Day after tomorrow
      endTime: new Date(now.getTime() + 49 * 60 * 60 * 1000),
      price: 5000,
      status: 'PENDING_TEACHER_APPROVAL',
      bookingNotes: 'I need help with Algebra please.',
    }
  });
  // Usually we lock funds on request, let's lock it
  await prisma.wallet.update({
    where: { userId: studentUser.id },
    data: { balance: { decrement: 5000 }, pendingBalance: { increment: 5000 } }
  });


  // SCENARIO F: Demo Session Request
  // Booking ID: BK-DEMO-01
  await prisma.booking.create({
    data: {
      readableId: 'BK-DEMO-01',
      bookedByUserId: studentUser.id,
      beneficiaryType: 'STUDENT',
      studentUserId: studentUser.id,
      teacherId: teacherProfile.id,
      subjectId: math.id, // Subject doesn't strictly matter for demo, but we use Math
      startTime: new Date(now.getTime() + 72 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 72 * 60 * 60 * 1000 + 15 * 60 * 1000), // 15 mins
      price: 0,
      status: 'PENDING_TEACHER_APPROVAL',
      bookingNotes: 'Introduction session',
    }
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ COMPREHENSIVE SEED COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Accounts:');
  console.log('👉 Admin:   admin@sidra.com / password123');
  console.log('👉 Teacher: teacher@sidra.com / password123 (Ahmad)');
  console.log('👉 Parent:  parent@sidra.com / password123 (Khalid, Child: Sarah)');
  console.log('👉 Student: student@sidra.com / password123 (Omar)');
  console.log('\nData Scenarios:');
  console.log('1. National Curriculum with Stages/Grades created.');
  console.log('2. Teacher Ahmad has tags, subjects, and availability.');
  console.log('3. Student Omar has a 10-session Math package.');
  console.log('4. Parent has a DISPUTED booking (check Admin Panel).');
  console.log('5. Parent has a PENDING_CONFIRMATION booking (check Dashboard).');
  console.log('6. Teacher has 2 Pending Requests (1 regular, 1 demo).');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
