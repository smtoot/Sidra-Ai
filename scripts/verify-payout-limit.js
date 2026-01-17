
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
    console.log('--- Verifying Minimum Payout Settings ---');

    // 1. Get current settings
    const settings = await prisma.system_settings.findUnique({
        where: { id: 'default' }
    });

    console.log('Current Settings:', {
        minWithdrawalAmount: settings.minWithdrawalAmount?.toString(),
        updatedAt: settings.updatedAt
    });

    // 2. Update to a high limit for testing
    const testLimit = 2500;
    await prisma.system_settings.update({
        where: { id: 'default' },
        data: { minWithdrawalAmount: testLimit }
    });
    console.log(`Updated minWithdrawalAmount to ${testLimit}`);

    // 3. Confirm update
    const updatedSettings = await prisma.system_settings.findUnique({
        where: { id: 'default' }
    });
    console.log('Verified Settings:', {
        minWithdrawalAmount: updatedSettings.minWithdrawalAmount?.toString()
    });

    // 4. Cleanup/Reset to 500
    await prisma.system_settings.update({
        where: { id: 'default' },
        data: { minWithdrawalAmount: 500 }
    });
    console.log('Reset minWithdrawalAmount to 500');
}

verify()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
