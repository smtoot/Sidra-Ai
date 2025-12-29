/**
 * ARABIC SUPPORT TICKETS SEED
 * Creates support tickets with Arabic content for proper RTL testing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🌟 إضافة تذاكر الدعم الفني بالعربية...\n');

  const now = new Date();

  // Get existing users
  const parent = await prisma.user.findFirst({ where: { email: 'parent@sidra.com' } });
  const teacher = await prisma.user.findFirst({ where: { email: 'teacher@sidra.com' } });
  const admin = await prisma.user.findFirst({ where: { email: 'admin@sidra.com' } });

  if (!parent || !teacher || !admin) {
    console.log('⚠️  المستخدمين غير موجودين. قم بتشغيل seed الرئيسي أولاً.');
    return;
  }

  // Delete existing tickets
  console.log('🧹 حذف التذاكر القديمة...');
  await prisma.ticketAccessControl.deleteMany();
  await prisma.ticketStatusHistory.deleteMany();
  await prisma.ticketMessage.deleteMany();
  await prisma.supportTicket.deleteMany();

  console.log('✅ تم حذف التذاكر القديمة\n');

  // Ticket 1: Parent - Technical Issue (OPEN)
  console.log('📝 إنشاء تذكرة 1: مشكلة تقنية...');
  const ticket1 = await prisma.supportTicket.create({
    data: {
      readableId: 'TKT-2512-0001',
      createdByUserId: parent.id,
      category: 'TECHNICAL',
      type: 'SUPPORT',
      priority: 'HIGH',
      status: 'OPEN',
      subject: 'لا أستطيع رفع صورة الملف الشخصي',
      description: 'أحاول رفع صورة لملف ابنتي الشخصي لكن أحصل على رسالة خطأ. الملف بصيغة JPG وحجمه أقل من 5 ميجابايت. أرجو المساعدة.',
      evidence: ['https://example.com/error-screenshot.png'],
      escalationLevel: 'L1',
      slaDeadline: new Date(now.getTime() + 12 * 60 * 60 * 1000),
      slaBreach: false,
      lastActivityAt: now,
    },
  });

  await prisma.ticketStatusHistory.create({
    data: {
      ticketId: ticket1.id,
      fromStatus: null,
      toStatus: 'OPEN',
      changedByUserId: parent.id,
    },
  });

  await prisma.ticketMessage.create({
    data: {
      ticketId: ticket1.id,
      authorId: parent.id,
      content: 'المشكلة مستمرة منذ يومين. أحتاج لتحديث الملف قبل الجلسة القادمة.',
      attachments: [],
      isInternal: false,
      isSystemGenerated: false,
    },
  });

  // Ticket 2: Teacher - Financial Issue (IN_PROGRESS, SLA BREACHED)
  console.log('📝 إنشاء تذكرة 2: مشكلة مالية (تجاوز SLA)...');
  const ticket2 = await prisma.supportTicket.create({
    data: {
      readableId: 'TKT-2512-0002',
      createdByUserId: teacher.id,
      assignedToId: admin.id,
      category: 'FINANCIAL',
      type: 'SUPPORT',
      priority: 'CRITICAL',
      status: 'IN_PROGRESS',
      subject: 'طلب السحب لم يتم معالجته',
      description: 'قدمت طلب سحب منذ 5 أيام بمبلغ 20,000 جنيه سوداني ولكنه لا يزال معلقاً. أحتاج المبلغ بشكل عاجل لدفع الإيجار.',
      evidence: ['https://example.com/withdrawal-screenshot.png'],
      escalationLevel: 'L2',
      slaDeadline: new Date(now.getTime() - 2 * 60 * 60 * 1000), // SLA BREACHED
      slaBreach: true,
      lastActivityAt: new Date(now.getTime() - 30 * 60 * 1000),
    },
  });

  await prisma.ticketStatusHistory.createMany({
    data: [
      {
        ticketId: ticket2.id,
        fromStatus: null,
        toStatus: 'OPEN',
        changedByUserId: teacher.id,
      },
      {
        ticketId: ticket2.id,
        fromStatus: 'OPEN',
        toStatus: 'IN_PROGRESS',
        changedByUserId: admin.id,
        reason: 'تم التعيين للمسؤول للتحقيق',
      },
    ],
  });

  await prisma.ticketMessage.createMany({
    data: [
      {
        ticketId: ticket2.id,
        authorId: teacher.id,
        content: 'بيانات حسابي البنكي صحيحة. رقم الحساب: 123456789، البنك: بنك الخرطوم',
        attachments: [],
        isInternal: false,
        isSystemGenerated: false,
      },
      {
        ticketId: ticket2.id,
        authorId: admin.id,
        content: 'ملاحظة داخلية: جاري التحقق مع فريق المالية. يبدو أن السحب عالق في قائمة الانتظار.',
        attachments: [],
        isInternal: true,
        isSystemGenerated: false,
      },
      {
        ticketId: ticket2.id,
        authorId: admin.id,
        content: 'شكراً لإبلاغك عن هذه المشكلة. أقوم الآن بالتحقيق مع فريق المالية وسأعطيك تحديثاً خلال الساعة القادمة.',
        attachments: [],
        isInternal: false,
        isSystemGenerated: false,
      },
    ],
  });

  // Ticket 3: Parent - Session Issue (WAITING_FOR_CUSTOMER)
  console.log('📝 إنشاء تذكرة 3: مشكلة في الحصة...');
  const ticket3 = await prisma.supportTicket.create({
    data: {
      readableId: 'TKT-2512-0003',
      createdByUserId: parent.id,
      assignedToId: admin.id,
      category: 'SESSION',
      type: 'SUPPORT',
      priority: 'NORMAL',
      status: 'WAITING_FOR_CUSTOMER',
      subject: 'المعلم لم يحضر للحصة المجدولة',
      description: 'كان من المفترض أن ينضم المعلم للحصة في الساعة 4:00 مساءً ولكنه لم يظهر. انتظرت ابنتي لمدة 20 دقيقة.',
      evidence: [],
      escalationLevel: 'L1',
      slaDeadline: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      slaBreach: false,
      lastActivityAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
  });

  await prisma.ticketStatusHistory.createMany({
    data: [
      {
        ticketId: ticket3.id,
        fromStatus: null,
        toStatus: 'OPEN',
        changedByUserId: parent.id,
      },
      {
        ticketId: ticket3.id,
        fromStatus: 'OPEN',
        toStatus: 'IN_PROGRESS',
        changedByUserId: admin.id,
      },
      {
        ticketId: ticket3.id,
        fromStatus: 'IN_PROGRESS',
        toStatus: 'WAITING_FOR_CUSTOMER',
        changedByUserId: admin.id,
        reason: 'طلب معلومات إضافية',
      },
    ],
  });

  await prisma.ticketMessage.create({
    data: {
      ticketId: ticket3.id,
      authorId: admin.id,
      content: 'شكراً لإبلاغك. هل يمكنك تزويدنا برقم الحجز حتى نتمكن من التحقيق؟ يمكنك العثور عليه في صفحة حجوزاتك.',
      attachments: [],
      isInternal: false,
      isSystemGenerated: false,
    },
  });

  // Ticket 4: Teacher - Academic (RESOLVED)
  console.log('📝 إنشاء تذكرة 4: استفسار أكاديمي (محلولة)...');
  const ticket4 = await prisma.supportTicket.create({
    data: {
      readableId: 'TKT-2512-0004',
      createdByUserId: teacher.id,
      assignedToId: admin.id,
      category: 'ACADEMIC',
      type: 'SUPPORT',
      priority: 'LOW',
      status: 'RESOLVED',
      subject: 'كيف أحدث مواد التدريس الخاصة بي؟',
      description: 'أريد إضافة مادة الفيزياء لمواد التدريس ولكن لا أجد الخيار في إعدادات الملف الشخصي.',
      evidence: [],
      escalationLevel: 'L1',
      slaDeadline: new Date(now.getTime() + 72 * 60 * 60 * 1000),
      slaBreach: false,
      lastActivityAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      resolvedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      resolvedByUserId: admin.id,
      resolutionNote: 'تم توجيه المعلم خلال عملية إضافة المادة في إعدادات الملف الشخصي > قسم مواد التدريس. تمت إضافة الفيزياء بنجاح.',
    },
  });

  await prisma.ticketStatusHistory.createMany({
    data: [
      {
        ticketId: ticket4.id,
        fromStatus: null,
        toStatus: 'OPEN',
        changedByUserId: teacher.id,
      },
      {
        ticketId: ticket4.id,
        fromStatus: 'OPEN',
        toStatus: 'IN_PROGRESS',
        changedByUserId: admin.id,
      },
      {
        ticketId: ticket4.id,
        fromStatus: 'IN_PROGRESS',
        toStatus: 'RESOLVED',
        changedByUserId: admin.id,
        reason: 'تم حل المشكلة',
      },
    ],
  });

  await prisma.ticketMessage.createMany({
    data: [
      {
        ticketId: ticket4.id,
        authorId: admin.id,
        content: 'اذهب إلى إعدادات الملف الشخصي، ثم انقر على "مواد التدريس". سترى زر "إضافة مادة". انقر عليه واختر الفيزياء من القائمة المنسدلة.',
        attachments: ['https://example.com/guide-screenshot.png'],
        isInternal: false,
        isSystemGenerated: false,
      },
      {
        ticketId: ticket4.id,
        authorId: teacher.id,
        content: 'ممتاز! وجدته. شكراً جزيلاً على المساعدة السريعة!',
        attachments: [],
        isInternal: false,
        isSystemGenerated: false,
      },
    ],
  });

  // Ticket 5: Parent - General (CLOSED)
  console.log('📝 إنشاء تذكرة 5: استفسار عام (مغلقة)...');
  const ticket5 = await prisma.supportTicket.create({
    data: {
      readableId: 'TKT-2512-0005',
      createdByUserId: parent.id,
      category: 'GENERAL',
      type: 'SUPPORT',
      priority: 'LOW',
      status: 'CLOSED',
      subject: 'كيف ألغي حجزاً؟',
      description: 'أحتاج معرفة سياسة الإلغاء وكيفية إلغاء حصة قادمة.',
      evidence: [],
      escalationLevel: 'L1',
      slaDeadline: new Date(now.getTime() + 72 * 60 * 60 * 1000),
      slaBreach: false,
      lastActivityAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      resolvedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      closedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      resolvedByUserId: admin.id,
      resolutionNote: 'تم تزويد المستخدم بمعلومات سياسة الإلغاء. أكد المستخدم الرضا.',
    },
  });

  await prisma.ticketStatusHistory.createMany({
    data: [
      {
        ticketId: ticket5.id,
        fromStatus: null,
        toStatus: 'OPEN',
        changedByUserId: parent.id,
      },
      {
        ticketId: ticket5.id,
        fromStatus: 'OPEN',
        toStatus: 'RESOLVED',
        changedByUserId: admin.id,
      },
      {
        ticketId: ticket5.id,
        fromStatus: 'RESOLVED',
        toStatus: 'CLOSED',
        changedByUserId: parent.id,
      },
    ],
  });

  console.log('\n✅ تم إنشاء 5 تذاكر دعم فني بالعربية:');
  console.log('   - TKT-2512-0001: تقنية (مفتوحة)');
  console.log('   - TKT-2512-0002: مالية (قيد المعالجة، تجاوز SLA)');
  console.log('   - TKT-2512-0003: حصة (بانتظار العميل)');
  console.log('   - TKT-2512-0004: أكاديمية (محلولة)');
  console.log('   - TKT-2512-0005: عامة (مغلقة)\n');

  console.log('✨ اكتمل إنشاء التذاكر بالعربية!\n');
}

main()
  .catch((e) => {
    console.error('❌ خطأ في إنشاء التذاكر:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
