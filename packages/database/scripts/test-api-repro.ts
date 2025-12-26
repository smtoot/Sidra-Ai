
// Scripts usually run in node, so we use fetch API
// Assuming Node 18+

async function main() {
    const API_URL = 'http://localhost:4000';

    console.log('🔄 Authenticating as Admin...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@sidra.com', password: 'password123' })
    });

    if (!loginRes.ok) {
        console.error('❌ Login Failed:', loginRes.status, await loginRes.text());
        return;
    }

    const loginData = await loginRes.json() as any;
    const token = loginData.access_token || loginData.accessToken;
    console.log('✅ Logged in.');

    // Dispute ID from user logs
    const disputeId = '041c9286-caac-4906-be15-d2ac70655007';

    console.log(`🔄 Attempting to resolve dispute ${disputeId}...`);
    const res = await fetch(`${API_URL}/admin/disputes/${disputeId}/resolve`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            resolutionType: 'TEACHER_WINS',
            resolutionNote: 'Reproduction script test'
        })
    });

    console.log(`\n📊 Response Status: ${res.status}`);
    const text = await res.text();
    console.log(`📝 Response Body: ${text}`);
}

main().catch(console.error);
