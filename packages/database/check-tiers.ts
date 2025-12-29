import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTiers() {
  const tiers = await prisma.packageTier.findMany({
    orderBy: { displayOrder: 'asc' }
  });

  console.log('\n📦 Package Tiers in Database:\n');
  tiers.forEach(tier => {
    const recurringCount = Math.round(tier.sessionCount * tier.recurringRatio.toNumber());
    const floatingCount = tier.sessionCount - recurringCount;

    const star = tier.isFeatured ? '⭐ ' : '   ';
    console.log(`${star}${tier.sessionCount} sessions - ${tier.discountPercent}% discount`);
    console.log(`   ${tier.nameAr} / ${tier.nameEn}`);
    console.log(`   ${recurringCount} recurring + ${floatingCount} floating, ${tier.durationWeeks} weeks`);
    console.log('');
  });

  await prisma.$disconnect();
}

checkTiers();
