const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const curriculum = await prisma.curriculum.findFirst({
        where: { code: 'SA_CURR' }
    });

    if (!curriculum) {
        console.log('❌ Curriculum not found');
        return;
    }

    console.log('Curriculum ID:', curriculum.id);

    // Create stages (using educationalStage - the correct model name)
    const primaryStage = await prisma.educationalStage.create({
        data: {
            curriculumId: curriculum.id,
            nameAr: 'المرحلة الابتدائية',
            nameEn: 'Primary School',
            sequence: 1
        }
    });
    console.log('✅ Created Primary Stage');

    const middleStage = await prisma.educationalStage.create({
        data: {
            curriculumId: curriculum.id,
            nameAr: 'المرحلة المتوسطة',
            nameEn: 'Middle School',
            sequence: 2
        }
    });
    console.log('✅ Created Middle Stage');

    const highStage = await prisma.educationalStage.create({
        data: {
            curriculumId: curriculum.id,
            nameAr: 'المرحلة الثانوية',
            nameEn: 'High School',
            sequence: 3
        }
    });
    console.log('✅ Created High Stage');

    // Create grades for Primary (1-6) using gradeLevel
    const primaryNames = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'];
    for (let i = 1; i <= 6; i++) {
        await prisma.gradeLevel.create({
            data: {
                stageId: primaryStage.id,
                nameAr: 'الصف ' + primaryNames[i - 1],
                nameEn: 'Grade ' + i,
                code: 'G' + i,
                sequence: i
            }
        });
    }
    console.log('✅ Created Primary Grades (1-6)');

    // Create grades for Middle (7-9)
    const middleNames = ['الأول متوسط', 'الثاني متوسط', 'الثالث متوسط'];
    for (let i = 1; i <= 3; i++) {
        await prisma.gradeLevel.create({
            data: {
                stageId: middleStage.id,
                nameAr: 'الصف ' + middleNames[i - 1],
                nameEn: 'Grade ' + (i + 6),
                code: 'G' + (i + 6),
                sequence: i
            }
        });
    }
    console.log('✅ Created Middle Grades (7-9)');

    // Create grades for High (10-12)
    const highNames = ['الأول ثانوي', 'الثاني ثانوي', 'الثالث ثانوي'];
    for (let i = 1; i <= 3; i++) {
        await prisma.gradeLevel.create({
            data: {
                stageId: highStage.id,
                nameAr: 'الصف ' + highNames[i - 1],
                nameEn: 'Grade ' + (i + 9),
                code: 'G' + (i + 9),
                sequence: i
            }
        });
    }
    console.log('✅ Created High Grades (10-12)');

    console.log('\n📋 Curriculum setup complete!');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
