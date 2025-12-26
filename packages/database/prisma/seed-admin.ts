
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Admin User...');

    const email = 'admin@sidra.com';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            phoneNumber: '0599999999', // Admin placeholder phone
            passwordHash: hashedPassword,
            role: UserRole.ADMIN,
            isActive: true,
            isVerified: true
        },
    });

    console.log(`✅ Admin user seeded: ${admin.email}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
