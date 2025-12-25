import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Get teacher Ahmed's subjects
    const teacherSubjects = await prisma.teacherSubject.findMany({
        where: {
            teacherId: 'd8f82da5-076a-4a9c-8d61-3abf43ad0e0c'
        },
        include: {
            subject: true,
            curriculum: true
        }
    });

    console.log('===== Teacher Ahmed\'s Subjects =====');
    teacherSubjects.forEach(ts => {
        console.log(`- Subject: ${ts.subject.nameEn} (ID: ${ts.subjectId})`);
        console.log(`  Curriculum: ${ts.curriculum.nameEn}`);
        console.log(`  Price/Hour: ${ts.pricePerHour}`);
    });

    // Get parent Fatima's children
    const parent = await prisma.parentProfile.findFirst({
        where: { userId: 'ec11c350-b455-4c8a-afd4-9b696b8c8b4b' },
        include: {
            children: true
        }
    });

    console.log('\n===== Parent Fatima\'s Children =====');
    parent?.children.forEach(child => {
        console.log(`- ${child.name} (ID: ${child.id})`);
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
