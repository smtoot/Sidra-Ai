import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const TEST_PASSWORD = 'test1234';

async function createTestAccounts() {
    console.log('🏗️  Creating Test Accounts for All Roles\n');

    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);

    const testAccounts = [
        {
            role: 'STUDENT',
            phoneNumber: '+249912000001',
            email: 'student@test.com',
            firstName: 'Test',
            lastName: 'Student',
        },
        {
            role: 'PARENT',
            phoneNumber: '+249912000002',
            email: 'parent@test.com',
            firstName: 'Test',
            lastName: 'Parent',
        },
        {
            role: 'ADMIN',
            phoneNumber: '+249912000003',
            email: 'admin@test.com',
            firstName: 'Test',
            lastName: 'Admin',
        },
        {
            role: 'SUPER_ADMIN',
            phoneNumber: '+249912000004',
            email: 'superadmin@test.com',
            firstName: 'Super',
            lastName: 'Admin',
        },
    ];

    for (const account of testAccounts) {
        // Check if account already exists
        const existing = await prisma.users.findUnique({
            where: { phoneNumber: account.phoneNumber },
        });

        if (existing) {
            console.log(`⏭️  Skipping ${account.role} - already exists (${account.phoneNumber})`);
            continue;
        }

        console.log(`➕ Creating ${account.role} account...`);

        const user = await prisma.users.create({
            data: {
                id: crypto.randomUUID(),
                phoneNumber: account.phoneNumber,
                email: account.email,
                firstName: account.firstName,
                lastName: account.lastName,
                role: account.role as any,
                passwordHash: hashedPassword,
                isVerified: true,
                updatedAt: new Date(),
            },
        });

        // Create role-specific profiles
        if (account.role === 'TEACHER') {
            await prisma.teacher_profiles.create({
                data: {
                    id: crypto.randomUUID(),
                    userId: user.id,
                    applicationStatus: 'DRAFT',
                    hasCompletedOnboarding: false,
                    onboardingStep: 0,
                    averageRating: 5.0,
                    totalReviews: 0,
                },
            });
            console.log(`   ✅ Created teacher profile`);
        } else if (account.role === 'STUDENT') {
            await prisma.student_profiles.create({
                data: {
                    id: crypto.randomUUID(),
                    userId: user.id,
                },
            });
            console.log(`   ✅ Created student profile`);
        } else if (account.role === 'PARENT') {
            await prisma.parent_profiles.create({
                data: {
                    id: crypto.randomUUID(),
                    userId: user.id,
                },
            });
            console.log(`   ✅ Created parent profile`);
        }

        console.log(`   ✅ ${account.role} account created successfully\n`);
    }

    // List all accounts
    const allUsers = await prisma.users.findMany({
        select: {
            phoneNumber: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isVerified: true,
        },
        orderBy: {
            role: 'asc',
        },
    });

    console.log('\n━'.repeat(100));
    console.log('📋 ALL TEST ACCOUNTS:');
    console.log('━'.repeat(100));
    console.log('PHONE NUMBER'.padEnd(25) + 'EMAIL'.padEnd(30) + 'ROLE'.padEnd(20) + 'PASSWORD');
    console.log('━'.repeat(100));

    for (const user of allUsers) {
        console.log(
            (user.phoneNumber || 'N/A').padEnd(25) +
            (user.email || 'N/A').padEnd(30) +
            user.role.padEnd(20) +
            TEST_PASSWORD
        );
    }

    console.log('━'.repeat(100));
    console.log('\n✅ All test accounts are ready!\n');

    await prisma.$disconnect();
}

createTestAccounts()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    });
