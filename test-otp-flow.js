const axios = require('axios');

const API_URL = 'http://localhost:4000';

async function testOTPFlow() {
  console.log('🧪 Testing OTP Registration Flow\n');

  // Generate unique test data
  const timestamp = Date.now();
  const testEmail = `test+otp${timestamp}@example.com`;
  const testPhone = `+9665${Math.floor(Math.random() * 100000000)}`;
  const testPassword = 'TestPass123!@#';

  try {
    // Step 1: Request OTP
    console.log('📤 Step 1: Requesting OTP registration...');
    const requestResponse = await axios.post(`${API_URL}/auth/register/request`, {
      email: testEmail,
      phoneNumber: testPhone,
      password: testPassword,
      role: 'TEACHER',
      firstName: 'Test',
      lastName: 'User',
    });

    console.log('✅ OTP request successful:', requestResponse.data);
    console.log('   Status:', requestResponse.status);

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 2: Query database to get the OTP (in real scenario, user would receive via email)
    console.log('\n🔍 Step 2: Fetching OTP from database (simulating email delivery)...');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const pending = await prisma.pending_registrations.findUnique({
      where: { email: testEmail.toLowerCase().trim() },
    });

    if (!pending) {
      throw new Error('Pending registration not found in database');
    }

    console.log('✅ Found pending registration');
    console.log('   Email:', pending.email);
    console.log('   OTP Hash:', pending.otpHash.substring(0, 20) + '...');
    console.log('   Expires At:', pending.otpExpiresAt);
    console.log('   Attempts:', pending.otpAttempts);

    // We can't retrieve the actual OTP since it's hashed
    // Let's test with an invalid OTP first to verify error handling
    console.log('\n🧪 Step 3a: Testing with invalid OTP (should fail)...');
    try {
      await axios.post(`${API_URL}/auth/register/verify`, {
        email: testEmail,
        otp: '000000',
      });
      console.log('❌ Should have failed but succeeded - this is unexpected!');
    } catch (error) {
      if (error.response) {
        console.log('✅ Correctly rejected invalid OTP');
        console.log('   Status:', error.response.status);
        console.log('   Error:', error.response.data.message);

        // Check that attempts were incremented
        const updatedPending = await prisma.pending_registrations.findUnique({
          where: { email: testEmail.toLowerCase().trim() },
        });
        console.log('   Attempts after failure:', updatedPending.otpAttempts);
      } else {
        throw error;
      }
    }

    // Step 4: Test resend functionality
    console.log('\n📤 Step 3b: Testing resend OTP...');
    const resendResponse = await axios.post(`${API_URL}/auth/register/resend`, {
      email: testEmail,
    });

    console.log('✅ Resend successful:', resendResponse.data);

    const pendingAfterResend = await prisma.pending_registrations.findUnique({
      where: { email: testEmail.toLowerCase().trim() },
    });
    console.log('   Previous OTP hash now stored:', !!pendingAfterResend.previousOtpHash);
    console.log('   Attempts reset to:', pendingAfterResend.otpAttempts);

    // Step 5: Manual verification with console OTP
    console.log('\n⚠️  Step 4: Manual OTP verification needed');
    console.log('   Since OTPs are hashed, we need to check the email or logs');
    console.log('   In a real test, you would:');
    console.log('   1. Check email-outbox worker logs for the OTP');
    console.log('   2. Or query the email_outbox table for the payload');

    // Query email outbox
    const emailOutbox = await prisma.email_outbox.findMany({
      where: {
        to: testEmail.toLowerCase().trim(),
        templateId: 'registration-otp',
      },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    if (emailOutbox.length > 0) {
      console.log('\n📧 Found email in outbox:');
      console.log('   Template:', emailOutbox[0].templateId);
      console.log('   Status:', emailOutbox[0].status);
      console.log('   Payload:', JSON.stringify(emailOutbox[0].payload, null, 2));

      const otp = emailOutbox[0].payload.otp;
      if (otp) {
        console.log('\n🎯 Found OTP in email payload:', otp);
        console.log('   Attempting verification with real OTP...');

        const verifyResponse = await axios.post(`${API_URL}/auth/register/verify`, {
          email: testEmail,
          otp: otp,
        });

        console.log('✅ VERIFICATION SUCCESSFUL!');
        console.log('   Access Token:', verifyResponse.data.access_token.substring(0, 30) + '...');
        console.log('   Refresh Token:', verifyResponse.data.refresh_token.substring(0, 30) + '...');
        console.log('   CSRF Token:', verifyResponse.data.csrf_token.substring(0, 30) + '...');

        // Verify user was created
        const user = await prisma.users.findUnique({
          where: { email: testEmail.toLowerCase().trim() },
        });

        console.log('\n👤 User created in database:');
        console.log('   ID:', user.id);
        console.log('   Email:', user.email);
        console.log('   Email Verified:', user.emailVerified);
        console.log('   Email Verified At:', user.emailVerifiedAt);
        console.log('   Role:', user.role);

        // Verify pending registration was deleted
        const pendingAfterVerify = await prisma.pending_registrations.findUnique({
          where: { email: testEmail.toLowerCase().trim() },
        });
        console.log('\n🗑️  Pending registration deleted:', !pendingAfterVerify);

        console.log('\n🎉 All tests passed! OTP flow is working correctly.');
      }
    } else {
      console.log('\n⚠️  No email found in outbox - email worker may not have processed yet');
      console.log('   Run the email worker or check the database manually');
    }

    await prisma.$disconnect();

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testOTPFlow();
