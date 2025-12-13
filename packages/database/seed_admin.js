require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@sidra.com';
    const password = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            passwordHash: password,
            role: 'ADMIN',
            isActive: true,
            isVerified: true
        }
    });

    console.log('✅ Admin created:', admin.email);
}

main()
    .catch(e => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
