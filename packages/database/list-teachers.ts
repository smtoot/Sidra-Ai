import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Get all teachers
    const teachers = await prisma.teacherProfile.findMany({
        take: 5,
        include: {
            user: { select: { id: true, phoneNumber: true, email: true } }
        }
    });

    console.log('=====ALL TEACHERS =====');
    teachers.forEach((t, i) => {
        console.log(`Teacher ${i + 1}:`);
        console.log('  Profile ID:', t.id);
        console.log('  User ID:', t.userId);
        console.log('  Phone:', t.user.phoneNumber);
        console.log('  Email:', t.user.email);
        console.log('  Display Name:', t.displayName);
        console.log('---');
    });
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
