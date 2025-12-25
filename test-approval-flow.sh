#!/bin/bash

BOOKING_ID="booking-test-1766305130949"
API_BASE="http://localhost:4000"

echo "🔐 Getting teacher Ahmed's auth token..."
# Login as teacher Ahmed
LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "0500000002",
    "password": "password123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Failed to login as teacher"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Logged in as teacher Ahmed"
echo "Token: ${TOKEN:0:20}..."

echo ""
echo "📝 Approving booking ${BOOKING_ID}..."
APPROVE_RESPONSE=$(curl -s -X PATCH "${API_BASE}/bookings/${BOOKING_ID}/approve" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo ""
echo "===== APPROVAL RESPONSE ====="
echo $APPROVE_RESPONSE | jq '.'

echo ""
echo "🔍 Checking database state..."

# Run a query to check booking status, transaction count, and wallet balances
cd packages/database && npx tsx -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const booking = await prisma.booking.findUnique({
    where: { id: '${BOOKING_ID}' }
  });
  
  const txCount = await prisma.transaction.count();
  
  const parentWallet = await prisma.wallet.findFirst({
    where: { userId: 'ec11c350-b455-4c8a-afd4-9b696b8c8b4b' }
  });
  
  const latestTx = await prisma.transaction.findMany({
    where: { walletId: parentWallet.id },
    orderBy: { createdAt: 'desc' },
    take: 2
  });

  console.log('\\n===== AFTER APPROVAL =====');
  console.log('Booking Status:', booking.status);
  console.log('Total Transactions:', txCount);
  console.log('Parent Balance:', parentWallet.balance.toString());
  console.log('Parent Pending Balance:', parentWallet.pendingBalance.toString());
  console.log('\\nLatest Transactions:');
  latestTx.forEach((tx, i) => {
    console.log(\`  \${i + 1}. Type: \${tx.type}, Amount: \${tx.amount}, Status: \${tx.status}\`);
  });
  
  // Verify expectations
  console.log('\\n===== VERIFICATION =====');
  const pass1 = booking.status === 'SCHEDULED' ? '✅' : '❌';
  console.log(\`\${pass1} Booking status should be SCHEDULED: \${booking.status}\`);
  
  const pass2 = txCount === 6 ? '✅' : '❌';
  console.log(\`\${pass2} Transaction count should be 6: \${txCount}\`);
  
  const pass3 = parentWallet.balance.toString() === '850' ? '✅' : '❌';
  console.log(\`\${pass3} Parent balance should be 850 (1000 - 150): \${parentWallet.balance}\`);
  
  const pass4 = parentWallet.pendingBalance.toString() === '250' ? '✅' : '❌';
  console.log(\`\${pass4} Parent pending should be 250 (100 + 150): \${parentWallet.pendingBalance}\`);
  
  const pass5 = latestTx[0]?.type === 'PAYMENT_LOCK' ? '✅' : '❌';
  console.log(\`\${pass5} Latest transaction should be PAYMENT_LOCK: \${latestTx[0]?.type}\`);
}

main().finally(() => prisma.\$disconnect());
"
