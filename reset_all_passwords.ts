import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// The new password for all accounts
const NEW_PASSWORD = 'password123';

async function resetAllPasswords() {
    console.log('🔐 Password Reset Script for Local Development\n');
    console.log(`New password for all accounts: ${NEW_PASSWORD}\n`);

    // Get all users
    const users = await prisma.users.findMany({
        select: {
            id: true,
            phoneNumber: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isVerified: true,
            teacher_profiles: {
                select: {
                    displayName: true,
                    applicationStatus: true,
                },
            },
            student_profiles: {
                select: {
                    id: true,
                },
            },
            parent_profiles: {
                select: {
                    id: true,
                },
            },
        },
        orderBy: {
            role: 'asc',
        },
    });

    console.log(`Found ${users.length} users in the database:\n`);
    console.log('='.repeat(100));
    console.log('PHONE NUMBER'.padEnd(20) + 'EMAIL'.padEnd(30) + 'NAME'.padEnd(25) + 'ROLE'.padEnd(15) + 'STATUS');
    console.log('='.repeat(100));

    for (const user of users) {
        const name = [user.firstName, user.lastName].filter(Boolean).join(' ') ||
            user.teacher_profiles?.displayName ||
            'N/A';
        const phone = user.phoneNumber || 'N/A';
        const email = user.email || 'N/A';
        const status = user.isVerified ? '✅ Verified' : '⏳ Pending';

        console.log(
            phone.padEnd(20) +
            email.padEnd(30) +
            name.padEnd(25) +
            user.role.padEnd(15) +
            status
        );
    }

    console.log('='.repeat(100));
    console.log(`\n🔄 Resetting passwords for all ${users.length} users...\n`);

    // Hash the new password
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);

    // Update all users
    const result = await prisma.users.updateMany({
        data: {
            passwordHash: hashedPassword,
        },
    });

    console.log(`✅ Successfully updated ${result.count} user passwords!\n`);
    console.log('━'.repeat(100));
    console.log('📋 LOGIN CREDENTIALS FOR TESTING:');
    console.log('━'.repeat(100));
    console.log(`Password for ALL accounts: ${NEW_PASSWORD}\n`);

    console.log('You can now log in with any of the phone numbers listed above.\n');
    console.log('Example logins:');
    users.slice(0, 3).forEach((user) => {
        if (user.phoneNumber) {
            console.log(`  📱 ${user.phoneNumber} (${user.role})`);
        }
    });
    console.log('━'.repeat(100));

    await prisma.$disconnect();
}

resetAllPasswords()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    });
