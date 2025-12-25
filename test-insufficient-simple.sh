#!/bin/bash

API_BASE="http://localhost:4000"
BOOKING_ID="booking-insufficient-1766307534993"

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
echo "🧪 TEST: Approve booking with insufficient balance"
echo "=========================================="
echo "Booking ID: $BOOKING_ID"
echo "Booking Price: 1000 SDG"
echo "Parent Balance: 850 SDG"
echo "Expected: 400 Bad Request - Insufficient balance"
echo ""

# Try to approve - should fail
APPROVE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X PATCH "${API_BASE}/bookings/${BOOKING_ID}/approve" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json")

HTTP_STATUS=$(echo "$APPROVE_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$APPROVE_RESPONSE" | sed '/HTTP_STATUS/d')

echo "📬 Response Code: $HTTP_STATUS"
echo "📄 Response Body:"
echo "$BODY" | jq '.'

# Verify the outcome
echo ""
echo "=========================================="
echo "✅ VERIFICATION"
echo "=========================================="

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

  const statusPass = booking.status === 'PENDING_TEACHER_APPROVAL' ? '✅' : '❌';
  console.log(\`\${statusPass} Booking status unchanged: \${booking.status}\`);
  
  const balancePass = wallet.balance.toString() === '850' ? '✅' : '❌';
  console.log(\`\${balancePass} Balance unchanged: \${wallet.balance}\`);
  
  const pendingPass = wallet.pendingBalance.toString() === '250' ? '✅' : '❌';
  console.log(\`\${pendingPass} Pending unchanged: \${wallet.pendingBalance}\`);
  
  const txPass = txCount === 6 ? '✅' : '❌';
  console.log(\`\${txPass} No new transaction created: \${txCount}\`);
  
  const httpPass = '${HTTP_STATUS}' === '400' ? '✅' : '❌';
  console.log(\`\${httpPass} HTTP 400 returned: ${HTTP_STATUS}\`);
}

main().finally(() => prisma.\$disconnect());
"
