#!/bin/bash
# Setup Staging Test Data Script
# This creates test accounts via the API to ensure they work correctly

API_URL="https://api-staging.sidra.sd"
TEACHER_EMAIL="demo.teacher@sidra.sd"
STUDENT_EMAIL="demo.student@sidra.sd"
PASSWORD="DemoTest123"

echo "=========================================="
echo "Setting up Staging Test Data"
echo "=========================================="

# 1. Register Teacher
echo ""
echo "1. Registering teacher account..."
TEACHER_RESULT=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEACHER_EMAIL\",
    \"password\": \"$PASSWORD\",
    \"firstName\": \"Demo\",
    \"lastName\": \"Teacher\",
    \"phoneNumber\": \"+249100000001\",
    \"role\": \"TEACHER\"
  }")

if echo "$TEACHER_RESULT" | grep -q "access_token"; then
  echo "   ✓ Teacher registered successfully"
  TEACHER_TOKEN=$(echo "$TEACHER_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
elif echo "$TEACHER_RESULT" | grep -q "already exists"; then
  echo "   Teacher already exists, logging in..."
  TEACHER_LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$TEACHER_EMAIL\", \"password\": \"$PASSWORD\"}")
  TEACHER_TOKEN=$(echo "$TEACHER_LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)
  if [ -n "$TEACHER_TOKEN" ]; then
    echo "   ✓ Teacher logged in successfully"
  else
    echo "   ✗ Failed to login teacher: $TEACHER_LOGIN"
    exit 1
  fi
else
  echo "   ✗ Failed to register teacher: $TEACHER_RESULT"
  exit 1
fi

# 2. Register Student
echo ""
echo "2. Registering student account..."
STUDENT_RESULT=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$STUDENT_EMAIL\",
    \"password\": \"$PASSWORD\",
    \"firstName\": \"Demo\",
    \"lastName\": \"Student\",
    \"phoneNumber\": \"+249100000002\",
    \"role\": \"STUDENT\"
  }")

if echo "$STUDENT_RESULT" | grep -q "access_token"; then
  echo "   ✓ Student registered successfully"
  STUDENT_TOKEN=$(echo "$STUDENT_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
elif echo "$STUDENT_RESULT" | grep -q "already exists"; then
  echo "   Student already exists, logging in..."
  STUDENT_LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$STUDENT_EMAIL\", \"password\": \"$PASSWORD\"}")
  STUDENT_TOKEN=$(echo "$STUDENT_LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)
  if [ -n "$STUDENT_TOKEN" ]; then
    echo "   ✓ Student logged in successfully"
  else
    echo "   ✗ Failed to login student: $STUDENT_LOGIN"
    exit 1
  fi
else
  echo "   ✗ Failed to register student: $STUDENT_RESULT"
  exit 1
fi

echo ""
echo "=========================================="
echo "TEST ACCOUNTS READY"
echo "=========================================="
echo ""
echo "Teacher Account:"
echo "  Email: $TEACHER_EMAIL"
echo "  Password: $PASSWORD"
echo ""
echo "Student Account:"
echo "  Email: $STUDENT_EMAIL"  
echo "  Password: $PASSWORD"
echo ""
echo "=========================================="
echo ""
echo "NEXT STEPS:"
echo "1. Login as teacher at https://staging.sidra.sd/login"
echo "2. Complete teacher onboarding (add subjects, availability)"
echo "3. Login as student and book a session"
echo ""
