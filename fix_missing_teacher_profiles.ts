import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixMissingTeacherProfiles() {
    console.log('🔍 Checking for teachers without profiles...');

    // Find all teacher users without profiles
    const teachersWithoutProfiles = await prisma.users.findMany({
        where: {
            role: 'TEACHER',
            teacher_profiles: null,
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
        },
    });

    console.log(`Found ${teachersWithoutProfiles.length} teachers without profiles`);

    if (teachersWithoutProfiles.length === 0) {
        console.log('✅ All teachers already have profiles!');
        return;
    }

    // Create profiles for each teacher
    for (const teacher of teachersWithoutProfiles) {
        console.log(`Creating profile for ${teacher.email}...`);

        await prisma.teacher_profiles.create({
            data: {
                id: crypto.randomUUID(),
                userId: teacher.id,
                applicationStatus: 'DRAFT',
                hasCompletedOnboarding: false,
                onboardingStep: 0,
                averageRating: 5.0,
                totalReviews: 0,
            },
        });

        console.log(`✅ Created profile for ${teacher.email}`);
    }

    console.log('\n🎉 All done! Verifying...\n');

    // Verify
    const allTeachers = await prisma.users.findMany({
        where: { role: 'TEACHER' },
        include: {
            teacher_profiles: {
                select: {
                    id: true,
                    applicationStatus: true,
                },
            },
        },
    });

    console.log('All teachers:');
    allTeachers.forEach((t) => {
        const status = t.teacher_profiles
            ? `✅ Has profile (${t.teacher_profiles.applicationStatus})`
            : '❌ Missing profile';
        console.log(`  ${t.email}: ${status}`);
    });

    await prisma.$disconnect();
}

fixMissingTeacherProfiles()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    });
