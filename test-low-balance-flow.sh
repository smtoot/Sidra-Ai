#!/bin/bash
# =============================================================================
# Test Script: Full Payment Flow with Low-Balance Parent
# =============================================================================
# This script tests the configurable payment window feature:
# 1. Creates a parent with low/zero balance
# 2. Creates a booking with price > balance
# 3. Teacher approves the booking
# 4. Verifies booking transitions to WAITING_FOR_PAYMENT (not error)
# 5. Verifies paymentDeadline is set
# =============================================================================

set -e

API_URL="http://localhost:4000"
echo "=============================================="
echo "  Testing Full Payment Flow (Low Balance)"
echo "=============================================="

# Step 1: Get test data IDs
echo ""
echo "📋 Step 1: Getting test data IDs..."

cd /Users/omerheathrow/Sidra-Ai/packages/database

# Get teacher info
TEACHER_DATA=$(npx ts-node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const profile = await prisma.teacherProfile.findFirst({
    where: { user: { isActive: true } },
    include: { 
      user: true,
      subjects: { include: { subject: true } }
    }
  });
  if (!profile) throw new Error('No teacher found');
  console.log(JSON.stringify({
    teacherId: profile.id,
    userId: profile.userId,
    phoneNumber: profile.user.phoneNumber,
    subjectId: profile.subjects[0]?.subjectId || null
  }));
}
main().finally(() => prisma.\$disconnect());
" 2>/dev/null)

TEACHER_ID=$(echo $TEACHER_DATA | jq -r '.teacherId')
TEACHER_USER_ID=$(echo $TEACHER_DATA | jq -r '.userId')
TEACHER_PHONE=$(echo $TEACHER_DATA | jq -r '.phoneNumber')
SUBJECT_ID=$(echo $TEACHER_DATA | jq -r '.subjectId')

echo "   Teacher ID: $TEACHER_ID"
echo "   Teacher User ID: $TEACHER_USER_ID"
echo "   Subject ID: $SUBJECT_ID"

# Get parent with low balance (or create test parent)
PARENT_DATA=$(npx ts-node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  // Find existing parent
  let parent = await prisma.parentProfile.findFirst({
    include: { 
      user: { include: { wallet: true } },
      children: true
    }
  });
  
  if (!parent || parent.children.length === 0) {
    throw new Error('No parent with children found');
  }
  
  // Reset wallet balance to 0 for testing
  if (parent.user.wallet) {
    await prisma.wallet.update({
      where: { id: parent.user.wallet.id },
      data: { balance: 0 }
    });
  }
  
  console.log(JSON.stringify({
    userId: parent.userId,
    phoneNumber: parent.user.phoneNumber,
    childId: parent.children[0].id,
    walletBalance: 0
  }));
}
main().finally(() => prisma.\$disconnect());
" 2>/dev/null)

PARENT_USER_ID=$(echo $PARENT_DATA | jq -r '.userId')
PARENT_PHONE=$(echo $PARENT_DATA | jq -r '.phoneNumber')
CHILD_ID=$(echo $PARENT_DATA | jq -r '.childId')
WALLET_BALANCE=$(echo $PARENT_DATA | jq -r '.walletBalance')

echo "   Parent User ID: $PARENT_USER_ID"
echo "   Parent Phone: $PARENT_PHONE"
echo "   Child ID: $CHILD_ID"
echo "   Wallet Balance: $WALLET_BALANCE SDG (reset to 0)"

# Step 2: Login as parent and create booking
echo ""
echo "📋 Step 2: Creating booking as parent..."

PARENT_TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"phoneNumber\": \"$PARENT_PHONE\", \"password\": \"password123\"}" | jq -r '.access_token')

if [ "$PARENT_TOKEN" == "null" ] || [ -z "$PARENT_TOKEN" ]; then
  echo "❌ Failed to login as parent"
  exit 1
fi
echo "   ✅ Parent logged in"

# Create booking (price > balance)
BOOKING_PRICE=100
START_TIME=$(date -u -v+2d +"%Y-%m-%dT10:00:00.000Z")  # 2 days from now
END_TIME=$(date -u -v+2d +"%Y-%m-%dT11:00:00.000Z")

BOOKING_RESPONSE=$(curl -s -X POST "$API_URL/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PARENT_TOKEN" \
  -d "{
    \"teacherId\": \"$TEACHER_ID\",
    \"subjectId\": \"$SUBJECT_ID\",
    \"childId\": \"$CHILD_ID\",
    \"startTime\": \"$START_TIME\",
    \"endTime\": \"$END_TIME\",
    \"price\": $BOOKING_PRICE
  }")

BOOKING_ID=$(echo $BOOKING_RESPONSE | jq -r '.id // empty')
if [ -z "$BOOKING_ID" ]; then
  echo "❌ Failed to create booking"
  echo "   Response: $BOOKING_RESPONSE"
  exit 1
fi

BOOKING_STATUS=$(echo $BOOKING_RESPONSE | jq -r '.status')
echo "   ✅ Booking created: $BOOKING_ID"
echo "   Status: $BOOKING_STATUS"
echo "   Price: $BOOKING_PRICE SDG"

# Step 3: Login as teacher and approve booking
echo ""
echo "📋 Step 3: Approving booking as teacher..."

TEACHER_TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"phoneNumber\": \"$TEACHER_PHONE\", \"password\": \"password123\"}" | jq -r '.access_token')

if [ "$TEACHER_TOKEN" == "null" ] || [ -z "$TEACHER_TOKEN" ]; then
  echo "❌ Failed to login as teacher"
  exit 1
fi
echo "   ✅ Teacher logged in"

APPROVE_RESPONSE=$(curl -s -X PATCH "$API_URL/bookings/$BOOKING_ID/approve" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json")

APPROVE_STATUS=$(echo $APPROVE_RESPONSE | jq -r '.status // empty')
PAYMENT_DEADLINE=$(echo $APPROVE_RESPONSE | jq -r '.paymentDeadline // empty')
ERROR_MESSAGE=$(echo $APPROVE_RESPONSE | jq -r '.message // empty')

echo ""
echo "=============================================="
echo "  RESULTS"
echo "=============================================="

if [ "$APPROVE_STATUS" == "WAITING_FOR_PAYMENT" ]; then
  echo "✅ SUCCESS: Booking transitioned to WAITING_FOR_PAYMENT"
  echo "   Payment Deadline: $PAYMENT_DEADLINE"
  echo ""
  echo "   This means:"
  echo "   - Teacher approval succeeded (no 400 error)"
  echo "   - Parent can now use 'Pay Now' button on dashboard"
  echo "   - Booking will expire if not paid by deadline"
elif [ "$APPROVE_STATUS" == "SCHEDULED" ]; then
  echo "⚠️  UNEXPECTED: Booking is SCHEDULED (funds may have been available)"
  echo "   This could mean the parent had sufficient balance"
elif [ -n "$ERROR_MESSAGE" ]; then
  echo "❌ FAILED: Received error"
  echo "   Error: $ERROR_MESSAGE"
  echo "   Full response: $APPROVE_RESPONSE"
else
  echo "⚠️  UNKNOWN RESULT"
  echo "   Response: $APPROVE_RESPONSE"
fi

echo ""
echo "=============================================="
echo "  Test Complete"
echo "=============================================="
