import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addAvailability() {
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

  console.log('👨‍🏫 Adding availability for:', teacher.displayName);
  console.log('');

  // Check if availability already exists
  const existingAvailability = await prisma.availability.findMany({
    where: { teacherId: teacher.id }
  });

  if (existingAvailability.length > 0) {
    console.log('⚠️  Availability already exists. Deleting old ones...');
    await prisma.availability.deleteMany({
      where: { teacherId: teacher.id }
    });
  }

  // Add comprehensive weekly availability
  const availabilitySlots = [
    // Sunday - Morning and Evening
    { dayOfWeek: 'SUNDAY', startTime: '09:00', endTime: '12:00' },
    { dayOfWeek: 'SUNDAY', startTime: '18:00', endTime: '21:00' },

    // Monday - Morning and Afternoon
    { dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '11:00' },
    { dayOfWeek: 'MONDAY', startTime: '14:00', endTime: '17:00' },

    // Tuesday - Afternoon and Evening
    { dayOfWeek: 'TUESDAY', startTime: '13:00', endTime: '16:00' },
    { dayOfWeek: 'TUESDAY', startTime: '19:00', endTime: '22:00' },

    // Wednesday - Morning and Evening
    { dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '12:00' },
    { dayOfWeek: 'WEDNESDAY', startTime: '18:00', endTime: '21:00' },

    // Thursday - Full day
    { dayOfWeek: 'THURSDAY', startTime: '09:00', endTime: '12:00' },
    { dayOfWeek: 'THURSDAY', startTime: '14:00', endTime: '17:00' },
    { dayOfWeek: 'THURSDAY', startTime: '19:00', endTime: '22:00' },

    // Saturday - Morning only
    { dayOfWeek: 'SATURDAY', startTime: '10:00', endTime: '13:00' },
  ];

  for (const slot of availabilitySlots) {
    await prisma.availability.create({
      data: {
        teacherId: teacher.id,
        dayOfWeek: slot.dayOfWeek as any,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isRecurring: true
      }
    });
  }

  console.log(`✅ Added ${availabilitySlots.length} availability slots`);
  console.log('');
  console.log('📅 Availability Summary:');
  console.log('  الأحد (Sunday): 9 AM - 12 PM, 6 PM - 9 PM');
  console.log('  الإثنين (Monday): 8 AM - 11 AM, 2 PM - 5 PM');
  console.log('  الثلاثاء (Tuesday): 1 PM - 4 PM, 7 PM - 10 PM');
  console.log('  الأربعاء (Wednesday): 9 AM - 12 PM, 6 PM - 9 PM');
  console.log('  الخميس (Thursday): 9 AM - 12 PM, 2 PM - 5 PM, 7 PM - 10 PM');
  console.log('  السبت (Saturday): 10 AM - 1 PM');
  console.log('');
  console.log('🎉 Demo availability added successfully!');
  console.log('');
  console.log('👉 Now refresh and try booking at: http://localhost:3000/teachers/ahmad-ali');
  console.log('');

  await prisma.$disconnect();
}

addAvailability()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
