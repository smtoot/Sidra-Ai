const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const teacherId = '65af4ad4-acfa-4882-baaa-d2e68ed2f7a0';

    const profile = await prisma.teacherProfile.findMany({
        where: { teacherId },
        select: { applicationStatus: true, id: true, userId: true }
    });
    // Note: teacherId in teacher_demo_settings is actually the profile ID or user ID?
    // Let's check typical usage. In schema: teacher_profiles has id (uuid) and userId (string).
    // Schema says: teacher_demo_settings relation field is teacherId, references TeacherProfile.id

    // Wait, I used '65af4ad4-acfa-4882-baaa-d2e68ed2f7a0' as teacherId in previous steps.
    // Is that the User ID or Teacher Profile ID?
    // In package.controller test earlier I used it as teacherId. 

    const profileByTeacherId = await prisma.teacherProfile.findUnique({
        where: { id: teacherId }
    });

    // Also check if it's a user ID
    const profileByUserId = await prisma.teacherProfile.findUnique({
        where: { userId: teacherId }
    });

    console.log('Profile by ID:', profileByTeacherId);
    console.log('Profile by UserID:', profileByUserId);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
