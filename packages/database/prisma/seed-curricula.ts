
import { PrismaClient, SystemType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Curricula, Stages, and Grades...');

    // ==========================================
    // 1. SUDANESE CURRICULUM
    // ==========================================
    const sudanese = await prisma.curriculum.create({
        data: {
            code: 'SUDANESE',
            nameAr: 'المنهج السوداني',
            nameEn: 'Sudanese Curriculum',
            systemType: SystemType.NATIONAL,
            stages: {
                create: [
                    {
                        nameAr: 'أساس',
                        nameEn: 'Primary (Foundation)',
                        sequence: 1,
                        grades: {
                            create: [
                                { nameAr: 'صف 1', nameEn: 'Grade 1', code: 'SUD_P1', sequence: 1 },
                                { nameAr: 'صف 2', nameEn: 'Grade 2', code: 'SUD_P2', sequence: 2 },
                                { nameAr: 'صف 3', nameEn: 'Grade 3', code: 'SUD_P3', sequence: 3 },
                                { nameAr: 'صف 4', nameEn: 'Grade 4', code: 'SUD_P4', sequence: 4 },
                                { nameAr: 'صف 5', nameEn: 'Grade 5', code: 'SUD_P5', sequence: 5 },
                                { nameAr: 'صف 6', nameEn: 'Grade 6', code: 'SUD_P6', sequence: 6 }
                            ]
                        }
                    },
                    {
                        nameAr: 'متوسط',
                        nameEn: 'Intermediate',
                        sequence: 2,
                        grades: {
                            create: [
                                { nameAr: 'أول متوسط', nameEn: '1st Intermediate', code: 'SUD_M1', sequence: 1 },
                                { nameAr: 'ثاني متوسط', nameEn: '2nd Intermediate', code: 'SUD_M2', sequence: 2 },
                                { nameAr: 'ثالث متوسط', nameEn: '3rd Intermediate', code: 'SUD_M3', sequence: 3 },
                            ]
                        }
                    },
                    {
                        nameAr: 'ثانوي',
                        nameEn: 'Secondary',
                        sequence: 3,
                        grades: {
                            create: [
                                { nameAr: 'أول ثانوي', nameEn: '1st Secondary', code: 'SUD_S1', sequence: 1 },
                                { nameAr: 'ثاني ثانوي', nameEn: '2nd Secondary', code: 'SUD_S2', sequence: 2 },
                                { nameAr: 'ثالث ثانوي', nameEn: '3rd Secondary', code: 'SUD_S3', sequence: 3 },
                            ]
                        }
                    }
                ]
            }
        }
    });
    console.log('✅ Created Sudanese Curriculum');

    // ==========================================
    // 2. BRITISH CURRICULUM
    // ==========================================
    const british = await prisma.curriculum.create({
        data: {
            code: 'BRITISH',
            nameAr: 'المنهج البريطاني',
            nameEn: 'British Curriculum',
            systemType: SystemType.INTERNATIONAL,
            stages: {
                create: [
                    {
                        nameAr: 'الابتدائية',
                        nameEn: 'Primary',
                        sequence: 1,
                        grades: {
                            create: [
                                { nameAr: 'السنة 1', nameEn: 'Year 1', code: 'Y1', sequence: 1 },
                                { nameAr: 'السنة 2', nameEn: 'Year 2', code: 'Y2', sequence: 2 },
                                { nameAr: 'السنة 3', nameEn: 'Year 3', code: 'Y3', sequence: 3 },
                                { nameAr: 'السنة 4', nameEn: 'Year 4', code: 'Y4', sequence: 4 },
                                { nameAr: 'السنة 5', nameEn: 'Year 5', code: 'Y5', sequence: 5 },
                                { nameAr: 'السنة 6', nameEn: 'Year 6', code: 'Y6', sequence: 6 },
                            ]
                        }
                    },
                    {
                        nameAr: 'المرحلة المتوسطة',
                        nameEn: 'Lower Secondary',
                        sequence: 2,
                        grades: {
                            create: [
                                { nameAr: 'السنة 7', nameEn: 'Year 7', code: 'Y7', sequence: 1 },
                                { nameAr: 'السنة 8', nameEn: 'Year 8', code: 'Y8', sequence: 2 },
                                { nameAr: 'السنة 9', nameEn: 'Year 9', code: 'Y9', sequence: 3 },
                            ]
                        }
                    },
                    {
                        nameAr: 'الشهادة الثانوية العامة (GCSE)',
                        nameEn: 'GCSE',
                        sequence: 3,
                        grades: {
                            create: [
                                { nameAr: 'السنة 10', nameEn: 'Year 10', code: 'Y10', sequence: 1 },
                                { nameAr: 'السنة 11', nameEn: 'Year 11', code: 'Y11', sequence: 2 },
                            ]
                        }
                    },
                    {
                        nameAr: 'تكميلي (A-Level)',
                        nameEn: 'A-Level',
                        sequence: 4,
                        grades: {
                            create: [
                                { nameAr: 'السنة 12', nameEn: 'Year 12', code: 'Y12', sequence: 1 },
                                { nameAr: 'السنة 13', nameEn: 'Year 13', code: 'Y13', sequence: 2 },
                            ]
                        }
                    }
                ]
            }
        }
    });
    console.log('✅ Created British Curriculum');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
