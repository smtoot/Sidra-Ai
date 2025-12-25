const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Setting up teacher availability...');

    // Get teacher profile
    const teacher = await prisma.teacherProfile.findFirst({
        where: { user: { phoneNumber: '0500000002' } }
    });

    if (!teacher) {
        console.log('❌ Teacher not found');
        return;
    }

    console.log('✅ Teacher ID:', teacher.id);

    // Create availability for weekdays using createMany
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'];

    // Delete existing availability first
    await prisma.availability.deleteMany({ where: { teacherId: teacher.id } });

    // Create new availability
    await prisma.availability.createMany({
        data: days.map(day => ({
            teacherId: teacher.id,
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '17:00',
            isRecurring: true
        }))
    });

    console.log('✅ Availability: Sun-Thu, 9AM-5PM');

    // Check subjects
    const subjects = await prisma.teacherSubject.findMany({
        where: { teacherId: teacher.id },
        include: { subject: true }
    });

    if (subjects.length === 0) {
        const mathSubject = await prisma.subject.findFirst({ where: { nameEn: 'Mathematics' } });
        if (mathSubject) {
            await prisma.teacherSubject.create({
                data: {
                    teacherId: teacher.id,
                    subjectId: mathSubject.id,
                    pricePerHour: 50
                }
            });
            console.log('✅ Added Mathematics (50 SDG/hour)');
        }
    } else {
        console.log('✅ Subjects:', subjects.map(s => s.subject.nameEn).join(', '));
    }

    // Reset parent wallet to 0 for testing
    const parentWallet = await prisma.wallet.findFirst({
        where: { user: { phoneNumber: '0500000004' } }
    });

    if (parentWallet) {
        await prisma.wallet.update({
            where: { id: parentWallet.id },
            data: { balance: 0 }
        });
        console.log('✅ Parent wallet reset to 0 SDG');
    }

    console.log('\n📋 Ready for testing!');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
