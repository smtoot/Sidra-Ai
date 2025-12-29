/**
 * COMPREHENSIVE DEMO SEED SCRIPT
 * Creates complete demo data for all platform features
 * Includes: Users, Bookings, Packages, Wallets, Support Tickets, Disputes
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Demo Password for ALL users: "Demo2024!"
const DEMO_PASSWORD = 'Demo2024!';

async function main() {
  console.log('\n🌟 ========================================');
  console.log('   COMPREHENSIVE DEMO DATA SEEDING');
  console.log('========================================\n');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const now = new Date();

  // Get existing curriculum and grades
  const curriculum = await prisma.curriculum.findFirst();
  const math = await prisma.subject.findFirst({ where: { nameEn: 'Mathematics' } });
  const english = await prisma.subject.findFirst({ where: { nameEn: 'English' } });
  const science = await prisma.subject.findFirst({ where: { nameEn: 'Science' } });
  const grade8 = await prisma.gradeLevel.findFirst({ where: { code: 'INT-8' } });
  const grade10 = await prisma.gradeLevel.findFirst({ where: { code: 'SEC-10' } });

  if (!curriculum || !math || !grade8) {
    console.log('⚠️  Please run the main seed first: npm run seed');
    return;
  }

  // ============================================
  // SUPPORT TICKETS - Add to existing users
  // ============================================
  console.log('🎫 Adding Support Tickets to existing demo data...\n');

  const existingParent = await prisma.user.findFirst({ where: { email: 'parent@sidra.com' } });
  const existingTeacher = await prisma.user.findFirst({ where: { email: 'teacher@sidra.com' } });
  const existingAdmin = await prisma.user.findFirst({ where: { email: 'admin@sidra.com' } });

  if (!existingParent || !existingTeacher || !existingAdmin) {
    console.log('⚠️  Main demo users not found. Run main seed first.');
    return;
  }

  // Delete existing support tickets
  await prisma.ticketAccessControl.deleteMany();
  await prisma.ticketStatusHistory.deleteMany();
  await prisma.ticketMessage.deleteMany();
  await prisma.supportTicket.deleteMany();

  // Ticket 1: Parent - Technical Issue (OPEN)
  const ticket1 = await prisma.supportTicket.create({
    data: {
      readableId: 'TKT-2512-0001',
      createdByUserId: existingParent.id,
      category: 'TECHNICAL',
      type: 'SUPPORT',
      priority: 'HIGH',
      status: 'OPEN',
      subject: 'Cannot upload profile picture',
      description: 'I am trying to upload my child\'s profile picture but I keep getting an error message. The file is a JPG and under 5MB. Please help.',
      evidence: ['https://example.com/error-screenshot.png'],
      escalationLevel: 'L1',
      slaDeadline: new Date(now.getTime() + 12 * 60 * 60 * 1000), // 12 hours
      slaBreach: false,
      lastActivityAt: now,
    },
  });

  await prisma.ticketStatusHistory.create({
    data: {
      ticketId: ticket1.id,
      fromStatus: null,
      toStatus: 'OPEN',
      changedByUserId: existingParent.id,
    },
  });

  await prisma.ticketMessage.create({
    data: {
      ticketId: ticket1.id,
      authorId: existingParent.id,
      content: 'This has been happening for the past 2 days. I really need to update the profile before the next session.',
      attachments: [],
      isInternal: false,
      isSystemGenerated: false,
    },
  });

  // Ticket 2: Teacher - Financial Issue (IN_PROGRESS, ASSIGNED)
  const ticket2 = await prisma.supportTicket.create({
    data: {
      readableId: 'TKT-2512-0002',
      createdByUserId: existingTeacher.id,
      assignedToId: existingAdmin.id,
      category: 'FINANCIAL',
      type: 'SUPPORT',
      priority: 'CRITICAL',
      status: 'IN_PROGRESS',
      subject: 'Withdrawal request not processed',
      description: 'I submitted a withdrawal request 5 days ago for 20,000 SDG but it is still showing as pending. I need this urgently for rent payment.',
      evidence: ['https://example.com/withdrawal-screenshot.png'],
      escalationLevel: 'L2',
      slaDeadline: new Date(now.getTime() - 2 * 60 * 60 * 1000), // SLA BREACHED (2 hours ago)
      slaBreach: true,
      lastActivityAt: new Date(now.getTime() - 30 * 60 * 1000), // 30 min ago
    },
  });

  await prisma.ticketStatusHistory.createMany({
    data: [
      {
        ticketId: ticket2.id,
        fromStatus: null,
        toStatus: 'OPEN',
        changedByUserId: existingTeacher.id,
      },
      {
        ticketId: ticket2.id,
        fromStatus: 'OPEN',
        toStatus: 'IN_PROGRESS',
        changedByUserId: existingAdmin.id,
        reason: 'Assigned to admin for investigation',
      },
    ],
  });

  await prisma.ticketMessage.createMany({
    data: [
      {
        ticketId: ticket2.id,
        authorId: existingTeacher.id,
        content: 'My bank details are correct. Account Number: 123456789, Bank: Bank of Khartoum',
        attachments: [],
        isInternal: false,
        isSystemGenerated: false,
      },
      {
        ticketId: ticket2.id,
        authorId: existingAdmin.id,
        content: 'Internal note: Checking with finance team. Withdrawal appears stuck in pending queue.',
        attachments: [],
        isInternal: true,
        isSystemGenerated: false,
      },
      {
        ticketId: ticket2.id,
        authorId: existingAdmin.id,
        content: 'Thank you for reporting this. I am investigating with our finance team and will update you within the next hour.',
        attachments: [],
        isInternal: false,
        isSystemGenerated: false,
      },
    ],
  });

  // Ticket 3: Parent - Session Issue (WAITING_FOR_CUSTOMER)
  const ticket3 = await prisma.supportTicket.create({
    data: {
      readableId: 'TKT-2512-0003',
      createdByUserId: existingParent.id,
      assignedToId: existingAdmin.id,
      category: 'SESSION',
      type: 'SUPPORT',
      priority: 'NORMAL',
      status: 'WAITING_FOR_CUSTOMER',
      subject: 'Teacher did not show up for scheduled session',
      description: 'The teacher was supposed to join the session at 4:00 PM but never showed up. My child waited for 20 minutes.',
      evidence: [],
      escalationLevel: 'L1',
      slaDeadline: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours
      slaBreach: false,
      lastActivityAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
  });

  await prisma.ticketStatusHistory.createMany({
    data: [
      {
        ticketId: ticket3.id,
        fromStatus: null,
        toStatus: 'OPEN',
        changedByUserId: existingParent.id,
      },
      {
        ticketId: ticket3.id,
        fromStatus: 'OPEN',
        toStatus: 'IN_PROGRESS',
        changedByUserId: existingAdmin.id,
      },
      {
        ticketId: ticket3.id,
        fromStatus: 'IN_PROGRESS',
        toStatus: 'WAITING_FOR_CUSTOMER',
        changedByUserId: existingAdmin.id,
        reason: 'Requested additional information',
      },
    ],
  });

  await prisma.ticketMessage.createMany({
    data: [
      {
        ticketId: ticket3.id,
        authorId: existingAdmin.id,
        content: 'Thank you for reporting this. Could you please provide the booking ID so I can investigate? You can find it in your bookings page.',
        attachments: [],
        isInternal: false,
        isSystemGenerated: false,
      },
    ],
  });

  // Ticket 4: Teacher - Resolved
  const ticket4 = await prisma.supportTicket.create({
    data: {
      readableId: 'TKT-2512-0004',
      createdByUserId: existingTeacher.id,
      assignedToId: existingAdmin.id,
      category: 'ACADEMIC',
      type: 'SUPPORT',
      priority: 'LOW',
      status: 'RESOLVED',
      subject: 'How to update my teaching subjects?',
      description: 'I want to add Physics to my teaching subjects but I cannot find the option in my profile settings.',
      evidence: [],
      escalationLevel: 'L1',
      slaDeadline: new Date(now.getTime() + 72 * 60 * 60 * 1000), // 72 hours
      slaBreach: false,
      lastActivityAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      resolvedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      resolvedByUserId: existingAdmin.id,
      resolutionNote: 'Guided teacher through the subject addition process in Profile Settings > Teaching Subjects section. Teacher successfully added Physics.',
    },
  });

  await prisma.ticketStatusHistory.createMany({
    data: [
      {
        ticketId: ticket4.id,
        fromStatus: null,
        toStatus: 'OPEN',
        changedByUserId: existingTeacher.id,
      },
      {
        ticketId: ticket4.id,
        fromStatus: 'OPEN',
        toStatus: 'IN_PROGRESS',
        changedByUserId: existingAdmin.id,
      },
      {
        ticketId: ticket4.id,
        fromStatus: 'IN_PROGRESS',
        toStatus: 'RESOLVED',
        changedByUserId: existingAdmin.id,
        reason: 'Issue resolved',
      },
    ],
  });

  await prisma.ticketMessage.createMany({
    data: [
      {
        ticketId: ticket4.id,
        authorId: existingAdmin.id,
        content: 'Go to your Profile Settings, then click on "Teaching Subjects". You will see an "Add Subject" button. Click it and select Physics from the dropdown.',
        attachments: ['https://example.com/guide-screenshot.png'],
        isInternal: false,
        isSystemGenerated: false,
      },
      {
        ticketId: ticket4.id,
        authorId: existingTeacher.id,
        content: 'Perfect! I found it. Thank you so much for the quick help!',
        attachments: [],
        isInternal: false,
        isSystemGenerated: false,
      },
    ],
  });

  // Ticket 5: Parent - Closed
  const ticket5 = await prisma.supportTicket.create({
    data: {
      readableId: 'TKT-2512-0005',
      createdByUserId: existingParent.id,
      category: 'GENERAL',
      type: 'SUPPORT',
      priority: 'LOW',
      status: 'CLOSED',
      subject: 'How do I cancel a booking?',
      description: 'I need to know the cancellation policy and how to cancel an upcoming session.',
      evidence: [],
      escalationLevel: 'L1',
      slaDeadline: new Date(now.getTime() + 72 * 60 * 60 * 1000),
      slaBreach: false,
      lastActivityAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      resolvedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      closedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      resolvedByUserId: existingAdmin.id,
      resolutionNote: 'Provided cancellation policy information. User confirmed satisfaction.',
    },
  });

  await prisma.ticketStatusHistory.createMany({
    data: [
      {
        ticketId: ticket5.id,
        fromStatus: null,
        toStatus: 'OPEN',
        changedByUserId: existingParent.id,
      },
      {
        ticketId: ticket5.id,
        fromStatus: 'OPEN',
        toStatus: 'RESOLVED',
        changedByUserId: existingAdmin.id,
      },
      {
        ticketId: ticket5.id,
        fromStatus: 'RESOLVED',
        toStatus: 'CLOSED',
        changedByUserId: existingParent.id,
      },
    ],
  });

  console.log('✅ Created 5 demo support tickets:');
  console.log('   - TKT-2512-0001: Technical (OPEN)');
  console.log('   - TKT-2512-0002: Financial (IN_PROGRESS, SLA BREACHED)');
  console.log('   - TKT-2512-0003: Session (WAITING_FOR_CUSTOMER)');
  console.log('   - TKT-2512-0004: Academic (RESOLVED)');
  console.log('   - TKT-2512-0005: General (CLOSED)\n');

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n📊 ========================================');
  console.log('   DEMO DATA SUMMARY');
  console.log('========================================\n');

  const counts = {
    users: await prisma.user.count(),
    teachers: await prisma.teacherProfile.count(),
    parents: await prisma.parentProfile.count(),
    students: await prisma.studentProfile.count(),
    bookings: await prisma.booking.count(),
    packages: await prisma.studentPackage.count(),
    tickets: await prisma.supportTicket.count(),
    disputes: await prisma.dispute.count(),
  };

  console.log('👥 Users:');
  console.log(`   Total: ${counts.users}`);
  console.log(`   Teachers: ${counts.teachers}`);
  console.log(`   Parents: ${counts.parents}`);
  console.log(`   Students: ${counts.students}\n`);

  console.log('📅 Platform Data:');
  console.log(`   Bookings: ${counts.bookings}`);
  console.log(`   Packages: ${counts.packages}`);
  console.log(`   Support Tickets: ${counts.tickets}`);
  console.log(`   Disputes: ${counts.disputes}\n`);

  console.log('🔐 ========================================');
  console.log('   DEMO CREDENTIALS');
  console.log('========================================\n');

  console.log('📧 Email Login:\n');
  console.log('   ADMIN:');
  console.log('   Email: admin@sidra.com');
  console.log(`   Password: ${DEMO_PASSWORD}\n`);

  console.log('   TEACHER:');
  console.log('   Email: teacher@sidra.com');
  console.log(`   Password: ${DEMO_PASSWORD}\n`);

  console.log('   PARENT:');
  console.log('   Email: parent@sidra.com');
  console.log(`   Password: ${DEMO_PASSWORD}\n`);

  console.log('   STUDENT:');
  console.log('   Email: student@sidra.com');
  console.log(`   Password: ${DEMO_PASSWORD}\n`);

  console.log('📱 Phone Login:\n');
  console.log('   ADMIN: +966599999999');
  console.log('   TEACHER: +966500000002');
  console.log('   PARENT: +966500000004');
  console.log('   STUDENT: +966500000006');
  console.log(`   Password (all): ${DEMO_PASSWORD}\n`);

  console.log('✨ ========================================');
  console.log('   SEEDING COMPLETE!');
  console.log('========================================\n');

  console.log('🚀 Next Steps:');
  console.log('   1. Start the API: npm run dev (in apps/api)');
  console.log('   2. Start the Web: npm run dev (in apps/web)');
  console.log('   3. Login with any credential above');
  console.log('   4. Explore all features!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
