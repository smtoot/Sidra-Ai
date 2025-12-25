#!/bin/bash

API_BASE="http://localhost:4000"
BOOKING_ID="booking-test-1766305130949"  # Our test booking in SCHEDULED status

# Login as teacher
echo "🔐 Logging in as teacher..."
TEACHER_LOGIN=$(curl -s -X POST "${API_BASE}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "0500000002",
    "password": "password123"
  }')

TEACHER_TOKEN=$(echo $TEACHER_LOGIN | jq -r '.access_token')

if [ "$TEACHER_TOKEN" == "null" ] || [ -z "$TEACHER_TOKEN" ]; then
  echo "❌ Failed to login as teacher"
  exit 1  
fi

echo "✅ Teacher token obtained"

echo ""
echo "=========================================="
echo "🧪 TEST: Session Completion & Fund Release"
echo "=========================================="
echo "Booking ID: $BOOKING_ID"
echo "Expected: PAYMENT_RELEASE transactions + balance updates"
echo ""

# Get state BEFORE completion
echo "📊 State BEFORE completing session..."
cd packages/database && npx tsx -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const booking = await prisma.booking.findUnique({
    where: { id: '${BOOKING_ID}' },
    include: {
      teacherProfile: { include: { user: true } },
      bookedByUser: true
    }
  });
  
  const parentWallet = await prisma.wallet.findFirst({
    where: { userId: booking.bookedByUserId }
  });
  
  const teacherWallet = await prisma.wallet.findFirst({
    where: { userId: booking.teacherProfile.userId }
  });
  
  const txCount = await prisma.transaction.count();

  console.log('Booking Status:', booking.status);
  console.log('Price:', booking.price.toString(), 'SDG');
  console.log('Commission: 18%');
  console.log('\\nParent Wallet:');
  console.log('  Balance:', parentWallet.balance.toString());
  console.log('  Pending:', parentWallet.pendingBalance.toString());
  console.log('\\nTeacher Wallet:');
  console.log('  Balance:', teacherWallet.balance.toString());
  console.log('\\nTotal Transactions:', txCount);
}

main().finally(() => prisma.\$disconnect());
"

# Teacher marks session as complete
echo ""
echo "🎓 Teacher completing session..."
cd ../..
COMPLETE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X PATCH "${API_BASE}/bookings/${BOOKING_ID}/complete-session" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json")

HTTP_STATUS=$(echo "$COMPLETE_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$COMPLETE_RESPONSE" | sed '/HTTP_STATUS/d')

echo "📬 Response Code: $HTTP_STATUS"
if [ "$HTTP_STATUS" == "200" ]; then
  echo "$BODY" | jq -r '{status: .status, paymentReleasedAt: .paymentReleasedAt}' 2>/dev/null || echo "$BODY"
else
  echo "$BODY"
fi

# Get state AFTER completion
echo ""
echo "📊 State AFTER completing session..."
cd packages/database && npx tsx -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const booking = await prisma.booking.findUnique({
    where: { id: '${BOOKING_ID}' },
    include: {
      teacherProfile: { include: { user: true } },
      bookedByUser: true
    }
  });
  
  const parentWallet = await prisma.wallet.findFirst({
    where: { userId: booking.bookedByUserId }
  });
  
  const teacherWallet = await prisma.wallet.findFirst({
    where: { userId: booking.teacherProfile.userId }
  });
  
  const txCount = await prisma.transaction.count();
  
  const latestTxs = await prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3
  });

  console.log('Booking Status:', booking.status);
  console.log('\\nParent Wallet:');
  console.log('  Balance:', parentWallet.balance.toString());
  console.log('  Pending:', parentWallet.pendingBalance.toString());
  console.log('\\nTeacher Wallet:');
  console.log('  Balance:', teacherWallet.balance.toString());
  console.log('\\nTotal Transactions:', txCount);
  
  console.log('\\nLatest 3 Transactions:');
  latestTxs.forEach((tx, i) => {
    console.log(\`  \${i+1}. \${tx.type}: \${tx.amount} SDG\`);
  });
  
  // Calculate expected values - Teacher gets 150 * (1 - 0.18) = 123
  const price = 150;
  const teacherEarnings = price * 0.82;
  
  console.log('\\n===== VERIFICATION =====');
  const statusPass = ['PENDING_CONFIRMATION', 'COMPLETED'].includes(booking.status) ? '✅' : '❌';
  console.log(\`\${statusPass} Status updated to PENDING_CONFIRMATION or COMPLETED: \${booking.status}\`);
  
  const parentBalPass = parentWallet.balance.toString() === '850' ? '✅' : '❌';
  console.log(\`\${parentBalPass} Parent balance unchanged: \${parentWallet.balance}\`);
  
  const parentPendPass = parentWallet.pendingBalance.toString() === '100' ? '✅' : '❌';
  console.log(\`\${parentPendPass} Parent pending decreased by 150 (250→100): \${parentWallet.pendingBalance}\`);
  
  const teacherBalPass = Number(teacherWallet.balance) === 705 ? '✅' : '❌';
  console.log(\`\${teacherBalPass} Teacher received \${teacherEarnings.toFixed(0)} SDG (582 + 123 = 705): \${teacherWallet.balance}\`);
  
  const txPass = txCount === 8 ? '✅' : '❌';
  console.log(\`\${txPass} 2 new PAYMENT_RELEASE transactions (6→8): \${txCount}\`);
  
  const httpPass = '${HTTP_STATUS}' === '200' ? '✅' : '❌';
  console.log(\`\${httpPass} HTTP 200 OK: ${HTTP_STATUS}\`);
}

main().finally(() => prisma.\$disconnect());
"
