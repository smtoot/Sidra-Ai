
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@sidra.com';
    const password = 'password123';
    const phoneNumber = '1234567890';

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    console.log(`Creating user with email: ${email}`);

    const user = await prisma.users.upsert({
        where: { email },
        update: {},
        create: {
            email,
            passwordHash,
            phoneNumber,
            role: UserRole.SUPER_ADMIN,
            firstName: 'Super',
            lastName: 'Admin',
            isActive: true,
            isVerified: true,
            emailVerified: true,
            updatedAt: new Date(),
        },
    });

    console.log('User created:', user);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
