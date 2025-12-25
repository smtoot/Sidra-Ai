
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const tags = [
        { labelAr: 'يحتاجون شرح مبسط', sortOrder: 1 },
        { labelAr: 'يستعدون للاختبارات', sortOrder: 2 },
        { labelAr: 'يفضلون التعلم التفاعلي', sortOrder: 3 },
    ];

    for (const tag of tags) {
        const existing = await prisma.teachingApproachTag.findFirst({
            where: { labelAr: tag.labelAr },
        });

        if (!existing) {
            console.log(`Creating tag: ${tag.labelAr}`);
            await prisma.teachingApproachTag.create({
                data: {
                    labelAr: tag.labelAr,
                    sortOrder: tag.sortOrder,
                    isActive: true,
                },
            });
        } else {
            console.log(`Tag already exists: ${tag.labelAr}`);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
