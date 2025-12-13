import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'teacher@sidra.com';
    const password = 'teacher123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            passwordHash: hashedPassword,
            role: UserRole.TEACHER,
            isVerified: true,
            teacherProfile: {
                create: {
                    bio: 'Initial Bio',
                    yearsOfExperience: 5,
                    education: 'BSc Education',
                    // gender: 'MALE', // Optional
                }
            }
        },
    });

    console.log(`Created teacher: ${user.email} (Password: ${password})`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
