
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Admin User...');

    const email = 'admin@sidra.com';
    const password = 'Admin123!@#$'; // Strong password: 12+ chars, uppercase, lowercase, number, special
    const hashedPassword = await bcrypt.hash(password, 10);

    // Verify hash immediately
    const isLocalMatch = await bcrypt.compare(password, hashedPassword);
    console.log(`🔐 Verification Check: ${isLocalMatch ? 'SUCCESS' : 'FAILED'}`);

    if (!isLocalMatch) {
        console.error('CRITICAL: Hash generation failed verification!');
        process.exit(1);
    }

    const admin = await prisma.user.upsert({
        where: { email },
        update: {
            passwordHash: hashedPassword, // Ensure update happens even if user exists
            isVerified: true,
            isActive: true
        },
        create: {
            email,
            phoneNumber: '0599999999', // Admin placeholder phone
            passwordHash: hashedPassword,
            role: UserRole.ADMIN,
            isActive: true, // Default
            isVerified: true
        },
    });

    console.log(`✅ Admin user seeded: ${admin.email}`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`\n🚀 You can now login with these credentials!`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
