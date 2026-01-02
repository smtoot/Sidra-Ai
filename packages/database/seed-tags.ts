
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const tags = [
        { labelAr: "📘 يحتاجون شرح مبسط", sortOrder: 1 },
        { labelAr: "🌍 يفهمون بالتمثيل والأمثلة", sortOrder: 2 },
        { labelAr: "🧠 يفضلون الفهم بدل الحفظ", sortOrder: 3 },
        { labelAr: "🔗 يحبون الربط بالحياة الواقعية", sortOrder: 4 },

        { labelAr: "🎯 يستعدون للاختبارات", sortOrder: 5 },
        { labelAr: "✍️ يركّزون على حل الأسئلة", sortOrder: 6 },
        { labelAr: "📈 يريدون رفع مستواهم الدراسي", sortOrder: 7 },
        { labelAr: "🧱 يعانون من ضعف في الأساسيات", sortOrder: 8 },

        { labelAr: "💡 يفضلون التعلم التفاعلي", sortOrder: 9 },
        { labelAr: "💬 يحبون النقاش وطرح الأسئلة", sortOrder: 10 },
        { labelAr: "🪜 يتعلمون بالخطوات المتدرجة", sortOrder: 11 },
        { labelAr: "👀 يحتاجون متابعة مستمرة", sortOrder: 12 },

        { labelAr: "🧒 طلاب المراحل الأولى", sortOrder: 13 },
        { labelAr: "👦 طلاب المرحلة المتوسطة", sortOrder: 14 },
        { labelAr: "🎓 طلاب المرحلة الثانوية", sortOrder: 15 },

        { labelAr: "⏳ يحتاجون وقت إضافي للفهم", sortOrder: 16 },
        { labelAr: "⚡ يتعلمون بسرعة", sortOrder: 17 },

        { labelAr: "🌱 يحتاجون تشجيع وتحفيز", sortOrder: 18 },
        { labelAr: "😟 يعانون من رهبة الامتحانات", sortOrder: 19 }
    ];

    console.log(`Seeding ${tags.length} Teaching Approach Tags...`);

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
            console.log(`Updating tag: ${tag.labelAr}`);
            // Update sort order if it exists
            await prisma.teachingApproachTag.update({
                where: { id: existing.id },
                data: {
                    sortOrder: tag.sortOrder,
                    isActive: true
                }
            });
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
