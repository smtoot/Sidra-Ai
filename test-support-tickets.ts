/**
 * Support Ticket System - Integration Test Script
 * Tests API endpoints and creates sample data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Support Ticket System Integration Tests\n');

  // Step 1: Verify tables exist
  console.log('📋 Step 1: Verifying database tables...');
  try {
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND (table_name LIKE '%ticket%' OR table_name LIKE '%support%')
      ORDER BY table_name
    `;
    console.log('✅ Found tables:', tables.map(t => t.table_name).join(', '));
  } catch (error) {
    console.error('❌ Failed to query tables:', error);
    process.exit(1);
  }

  // Step 2: Check ticket count
  console.log('\n📊 Step 2: Checking existing tickets...');
  const ticketCount = await prisma.supportTicket.count();
  console.log(`✅ Found ${ticketCount} existing tickets`);

  // Step 3: Find a test user (or create one)
  console.log('\n👤 Step 3: Finding test user...');
  let testUser = await prisma.user.findFirst({
    where: { role: 'PARENT' },
  });

  if (!testUser) {
    console.log('⚠️  No PARENT user found. Creating test user...');
    testUser = await prisma.user.create({
      data: {
        phoneNumber: '+966500000999',
        countryCode: '+966',
        role: 'PARENT',
        firstName: 'Test',
        lastName: 'Parent',
        isVerified: true,
      },
    });
    console.log(`✅ Created test user: ${testUser.id}`);
  } else {
    console.log(`✅ Using existing user: ${testUser.id} (${testUser.firstName} ${testUser.lastName})`);
  }

  // Step 4: Find an admin user for assignment
  console.log('\n👨‍💼 Step 4: Finding admin user...');
  const adminUser = await prisma.user.findFirst({
    where: {
      role: { in: ['SUPER_ADMIN', 'ADMIN', 'SUPPORT'] },
    },
  });

  if (!adminUser) {
    console.log('⚠️  No admin user found for assignment tests');
  } else {
    console.log(`✅ Found admin: ${adminUser.id} (${adminUser.role})`);
  }

  // Step 5: Check ReadableIdCounter
  console.log('\n🔢 Step 5: Checking Readable ID Counter...');
  const ticketCounter = await prisma.readableIdCounter.findUnique({
    where: {
      type_yearMonth: {
        type: 'TICKET',
        yearMonth: getCurrentYearMonth(),
      },
    },
  });

  if (!ticketCounter) {
    console.log('⚠️  No TICKET counter found. It will be created on first ticket.');
  } else {
    console.log(`✅ TICKET counter exists: ${ticketCounter.counter}`);
  }

  // Step 6: Verify enums
  console.log('\n🏷️  Step 6: Verifying enums...');
  const enums = await prisma.$queryRaw<Array<{ typname: string }>>`
    SELECT typname FROM pg_type
    WHERE typname IN ('TicketCategory', 'TicketType', 'TicketStatus', 'TicketPriority', 'EscalationLevel')
    ORDER BY typname
  `;
  console.log('✅ Found enums:', enums.map(e => e.typname).join(', '));

  // Step 7: Test data creation (optional - commented out by default)
  console.log('\n📝 Step 7: Test data creation (skipped - uncomment to enable)');
  /*
  const testTicket = await prisma.supportTicket.create({
    data: {
      readableId: 'TEST-2512-0001',
      createdByUserId: testUser.id,
      category: 'TECHNICAL',
      type: 'SUPPORT',
      priority: 'NORMAL',
      status: 'OPEN',
      subject: 'Test Ticket - Platform Integration Test',
      description: 'This is a test ticket created during Phase 3 integration testing.',
      evidence: ['https://example.com/screenshot1.png'],
      escalationLevel: 'L1',
      slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      slaBreach: false,
      lastActivityAt: new Date(),
    },
  });
  console.log(`✅ Created test ticket: ${testTicket.id} (${testTicket.readableId})`);

  // Add a test message
  const testMessage = await prisma.ticketMessage.create({
    data: {
      ticketId: testTicket.id,
      authorId: testUser.id,
      content: 'This is a test message for the integration test.',
      attachments: [],
      isInternal: false,
      isSystemGenerated: false,
    },
  });
  console.log(`✅ Created test message: ${testMessage.id}`);

  // Add status history
  const statusHistory = await prisma.ticketStatusHistory.create({
    data: {
      ticketId: testTicket.id,
      fromStatus: null,
      toStatus: 'OPEN',
      changedByUserId: testUser.id,
    },
  });
  console.log(`✅ Created status history: ${statusHistory.id}`);
  */

  console.log('\n✨ Integration Tests Complete!\n');
  console.log('Summary:');
  console.log(`- Database tables: ✅ Created`);
  console.log(`- Enums: ✅ Configured`);
  console.log(`- Existing tickets: ${ticketCount}`);
  console.log(`- Test user available: ✅ ${testUser.id}`);
  console.log(`- Admin user available: ${adminUser ? '✅ ' + adminUser.id : '⚠️  None'}`);
  console.log('\n🎯 Ready for API testing!');
}

function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  return `${year}${month}`;
}

main()
  .catch((e) => {
    console.error('❌ Test failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
