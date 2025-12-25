import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Get parent Fatima's info
    const parent = await prisma.user.findFirst({
        where: { phoneNumber: '0500000004', role: 'PARENT' },
        include: {
            parentProfile: {
                include: {
                    children: true
                }
            },
            wallet: true
        }
    });

    console.log('===== Parent Fatima =====');
    console.log('User ID:', parent?.id);
    console.log('Phone:', parent?.phoneNumber);
    console.log('Children:', parent?.parentProfile?.children.map(c => ({ id: c.id, name: c.name })));
    console.log('Wallet Balance:', parent?.wallet?.balance);
    console.log('Wallet Pending Balance:', parent?.wallet?.pendingBalance);

    // Get teacher Ahmed's info
    const teacher = await prisma.teacherProfile.findFirst({
        where: {
            user: { phoneNumber: '0500000001' }
        },
        include: {
            user: true
        }
    });

    console.log('\n===== Teacher Ahmed =====');
    console.log('Profile ID:', teacher?.id);
    console.log('User ID:', teacher?.userId);
    console.log('Phone:', teacher?.user?.phoneNumber);

    // Get Mathematics subject
    const mathSubject = await prisma.subject.findFirst({
        where: {
            OR: [
                { nameEn: { contains: 'Math', mode: 'insensitive' } },
                { nameAr: { contains: 'رياضيات' } }
            ]
        }
    });

    console.log('\n===== Mathematics Subject =====');
    console.log('Subject ID:', mathSubject?.id);
    console.log('Name (EN):', mathSubject?.nameEn);
    console.log('Name (AR):', mathSubject?.nameAr);

    // Count existing transactions
    const txCount = await prisma.transaction.count();
    console.log('\n===== Current State =====');
    console.log('Transaction count:', txCount);
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
