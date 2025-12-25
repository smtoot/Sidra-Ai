#!/bin/bash

API_BASE="http://localhost:4000"

echo "=========================================="
echo "EDGE CASE TESTING: INSUFFICIENT BALANCE"
echo "=========================================="

# Login as parent who will have insufficient balance
echo ""
echo "🔐 Getting parent token..."
PARENT_LOGIN=$(curl -s -X POST "${API_BASE}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "0500000004",
    "password": "password123"
  }')

PARENT_TOKEN=$(echo $PARENT_LOGIN | jq -r '.access_token')

if [ "$PARENT_TOKEN" == "null" ] || [ -z "$PARENT_TOKEN" ]; then
  echo "❌ Failed to login as parent"
  exit 1
fi

echo "✅ Logged in as parent Fatima"

# Login as teacher
echo ""
echo "🔐 Getting teacher token..."
TEACHER_LOGIN=$(curl -s -X POST "${API_BASE}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "0500000002",
    "password": "password123"
  }')

TEACHER_TOKEN=$(echo $TEACHER_LOGIN | jq -r '.access_token')
echo "✅ Logged in as teacher Ahmed"

# Check current balance
echo ""
echo "💰 Checking parent's current balance..."
cd packages/database && npx tsx -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const wallet = await prisma.wallet.findFirst({
    where: { userId: 'ec11c350-b455-4c8a-afd4-9b696b8c8b4b' }
  });
  
  console.log('Current Balance:', wallet.balance.toString(), 'SDG');
  console.log('Pending Balance:', wallet.pendingBalance.toString(), 'SDG');
  console.log('Available for booking:', wallet.balance.toString(), 'SDG');
}

main().finally(() => prisma.\$disconnect());
"

# Create a booking with price higher than available balance
echo ""
echo "📝 Creating booking with price 1000 SDG (should exceed available balance)..."
cd ../..
CREATE_RESPONSE=$(curl -s -X POST "${API_BASE}/bookings" \
  -H "Authorization: Bearer $PARENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "teacherId": "d8f82da5-076a-4a9c-8d61-3abf43ad0e0c",
    "subjectId": "c20a54d7-3bd5-43cb-9bdc-eb6717260f8c",
    "childId": "50d25f09-9564-43de-b081-0f44d207a873",
    "startTime": "2025-12-23T14:00:00.000Z",
    "endTime": "2025-12-23T15:00:00.000Z",
    "price": 1000
  }')

BOOKING_ID=$(echo $CREATE_RESPONSE | jq -r '.id')

if [ "$BOOKING_ID" == "null" ] || [ -z "$BOOKING_ID" ]; then
  echo "❌ Failed to create booking"
  echo "Response: $CREATE_RESPONSE"
  exit 1
fi

echo "✅ Booking created: $BOOKING_ID with price 1000 SDG"

# Teacher approves - this should fail with insufficient balance
echo ""
echo "🧪 Testing: Teacher approves booking with insufficient balance..."
echo "Expected: Should fail with 'Insufficient balance' error"
echo ""

APPROVE_RESPONSE=$(curl -s -X PATCH "${API_BASE}/bookings/${BOOKING_ID}/approve" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json")

echo "===== APPROVAL RESPONSE ====="
echo $APPROVE_RESPONSE | jq '.'

# Verify the booking was NOT approved
echo ""
echo "🔍 Verifying booking was NOT approved..."
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
  
  console.log('\\n===== VERIFICATION =====');
  const statusCheck = booking.status !== 'SCHEDULED' ? '✅' : '❌';
  console.log(\`\${statusCheck} Booking should NOT be SCHEDULED: \${booking.status}\`);
  
  const balanceCheck = wallet.balance.toString() === '850' ? '✅' : '❌';
  console.log(\`\${balanceCheck} Balance should be unchanged (850): \${wallet.balance}\`);
  
  const pendingCheck = wallet.pendingBalance.toString() === '250' ? '✅' : '❌';
  console.log(\`\${pendingCheck} Pending should be unchanged (250): \${wallet.pendingBalance}\`);
}

main().finally(() => prisma.\$disconnect());
"
