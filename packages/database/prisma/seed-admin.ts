
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Super Admin User...');

    const email = 'superadmin@sidra.com';
    const password = 'SuperAdmin123!@#$'; // Strong password: 12+ chars, uppercase, lowercase, number, special
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
            isActive: true,
            role: UserRole.SUPER_ADMIN
        },
        create: {
            email,
            phoneNumber: '+249999999999', // Admin placeholder phone
            passwordHash: hashedPassword,
            role: UserRole.SUPER_ADMIN,
            isActive: true,
            isVerified: true
        },
    });

    console.log(`✅ Super Admin user seeded: ${admin.email}`);
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
