// @ts-nocheck
import {
  PrismaClient,
  ApplicationStatus,
  SystemType,
  DayOfWeek,
  UserRole,
  Gender,
} from '@sidra/database';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creating Demo Users for Testing...\n');

  const commonPassword = 'Test123!';
  const hashedPassword = await bcrypt.hash(commonPassword, 10);

  // 1. Ensure Curriculum and Subject exist
  let curriculum = await prisma.curricula.findUnique({
    where: { code: 'SUDAN_NATIONAL' },
  });

  if (!curriculum) {
    console.log('Creating Sudanese National Curriculum...');
    curriculum = await prisma.curricula.create({
      data: {
        code: 'SUDAN_NATIONAL',
        nameAr: 'المنهج القومي السوداني',
        nameEn: 'Sudanese National Curriculum',
        systemType: SystemType.NATIONAL,
        isActive: true,
      },
    });
  }

  let subject = await prisma.subjects.findFirst({
    where: { nameAr: 'الرياضيات' },
  });

  if (!subject) {
    console.log('Creating Mathematics Subject...');
    subject = await prisma.subjects.create({
      data: {
        nameAr: 'الرياضيات',
        nameEn: 'Mathematics',
        isActive: true,
      },
    });
  }

  // Link curriculum to subject if not linked
  const csLink = await prisma.curriculum_subjects.findUnique({
    where: {
      curriculumId_subjectId: {
        curriculumId: curriculum.id,
        subjectId: subject.id,
      },
    },
  });

  if (!csLink) {
    await prisma.curriculum_subjects.create({
      data: {
        curriculumId: curriculum.id,
        subjectId: subject.id,
      },
    });
  }

  // ============ DEMO TEACHER ============
  console.log('\n👨‍🏫 Creating Demo Teacher...');
  const teacherEmail = 'teacher@demo.com';

  let teacherUser = await prisma.users.findUnique({
    where: { email: teacherEmail },
    include: { teacher_profiles: true },
  });

  if (!teacherUser) {
    teacherUser = await prisma.users.create({
      data: {
        email: teacherEmail,
        phoneNumber: '+249912345678',
        passwordHash: hashedPassword,
        firstName: 'أحمد',
        lastName: 'محمد',
        role: 'TEACHER',
        isVerified: true,
        emailVerified: true,
        updatedAt: new Date(),
        teacher_profiles: {
          create: {
            displayName: 'الأستاذ أحمد محمد',
            bio: 'معلم رياضيات خبرة 10 سنوات في تدريس المنهج السوداني.',
            headline: 'معلم رياضيات خبير',
            yearsOfExperience: 10,
            applicationStatus: ApplicationStatus.APPROVED,
            city: 'Khartoum',
            country: 'Sudan',
            isOnVacation: false,
            slug: 'ahmed-mohamed-math',
            hasCompletedOnboarding: true,
            totalReviews: 15,
            averageRating: 4.8,
            totalSessions: 120,
          },
        },
      },
      include: { teacher_profiles: true },
    });
    console.log(`   ✅ Created: ${teacherEmail}`);
  } else {
    console.log(`   ⏭️  Already exists: ${teacherEmail}`);
  }

  const teacherProfile = teacherUser.teacher_profiles;
  if (teacherProfile) {
    // Ensure subjects and availability are linked
    const subjectLink = await prisma.teacher_subjects.findFirst({
      where: { teacherId: teacherProfile.id, subjectId: subject.id },
    });

    if (!subjectLink) {
      await prisma.teacher_subjects.create({
        data: {
          teacherId: teacherProfile.id,
          subjectId: subject.id,
          curriculumId: curriculum.id,
          pricePerHour: 5000,
        },
      });
    }

    // Add availability
    const existingAvail = await prisma.availability.count({
      where: { teacherId: teacherProfile.id },
    });

    if (existingAvail === 0) {
      await prisma.availability.createMany({
        data: [
          {
            teacherId: teacherProfile.id,
            dayOfWeek: DayOfWeek.SUNDAY,
            startTime: '09:00',
            endTime: '17:00',
          },
          {
            teacherId: teacherProfile.id,
            dayOfWeek: DayOfWeek.MONDAY,
            startTime: '09:00',
            endTime: '17:00',
          },
          {
            teacherId: teacherProfile.id,
            dayOfWeek: DayOfWeek.TUESDAY,
            startTime: '09:00',
            endTime: '17:00',
          },
          {
            teacherId: teacherProfile.id,
            dayOfWeek: DayOfWeek.WEDNESDAY,
            startTime: '09:00',
            endTime: '17:00',
          },
          {
            teacherId: teacherProfile.id,
            dayOfWeek: DayOfWeek.THURSDAY,
            startTime: '09:00',
            endTime: '17:00',
          },
        ],
      });
    }
  }

  // ============ DEMO STUDENT ============
  console.log('\n👨‍🎓 Creating Demo Student...');
  const studentEmail = 'student@demo.com';

  let studentUser = await prisma.users.findUnique({
    where: { email: studentEmail },
  });

  if (!studentUser) {
    studentUser = await prisma.users.create({
      data: {
        email: studentEmail,
        phoneNumber: '+249987654321',
        passwordHash: hashedPassword,
        firstName: 'محمد',
        lastName: 'علي',
        role: 'STUDENT',
        isVerified: true,
        emailVerified: true,
        updatedAt: new Date(),
      },
    });

    // Create student wallet
    await prisma.wallets.create({
      data: {
        userId: studentUser.id,
        balance: 50000, // Give them some balance for testing
        currency: 'SDG',
        updatedAt: new Date(),
      },
    });

    console.log(`   ✅ Created: ${studentEmail}`);
  } else {
    console.log(`   ⏭️  Already exists: ${studentEmail}`);
  }

  // ============ DEMO PARENT ============
  console.log('\n👨‍👧 Creating Demo Parent...');
  const parentEmail = 'parent@demo.com';

  let parentUser = await prisma.users.findUnique({
    where: { email: parentEmail },
    include: { parent_profiles: true },
  });

  if (!parentUser) {
    parentUser = await prisma.users.create({
      data: {
        email: parentEmail,
        phoneNumber: '+249911223344',
        passwordHash: hashedPassword,
        firstName: 'سارة',
        lastName: 'أحمد',
        role: 'PARENT',
        isVerified: true,
        emailVerified: true,
        updatedAt: new Date(),
        parent_profiles: {
          create: {},
        },
      },
      include: { parent_profiles: true },
    });

    // Create parent wallet
    await prisma.wallets.create({
      data: {
        userId: parentUser.id,
        balance: 100000, // Give them some balance for testing
        currency: 'SDG',
        updatedAt: new Date(),
      },
    });

    // Create a child for the parent
    if (parentUser.parent_profiles) {
      await prisma.children.create({
        data: {
          parentId: parentUser.parent_profiles.id,
          name: 'عبدالرحمن',
          gradeLevel: 'الصف السابع',
          curriculumId: curriculum.id,
        },
      });
    }

    console.log(`   ✅ Created: ${parentEmail}`);
  } else {
    console.log(`   ⏭️  Already exists: ${parentEmail}`);
  }

  // ============ DEMO ADMIN ============
  console.log('\n👑 Creating Demo Admin...');
  const adminEmail = 'admin@demo.com';

  let adminUser = await prisma.users.findUnique({
    where: { email: adminEmail },
  });

  if (!adminUser) {
    adminUser = await prisma.users.create({
      data: {
        email: adminEmail,
        phoneNumber: '+249900000000',
        passwordHash: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isVerified: true,
        emailVerified: true,
        updatedAt: new Date(),
      },
    });
    console.log(`   ✅ Created: ${adminEmail}`);
  } else {
    console.log(`   ⏭️  Already exists: ${adminEmail}`);
  }

  // ============ SUMMARY ============
  console.log('\n' + '='.repeat(50));
  console.log('✅ Demo Users Created Successfully!');
  console.log('='.repeat(50));
  console.log('\n📋 Login Credentials (Password for all: Test123!)\n');
  console.log('┌─────────────────────────────────────────────────┐');
  console.log('│ Role      │ Email              │ Password      │');
  console.log('├─────────────────────────────────────────────────┤');
  console.log('│ Teacher   │ teacher@demo.com   │ Test123!      │');
  console.log('│ Student   │ student@demo.com   │ Test123!      │');
  console.log('│ Parent    │ parent@demo.com    │ Test123!      │');
  console.log('│ Admin     │ admin@demo.com     │ Test123!      │');
  console.log('└─────────────────────────────────────────────────┘');
  console.log('\n💡 Student has 50,000 SDG balance');
  console.log('💡 Parent has 100,000 SDG balance & 1 child');
  console.log('💡 Teacher is approved with availability set\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
