/**
 * Migration Script: Teacher Application Status
 * 
 * Purpose: Migrate existing teachers from legacy isVerified flag 
 * to new ApplicationStatus system.
 * 
 * Run with: cd packages/database && npx ts-node scripts/migrate-teacher-status.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateTeacherApplicationStatus() {
    console.log('🚀 Starting teacher application status migration...\n');

    // Get all teacher profiles
    const profiles = await prisma.teacherProfile.findMany({
        include: {
            user: {
                select: { id: true, isVerified: true }
            }
        }
    });

    console.log(`Found ${profiles.length} teacher profiles to process\n`);

    let approvedCount = 0;
    let submittedCount = 0;
    let draftCount = 0;

    for (const profile of profiles) {
        let newStatus: 'APPROVED' | 'SUBMITTED' | 'DRAFT';

        // Determine new status based on isVerified flag
        if (profile.user.isVerified) {
            newStatus = 'APPROVED';
            approvedCount++;
        } else if (profile.hasCompletedOnboarding) {
            // Completed onboarding but not verified = Submitted
            newStatus = 'SUBMITTED';
            submittedCount++;
        } else {
            // Not completed onboarding = Draft
            newStatus = 'DRAFT';
            draftCount++;
        }

        // Update the profile
        await prisma.teacherProfile.update({
            where: { id: profile.id },
            data: {
                applicationStatus: newStatus,
                reviewedAt: profile.user.isVerified ? new Date() : null,
            }
        });

        console.log(`✅ ${profile.displayName || profile.id}: ${newStatus}`);
    }

    console.log('\n--- Migration Summary ---');
    console.log(`Approved: ${approvedCount}`);
    console.log(`Submitted: ${submittedCount}`);
    console.log(`Draft: ${draftCount}`);
    console.log(`Total: ${profiles.length}`);
    console.log('\n✨ Migration complete!');
}

migrateTeacherApplicationStatus()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
