require('dotenv/config');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    // Get teacher and parent profiles
    const teacherUser = await prisma.user.findUnique({
        where: { email: 'teacher@sidra.com' },
        include: { teacherProfile: { include: { subjects: true } } }
    });

    // Create a parent if doesn't exist
    const bcrypt = require('bcrypt');
    let parentUser = await prisma.user.findUnique({
        where: { email: 'parent@sidra.com' },
        include: { parentProfile: { include: { students: true } } }
    });

    if (!parentUser) {
        const passwordHash = await bcrypt.hash('parent123', 10);
        parentUser = await prisma.user.create({
            data: {
                email: 'parent@sidra.com',
                passwordHash,
                role: 'PARENT',
                isActive: true,
                isVerified: true,
                parentProfile: {
                    create: {}
                }
            },
            include: { parentProfile: { include: { students: true } } }
        });
    }

    // Create a student if doesn't exist
    let student = parentUser.parentProfile.students[0];
    if (!student) {
        student = await prisma.student.create({
            data: {
                parentId: parentUser.parentProfile.id,
                name: 'أحمد محمد',
                gradeLevel: 'الصف العاشر'
            }
        });
    }

    // Create a test booking
    const teacherSubject = teacherUser.teacherProfile.subjects[0];

    if (teacherSubject) {
        const startTime = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later

        const booking = await prisma.booking.create({
            data: {
                teacherId: teacherUser.teacherProfile.id,
                parentId: parentUser.parentProfile.id,
                studentId: student.id,
                subjectId: teacherSubject.subjectId,
                startTime,
                endTime,
                price: teacherSubject.pricePerHour,
                status: 'PENDING_TEACHER_APPROVAL'
            }
        });

        console.log('✅ Test booking created:', {
            id: booking.id,
            teacher: teacherUser.email,
            parent: parentUser.email,
            student: student.name,
            time: startTime.toISOString()
        });
    } else {
        console.log('⚠️  Teacher has no subjects yet. Please complete teacher profile first.');
    }

    console.log('\n📧 Test credentials:');
    console.log('Parent: parent@sidra.com / parent123');
    console.log('Teacher: teacher@sidra.com / teacher123');
}

main()
    .catch(e => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
