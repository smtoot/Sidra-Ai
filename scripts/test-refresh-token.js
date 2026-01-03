const fetch = require('node-fetch');

const API_URL = 'http://localhost:5050';

async function testRefreshToken() {
    console.log('--- Testing Refresh Token Flow ---');

    // 1. Register/Login a test user
    const email = `refresh_test_${Date.now()}@example.com`;
    const password = 'Password123!';
    const phone = `09${Math.floor(Math.random() * 100000000)}`;

    console.log(`\n1. Registering user: ${email}...`);
    const regRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email,
            password,
            phoneNumber: phone,
            role: 'PARENT',
            firstName: 'Refresh',
            lastName: 'Tester',
        }),
    });

    const regData = await regRes.json();
    if (!regRes.ok) throw new Error(`Registration failed: ${JSON.stringify(regData)}`);

    const { access_token, refresh_token } = regData;
    console.log('   ✅ Registration successful');
    console.log('   Access Token:', access_token.substring(0, 15) + '...');
    console.log('   Refresh Token:', refresh_token ? refresh_token.substring(0, 15) + '...' : '❌ MISSING!');

    if (!refresh_token) throw new Error('Refresh token not returned!');

    // 2. Refresh the token (First use)
    console.log('\n2. Testing Token Rotation (Refresh #1)...');
    const refresh1Res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token }),
    });

    const refresh1Data = await refresh1Res.json();
    if (!refresh1Res.ok) throw new Error(`Refresh #1 failed: ${JSON.stringify(refresh1Data)}`);

    const new_access_token = refresh1Data.access_token;
    const new_refresh_token = refresh1Data.refresh_token;

    console.log('   ✅ Refresh #1 successful');
    console.log('   New Access Token:', new_access_token.substring(0, 15) + '...');
    console.log('   New Refresh Token:', new_refresh_token.substring(0, 15) + '...');

    if (refresh_token === new_refresh_token) throw new Error('Token was NOT rotated (same token returned)');

    // 3. Reuse Detection (Try to use the OLD refresh token again)
    console.log('\n3. Testing Reuse Detection (Using OLD token)...');
    const refreshReuseRes = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token }), // OLD token
    });

    if (refreshReuseRes.ok) {
        throw new Error('❌ Reuse detection FAILED! Old token was accepted.');
    }

    const reuseData = await refreshReuseRes.json();
    console.log('   ✅ Old token rejected as expected:', reuseData.message);

    // 4. Verify Side Effect: The NEW token should now be revoked too (Family Revocation)
    console.log('\n4. Verifying Family Revocation (Using NEW token after compromise)...');
    const refresh2Res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: new_refresh_token }), // NEW token
    });

    if (refresh2Res.ok) {
        throw new Error('❌ Family revocation FAILED! New token still works after reuse detected.');
    }
    const familyData = await refresh2Res.json();
    console.log('   ✅ New token correctly rejected (Family revoked):', familyData.message);

    console.log('\n✅✅ REFRESH TOKEN AUDIT PASSED ✅✅');
}

testRefreshToken().catch(err => {
    console.error('\n❌ TEST FAILED:', err.message);
    process.exit(1);
});
