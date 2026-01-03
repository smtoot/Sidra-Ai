const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const teacherId = '65af4ad4-acfa-4882-baaa-d2e68ed2f7a0';

    // Check current state
    const settings = await prisma.teacherDemoSettings.findUnique({
        where: { teacherId }
    });
    console.log('Current settings:', settings);

    if (!settings) {
        // Create if doesn't exist
        const created = await prisma.teacherDemoSettings.create({
            data: {
                teacherId,
                demoEnabled: true,
                packagesEnabled: true
            }
        });
        console.log('Created new settings:', created);
    } else {
        // Update existing
        const updated = await prisma.teacherDemoSettings.update({
            where: { teacherId },
            data: { packagesEnabled: true }
        });
        console.log('Updated settings:', updated);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
