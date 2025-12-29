import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed default Smart Pack tiers
 *
 * Tiers:
 * - 5 sessions: 5% discount
 * - 10 sessions: 8% discount
 * - 12 sessions: 10% discount (Featured/Most Popular)
 * - 15 sessions: 15% discount
 */
async function seedPackageTiers() {
  console.log('🌱 Seeding package tiers...');

  const tiers: Prisma.PackageTierCreateInput[] = [
    {
      sessionCount: 5,
      discountPercent: new Prisma.Decimal(5),
      recurringRatio: new Prisma.Decimal(0.8), // 4 recurring, 1 floating
      floatingRatio: new Prisma.Decimal(0.2),
      rescheduleLimit: 2,
      durationWeeks: 4,
      gracePeriodDays: 14,
      nameAr: 'باقة المبتدئين',
      nameEn: 'Starter Pack',
      descriptionAr: 'مثالية للتجربة - 4 جلسات محجوزة تلقائياً + 1 جلسة مرنة',
      descriptionEn: 'Perfect for trying out - 4 auto-booked + 1 floating session',
      isActive: true,
      isFeatured: false,
      badge: null,
      displayOrder: 1,
    },
    {
      sessionCount: 10,
      discountPercent: new Prisma.Decimal(8),
      recurringRatio: new Prisma.Decimal(0.8), // 8 recurring, 2 floating
      floatingRatio: new Prisma.Decimal(0.2),
      rescheduleLimit: 2,
      durationWeeks: 6,
      gracePeriodDays: 14,
      nameAr: 'الباقة القياسية',
      nameEn: 'Standard Pack',
      descriptionAr: 'الأفضل مبيعاً - 8 جلسات محجوزة تلقائياً + 2 جلسة مرنة',
      descriptionEn: 'Best seller - 8 auto-booked + 2 floating sessions',
      isActive: true,
      isFeatured: false,
      badge: null,
      displayOrder: 2,
    },
    {
      sessionCount: 12,
      discountPercent: new Prisma.Decimal(10),
      recurringRatio: new Prisma.Decimal(0.83), // 10 recurring, 2 floating (rounded)
      floatingRatio: new Prisma.Decimal(0.17),
      rescheduleLimit: 2,
      durationWeeks: 7,
      gracePeriodDays: 14,
      nameAr: 'الباقة الذكية',
      nameEn: 'Smart Pack',
      descriptionAr: 'الأكثر شعبية - 10 جلسات محجوزة تلقائياً + 2 جلسة مرنة',
      descriptionEn: 'Most popular - 10 auto-booked + 2 floating sessions',
      isActive: true,
      isFeatured: true, // Featured badge
      badge: 'RECOMMENDED',
      displayOrder: 3,
    },
    {
      sessionCount: 15,
      discountPercent: new Prisma.Decimal(15),
      recurringRatio: new Prisma.Decimal(0.8), // 12 recurring, 3 floating
      floatingRatio: new Prisma.Decimal(0.2),
      rescheduleLimit: 2,
      durationWeeks: 9,
      gracePeriodDays: 14,
      nameAr: 'باقة المتميزين',
      nameEn: 'Premium Pack',
      descriptionAr: 'أفضل قيمة - 12 جلسة محجوزة تلقائياً + 3 جلسات مرنة',
      descriptionEn: 'Best value - 12 auto-booked + 3 floating sessions',
      isActive: true,
      isFeatured: false,
      badge: 'BEST_VALUE',
      displayOrder: 4,
    },
  ];

  for (const tierData of tiers) {
    const recurringCount = Math.round(tierData.sessionCount * tierData.recurringRatio.toNumber());
    const floatingCount = tierData.sessionCount - recurringCount;

    console.log(
      `  Creating: ${tierData.sessionCount} sessions (${recurringCount} recurring + ${floatingCount} floating) - ${tierData.discountPercent}% discount`
    );

    await prisma.packageTier.upsert({
      where: {
        // Use sessionCount as unique identifier for upsert
        id: `tier-${tierData.sessionCount}-sessions`,
      },
      update: tierData,
      create: {
        ...tierData,
        id: `tier-${tierData.sessionCount}-sessions`,
      },
    });
  }

  console.log('✅ Package tiers seeded successfully!');
}

async function main() {
  try {
    await seedPackageTiers();
  } catch (error) {
    console.error('❌ Error seeding package tiers:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
