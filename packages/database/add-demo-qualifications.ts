import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addQualifications() {
  // First, get the teacher by slug
  const teacher = await prisma.teacherProfile.findUnique({
    where: { slug: 'ahmad-ali' },
    select: { id: true, displayName: true }
  });

  if (!teacher) {
    console.log('❌ Teacher not found');
    await prisma.$disconnect();
    return;
  }

  console.log('👨‍🏫 Adding qualifications for:', teacher.displayName);
  console.log('');

  // Check if qualifications already exist
  const existingQuals = await prisma.teacherQualification.findMany({
    where: { teacherId: teacher.id }
  });

  if (existingQuals.length > 0) {
    console.log('⚠️  Qualifications already exist. Deleting old ones...');
    await prisma.teacherQualification.deleteMany({
      where: { teacherId: teacher.id }
    });
  }

  // Add Bachelor's degree (graduated)
  const bachelor = await prisma.teacherQualification.create({
    data: {
      teacherId: teacher.id,
      degreeName: 'بكالوريوس الرياضيات',
      institution: 'جامعة الخرطوم',
      fieldOfStudy: 'الرياضيات التطبيقية',
      status: 'GRADUATED',
      graduationYear: 2018,
      startDate: new Date('2014-09-01'),
      endDate: new Date('2018-06-15'),
      certificateUrl: 'https://example.com/cert1.pdf',
      verified: true,
      verifiedAt: new Date(),
      verifiedBy: 'admin-id'
    }
  });

  // Add Master's degree (in progress)
  const master = await prisma.teacherQualification.create({
    data: {
      teacherId: teacher.id,
      degreeName: 'ماجستير في التربية',
      institution: 'الجامعة الإسلامية العالمية',
      fieldOfStudy: 'طرق التدريس الحديثة',
      status: 'IN_PROGRESS',
      graduationYear: 2025,
      startDate: new Date('2022-09-01'),
      certificateUrl: 'https://example.com/cert2.pdf',
      verified: true,
      verifiedAt: new Date()
    }
  });

  // Update yearsOfExperience
  await prisma.teacherProfile.update({
    where: { id: teacher.id },
    data: { yearsOfExperience: 6 }
  });

  console.log('✅ Bachelor degree: بكالوريوس الرياضيات - جامعة الخرطوم (2018)');
  console.log('✅ Master degree: ماجستير في التربية - الجامعة الإسلامية العالمية (متوقع 2025)');
  console.log('✅ Years of experience: 6 years');
  console.log('');
  console.log('🎉 Demo data added successfully!');
  console.log('');
  console.log('👉 Now visit: http://localhost:3000/teachers/ahmad-ali');
  console.log('');

  await prisma.$disconnect();
}

addQualifications()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
