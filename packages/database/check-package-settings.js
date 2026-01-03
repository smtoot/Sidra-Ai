const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    // Check global settings
    const settings = await prisma.systemSettings.findFirst();
    console.log('\n=== System Settings ===');
    console.log('packagesEnabled:', settings?.packagesEnabled);
    console.log('demosEnabled:', settings?.demosEnabled);

    // Check teacher settings
    const teacherSettings = await prisma.teacherDemoSettings.findMany();
    console.log('\n=== Teacher Demo Settings ===');
    teacherSettings.forEach(ts => {
        console.log(`Teacher ${ts.teacherId}:`);
        console.log('  demoEnabled:', ts.demoEnabled);
        console.log('  packagesEnabled:', ts.packagesEnabled);
    });

    // Check package tiers
    const tiers = await prisma.packageTier.findMany();
    console.log('\n=== Package Tiers ===');
    tiers.forEach(t => {
        console.log(`${t.name} (${t.sessionCount} sessions): isActive=${t.isActive}`);
    });

    // If no settings exist, create default
    if (!settings) {
        console.log('\n⚠️ No SystemSettings found! Creating default...');
        await prisma.systemSettings.create({
            data: {
                id: 'default',
                packagesEnabled: true,
                demosEnabled: true
            }
        });
        console.log('✅ Created default SystemSettings');
    } else if (!settings.packagesEnabled) {
        console.log('\n⚠️ Packages are DISABLED globally! Enabling...');
        await prisma.systemSettings.update({
            where: { id: 'default' },
            data: { packagesEnabled: true }
        });
        console.log('✅ Enabled packages globally');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
