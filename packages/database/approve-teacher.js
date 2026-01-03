const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    // Use the ID from previous context: 65af4ad4-acfa-4882-baaa-d2e68ed2f7a0
    const teacherProfileId = '65af4ad4-acfa-4882-baaa-d2e68ed2f7a0';

    const profile = await prisma.teacherProfile.findUnique({
        where: { id: teacherProfileId },
        select: { id: true, userId: true, applicationStatus: true }
    });

    console.log('Teacher Profile:', profile);

    if (profile && profile.applicationStatus !== 'APPROVED') {
        console.log('⚠️ Teacher is NOT APPROVED. Updating to APPROVED...');
        await prisma.teacherProfile.update({
            where: { id: teacherProfileId },
            data: { applicationStatus: 'APPROVED' }
        });
        console.log('✅ Teacher Approved');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
