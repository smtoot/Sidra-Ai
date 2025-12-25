#!/bin/bash

API_BASE="http://localhost:4000"
BOOKING_ID="booking-test-1766305130949"  # The successfully approved booking from earlier

# Login as teacher
echo "🔐 Logging in as teacher..."
TEACHER_LOGIN=$(curl -s -X POST "${API_BASE}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "0500000002",
    "password": "password123"
  }')

TEACHER_TOKEN=$(echo $TEACHER_LOGIN | jq -r '.access_token')
echo "✅ Token obtained"

echo ""
echo "=========================================="
echo "🧪 TEST: Idempotency - Retry Approval"
echo "=========================================="
echo "Booking ID: $BOOKING_ID (already SCHEDULED)"
echo "Expected: Should not create duplicate transaction"
echo ""

# Get state BEFORE retry
echo "📊 State BEFORE retry approval..."
cd packages/database && npx tsx -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const booking = await prisma.booking.findUnique({
    where: { id: '${BOOKING_ID}' }
  });
  
  const wallet = await prisma.wallet.findFirst({
    where: { userId: 'ec11c350-b455-4c8a-afd4-9b696b8c8b4b' }
  });
  
  const txCount = await prisma.transaction.count();
  const lockTxCount = await prisma.transaction.count({
    where: { type: 'PAYMENT_LOCK' }
  });

  console.log('Booking Status:', booking.status);
  console.log('Balance:', wallet.balance.toString());
  console.log('Pending:', wallet.pendingBalance.toString());
  console.log('Total Transactions:', txCount);
  console.log('PAYMENT_LOCK Transactions:', lockTxCount);
}

main().finally(() => prisma.\$disconnect());
" > /tmp/before-state.txt

cat /tmp/before-state.txt

# Try to approve again
echo ""
echo "🔄 Attempting to approve again..."
cd ../..
APPROVE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X PATCH "${API_BASE}/bookings/${BOOKING_ID}/approve" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json")

HTTP_STATUS=$(echo "$APPROVE_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$APPROVE_RESPONSE" | sed '/HTTP_STATUS/d')

echo "📬 Response Code: $HTTP_STATUS"
echo "$BODY" | jq -r '.status' | head -1

# Get state AFTER retry
echo ""
echo "📊 State AFTER retry approval..."
cd packages/database && npx tsx -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const booking = await prisma.booking.findUnique({
    where: { id: '${BOOKING_ID}' }
  });
  
  const wallet = await prisma.wallet.findFirst({
    where: { userId: 'ec11c350-b455-4c8a-afd4-9b696b8c8b4b' }
  });
  
  const txCount = await prisma.transaction.count();
  const lockTxCount = await prisma.transaction.count({
    where: { type: 'PAYMENT_LOCK' }
  });

  console.log('Booking Status:', booking.status);
  console.log('Balance:', wallet.balance.toString());
  console.log('Pending:', wallet.pendingBalance.toString());
  console.log('Total Transactions:', txCount);
  console.log('PAYMENT_LOCK Transactions:', lockTxCount);
  
  console.log('\\n===== VERIFICATION =====');
  const statusPass = booking.status === 'SCHEDULED' ? '✅' : '❌';
  console.log(\`\${statusPass} Status still SCHEDULED\`);
  
  const balancePass = wallet.balance.toString() === '850' ? '✅' : '❌';
  console.log(\`\${balancePass} Balance unchanged: \${wallet.balance}\`);
  
  const pendingPass = wallet.pendingBalance.toString() === '250' ? '✅' : '❌';
  console.log(\`\${pendingPass} Pending unchanged: \${wallet.pendingBalance}\`);
  
  const txPass = txCount === 6 ? '✅' : '❌';
  console.log(\`\${txPass} No duplicate transaction: \${txCount}\`);
  
  const lockPass = lockTxCount === 2 ? '✅' : '❌';
  console.log(\`\${lockPass} Still 2 PAYMENT_LOCK transactions: \${lockTxCount}\`);
}

main().finally(() => prisma.\$disconnect());
"
