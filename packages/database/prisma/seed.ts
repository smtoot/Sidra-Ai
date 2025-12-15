import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { prisma } from '../index'; // Import shared instance

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function main() {
    console.log('Seeding database...');

    // 1. Create Admin
    const adminEmail = 'admin@sidra.com';
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await prisma.user.create({
            data: {
                email: adminEmail,
                passwordHash: hashedPassword,
                role: UserRole.ADMIN,
                isVerified: true,
            },
        });
        console.log('Admin user created');
    } else {
        console.log('Admin user already exists');
    }

    // 2. Create Initial Curricula (Sudanese)
    const curricula = [
        { nameAr: 'المنهج السوداني', nameEn: 'Sudanese Curriculum' },
        { nameAr: 'كامبريدج', nameEn: 'Cambridge (IGCSE)' },
    ];

    for (const c of curricula) {
        const exists = await prisma.curriculum.findFirst({ where: { nameEn: c.nameEn } });
        if (!exists) {
            await prisma.curriculum.create({ data: c });
            console.log(`Created curriculum: ${c.nameEn}`);
        }
    }

    // 3. Create Initial Subjects
    const subjects = [
        { nameAr: 'الرياضيات', nameEn: 'Mathematics' },
        { nameAr: 'الفيزياء', nameEn: 'Physics' },
        { nameAr: 'اللغة العربية', nameEn: 'Arabic Language' },
        { nameAr: 'اللغة الإنجليزية', nameEn: 'English Language' },
    ];

    for (const s of subjects) {
        const exists = await prisma.subject.findFirst({ where: { nameEn: s.nameEn } });
        if (!exists) {
            await prisma.subject.create({ data: s });
            console.log(`Created subject: ${s.nameEn}`);
        }
    }
    // 4. Create Parent with Children
    const parentEmail = 'parent@sidra.com';
    const parent = await prisma.user.findUnique({ where: { email: parentEmail } });

    if (!parent) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        await prisma.user.create({
            data: {
                email: parentEmail,
                passwordHash: hashedPassword,
                role: UserRole.PARENT,
                isVerified: true,
                wallet: { create: { balance: 1000 } },
                parentProfile: {
                    create: {
                        children: {
                            create: [
                                { name: 'Ali (Child)', gradeLevel: 'Alpha 1' },
                                { name: 'Sara (Child)', gradeLevel: 'Beta 2' }
                            ]
                        }
                    }
                }
            },
        });
        console.log('Parent user created with 2 children');
    }

    // 5. Create Independent Student
    const studentEmail = 'student@sidra.com';
    const student = await prisma.user.findUnique({ where: { email: studentEmail } });

    if (!student) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        await prisma.user.create({
            data: {
                email: studentEmail,
                passwordHash: hashedPassword,
                role: UserRole.STUDENT,
                isVerified: true,
                wallet: { create: { balance: 500 } },
                studentProfile: {
                    create: {
                        gradeLevel: 'University Year 1',
                        bio: 'Computer Science Student'
                    }
                }
            },
        });
        console.log('Student user created');
    }

    console.log('Seeding completed.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
