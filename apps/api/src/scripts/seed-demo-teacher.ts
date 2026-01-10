// @ts-nocheck
import {
  PrismaClient,
  Prisma,
  ApplicationStatus,
  SystemType,
  DayOfWeek,
} from '@sidra/database';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed for Demo Teacher...');

  // 1. Ensure Curriculum and Subject exist
  const curriculumCode = 'SUDAN_NATIONAL';
  let curriculum = await prisma.curricula.findUnique({
    where: { code: curriculumCode },
  });

  if (!curriculum) {
    console.log('Creating Sudanse National Curriculum...');
    curriculum = await prisma.curricula.create({
      data: {
        code: curriculumCode,
        nameAr: 'المنهج القومي السوداني',
        nameEn: 'Sudanese National Curriculum',
        systemType: SystemType.NATIONAL,
        isActive: true,
      },
    });
  }

  const subjectNameAr = 'الرياضيات';
  let subject = await prisma.subjects.findFirst({
    where: { nameAr: subjectNameAr },
  });

  if (!subject) {
    console.log('Creating Mathematics Subject...');
    subject = await prisma.subjects.create({
      data: {
        nameAr: subjectNameAr,
        nameEn: 'Mathematics',
        isActive: true,
      },
    });
  }

  // Link them if not linked
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

  // 2. Create User
  const email = 'teacher@demo.com';
  const phone = '+249912345678';
  const password = 'Password123!';
  const hashedPassword = await bcrypt.hash(password, 10);

  let user = await prisma.users.findUnique({
    where: { email },
    include: { teacher_profiles: true },
  });

  if (!user) {
    console.log(`Creating user ${email}...`);
    user = await prisma.users.create({
      data: {
        email,
        phoneNumber: phone,
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
            bio: 'معلم رياضيات خبرة 10 سنوات في تدريس المنهج السوداني. \nحاصل على جائزة المعلم المثالي لعام 2023. \nأتميز بأسلوب شرح مبسط يراعي الفروق الفردية بين الطلاب.',
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
            teachingStyle: 'أعتمد على التعليم التفاعلي وحل المشكلات.',
          },
        },
      },
      include: { teacher_profiles: true },
    });
  } else {
    console.log(`User ${email} already exists. Updating profile...`);
    // Ensure profile exists
    if (!user.teacher_profiles) {
      await prisma.teacher_profiles.create({
        data: {
          userId: user.id,
          displayName: 'الأستاذ أحمد محمد',
          applicationStatus: ApplicationStatus.APPROVED,
          slug: 'ahmed-mohamed-math-' + Date.now(), // avoiding conflict if re-run
        },
      });
      // Refetch
      user = await prisma.users.findUnique({
        where: { id: user.id },
        include: { teacher_profiles: true },
      });
    }
  }

  const teacherProfile = user.teacher_profiles;
  if (!teacherProfile) throw new Error('Failed to create/find profile');

  // Update basic fields that might differ or if we just found existing user
  await prisma.teacher_profiles.update({
    where: { id: teacherProfile.id },
    data: {
      bio: 'معلم رياضيات خبرة 10 سنوات في تدريس المنهج السوداني. \nحاصل على جائزة المعلم المثالي لعام 2023. \nأتميز بأسلوب شرح مبسط يراعي الفروق الفردية بين الطلاب.',
      yearsOfExperience: 10,
      applicationStatus: ApplicationStatus.APPROVED,
      displayName: 'الأستاذ أحمد محمد',
      isOnVacation: false,
      // teachingStyle field in schema? Yes `teachingStyle String?`
      teachingStyle: 'أعتمد على التعليم التفاعلي وحل المشكلات.',
    },
  });

  // 3. Qualifications
  const qualificationsCount = await prisma.teacher_qualifications.count({
    where: { teacherId: teacherProfile.id },
  });
  if (qualificationsCount === 0) {
    await prisma.teacher_qualifications.create({
      data: {
        teacherId: teacherProfile.id,
        degreeName: 'بكالوريوس التربية (رياضيات)',
        institution: 'جامعة الخرطوم',
        graduationYear: 2015,
        verified: true,
        certificateUrl: 'https://example.com/cert.pdf', // Dummy
        updatedAt: new Date(),
      },
    });
  }

  // 4. Skills
  const skillsCount = await prisma.teacher_skills.count({
    where: { teacherId: teacherProfile.id },
  });
  if (skillsCount === 0) {
    await prisma.teacher_skills.createMany({
      data: [
        {
          teacherId: teacherProfile.id,
          name: 'الرياضيات المتقدمة',
          proficiency: 'EXPERT',
          updatedAt: new Date(),
        },
        {
          teacherId: teacherProfile.id,
          name: 'التعلم عن بعد',
          proficiency: 'ADVANCED',
          updatedAt: new Date(),
        },
        {
          teacherId: teacherProfile.id,
          name: 'تبسيط المفاهيم',
          proficiency: 'EXPERT',
          updatedAt: new Date(),
        },
      ],
    });
  }

  // 5. Link Subject with Price
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

  // 6. Availability (Mon, Wed, Fri 4pm - 8pm)
  await prisma.availability.deleteMany({
    where: { teacherId: teacherProfile.id },
  });

  await prisma.availability.createMany({
    data: [
      {
        teacherId: teacherProfile.id,
        dayOfWeek: DayOfWeek.MONDAY,
        startTime: '16:00',
        endTime: '20:00',
      },
      {
        teacherId: teacherProfile.id,
        dayOfWeek: DayOfWeek.WEDNESDAY,
        startTime: '16:00',
        endTime: '20:00',
      },
      {
        teacherId: teacherProfile.id,
        dayOfWeek: DayOfWeek.FRIDAY,
        startTime: '16:00',
        endTime: '20:00',
      },
    ],
  });

  // 7. Demo Settings
  const demoSettings = await prisma.teacher_demo_settings.findUnique({
    where: { teacherId: teacherProfile.id },
  });
  if (!demoSettings) {
    await prisma.teacher_demo_settings.create({
      data: {
        teacherId: teacherProfile.id,
        demoEnabled: true,
        packagesEnabled: true,
        updatedAt: new Date(),
      },
    });
  }

  console.log('✅ Demo teacher created successfully');
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Password: ${password}`);
  console.log(`🔗 Profile Slug: ${teacherProfile.slug || 'not-set'}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
