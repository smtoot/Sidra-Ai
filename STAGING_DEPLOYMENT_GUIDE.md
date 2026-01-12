# Staging Environment Deployment Guide

## Overview

This guide will help you set up a staging environment with Jitsi integration **on your current VPS** alongside your production environment. After testing is complete, you'll deploy to production with feature flags for safe rollout.

---

## Architecture

```
Single Server (2 vCPU / 8 GB RAM)
├── Production Environment (ports 80/443)
│   ├── app.sidra.sd
│   ├── api.sidra.sd
│   └── PostgreSQL (5432)
│
└── Staging Environment (ports 8080/8443)
    ├── staging.sidra.sd
    ├── api-staging.sidra.sd
    ├── meet-staging.sidra.sd (Jitsi)
    └── PostgreSQL (5433)
```

---

## Prerequisites

Before you start, ensure you have:

- [ ] SSH access to your VPS
- [ ] Root or sudo privileges
- [ ] Docker and Docker Compose installed
- [ ] Access to your DNS provider
- [ ] Stripe TEST API keys (not live keys!)

---

## Step 1: Generate Secrets (5 minutes)

On your **local machine**, run:

```bash
cd /path/to/Sidra-Ai
./scripts/deploy-staging.sh generate-secrets
```

This will output secrets like:

```bash
POSTGRES_PASSWORD_STAGING=a1b2c3d4...
JWT_SECRET=e5f6g7h8...
ENCRYPTION_KEY=i9j0k1l2...  # Must be exactly 32 chars
JITSI_APP_SECRET_STAGING=m3n4o5p6...
# ... etc
```

**Save these in a secure location** (password manager).

---

## Step 2: Create .env.staging File (10 minutes)

```bash
# Copy the example file
cp .env.staging.example .env.staging

# Edit the file
nano .env.staging
```

Fill in ALL values using:
- The secrets you generated in Step 1
- Your server's public IP
- **Stripe TEST keys** (sk_test_..., pk_test_...)
- Staging email credentials

**CRITICAL**: Use DIFFERENT secrets from production!

**Example .env.staging**:

```bash
# Database
POSTGRES_USER_STAGING=sidra_staging
POSTGRES_PASSWORD_STAGING=<your-generated-password>
POSTGRES_DB_STAGING=sidra_staging

# JWT (DIFFERENT from production!)
JWT_SECRET=<your-generated-secret>
JWT_REFRESH_SECRET=<your-generated-secret>

# Encryption (DIFFERENT from production!)
ENCRYPTION_KEY=<your-generated-key>  # Exactly 32 chars!

# Jitsi
JITSI_ENABLED=true
JITSI_APP_ID_STAGING=sidra_staging
JITSI_APP_SECRET_STAGING=<your-generated-secret>
JICOFO_COMPONENT_SECRET_STAGING=<your-generated-secret>
JICOFO_AUTH_PASSWORD_STAGING=<your-generated-password>
JVB_AUTH_PASSWORD_STAGING=<your-generated-password>
PUBLIC_IP=<your-server-public-ip>

# Payment (USE TEST KEYS!)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Frontend
NEXT_PUBLIC_JITSI_ENABLED=true
NEXT_PUBLIC_JITSI_DOMAIN=meet-staging.sidra.sd
```

Save and close the file.

---

## Step 3: Configure DNS (15 minutes)

Add these DNS A records pointing to your server's public IP:

| Record Type | Name | Value | TTL |
|-------------|------|-------|-----|
| A | staging.sidra.sd | <your-server-ip> | 300 |
| A | api-staging.sidra.sd | <your-server-ip> | 300 |
| A | meet-staging.sidra.sd | <your-server-ip> | 300 |

**Test DNS propagation**:

```bash
# Wait 5-10 minutes for DNS to propagate

# Then test:
nslookup staging.sidra.sd
nslookup api-staging.sidra.sd
nslookup meet-staging.sidra.sd

# All should return your server IP
```

---

## Step 4: Deploy Staging Environment (20 minutes)

### On your VPS:

```bash
# SSH into your server
ssh root@<your-server-ip>

# Navigate to your project
cd /opt/Sidra-Ai  # or wherever your project is

# Pull latest code
git pull origin develop  # or your branch name

# Run the setup script
./scripts/deploy-staging.sh setup
```

The script will:
1. ✅ Check for .env.staging
2. ✅ Verify DNS configuration
3. ✅ Obtain SSL certificates
4. ✅ Build Docker images
5. ✅ Start all containers
6. ✅ Display status

**Expected output**:

```
[INFO] Starting staging environment setup...
[INFO] Checking DNS configuration...
[SUCCESS] staging.sidra.sd DNS configured ✓
[SUCCESS] api-staging.sidra.sd DNS configured ✓
[SUCCESS] meet-staging.sidra.sd DNS configured ✓
[INFO] Setting up SSL certificates...
[SUCCESS] SSL certificates obtained
[INFO] Building staging environment...
[INFO] Starting staging environment...
[SUCCESS] Staging environment setup complete!

Staging URLs:
  Web:   https://staging.sidra.sd
  API:   https://api-staging.sidra.sd
  Jitsi: https://meet-staging.sidra.sd
```

---

## Step 5: Copy Production Database (30 minutes)

```bash
# Still on your VPS
./scripts/deploy-staging.sh copy-db
```

This will:
1. Create a backup of production database
2. Restore to staging database
3. **Sanitize sensitive data**:
   - Emails → appended with "+staging"
   - Passwords → NOT changed (existing hashes remain)
   - Payment tokens → cleared
   - Meeting links → cleared

**Example**:
- Production: `teacher@example.com` → Staging: `teacher+staging@example.com`
- Users can login with **same passwords** but emails are different

---

## Step 6: Verify Staging Environment (10 minutes)

### Test API:

```bash
curl https://api-staging.sidra.sd/health
# Expected: {"status":"ok"}
```

### Test Web:

Open in browser: `https://staging.sidra.sd`

You should see your application's login page with a warning banner saying "STAGING ENVIRONMENT".

### Test Jitsi:

Open in browser: `https://meet-staging.sidra.sd`

You should see the Jitsi Meet interface (but won't be able to create rooms yet - that's expected, requires JWT from your API).

### Login Test:

Try logging in with a production user account using:
- Email: `<original-email>+staging@domain.com`
- Password: `<same as production>`

**Example**: If production email is `john@example.com`, use `john+staging@example.com`

---

## Step 7: Monitor Resource Usage (Ongoing)

```bash
# Check status of all staging containers
./scripts/deploy-staging.sh status

# View logs
./scripts/deploy-staging.sh logs

# Check resource usage
docker stats
```

**Expected resource usage**:
- **Staging total**: ~4-5 GB RAM, ~1 vCPU
- **Production**: ~1.5 GB RAM, ~0.8 vCPU
- **Combined**: ~6 GB RAM, ~1.8 vCPU (within your 8 GB / 2 vCPU server)

---

## Step 8: Integrate Jitsi Code (1-2 weeks)

Now you're ready to start integrating Jitsi! Follow the implementation steps from the main guide:

### Backend Integration:

1. **Add Jitsi fields to database schema**
2. **Create JitsiService** (`apps/api/src/jitsi/jitsi.service.ts`)
3. **Create FeatureFlagService** (already created)
4. **Add API endpoints**:
   - `GET /bookings/:id/jitsi-config`
   - `PATCH /bookings/:id/toggle-jitsi`

### Frontend Integration:

1. **Install dependencies**: `npm install @jitsi/react-sdk`
2. **Create JitsiMeetingRoom component**
3. **Update booking pages** to use Jitsi
4. **Use the useFeatureFlag hook** (already created)

**All development happens on staging branch!**

---

## Step 9: Test Jitsi on Staging (1-2 weeks)

### Test Checklist:

**Functional Testing**:
- [ ] Create booking with Jitsi enabled
- [ ] Teacher can join meeting
- [ ] Student can join meeting
- [ ] Video/audio works
- [ ] Screen sharing works
- [ ] Chat works
- [ ] Meeting ends properly
- [ ] JWT tokens expire correctly (after 3 hours)

**Performance Testing**:
- [ ] Test 2 concurrent sessions
- [ ] Test 5 concurrent sessions
- [ ] Test 8 concurrent sessions (near limit)
- [ ] Monitor CPU/RAM usage
- [ ] Verify no crashes

**Browser Testing**:
- [ ] Chrome (desktop)
- [ ] Chrome (mobile)
- [ ] Firefox
- [ ] Safari (desktop)
- [ ] Safari (mobile - note E2EE won't work)

**Security Testing**:
- [ ] Cannot join without valid JWT
- [ ] Cannot access room outside time window
- [ ] Room names are unique per booking

### Pilot Testing:

Invite 5-10 friendly teachers to test on staging:

```bash
# Send them:
URL: https://staging.sidra.sd
Login: <their-email>+staging@domain.com
Password: <same as production>
```

Collect feedback via survey or interviews.

---

## Step 10: Deploy to Production (After staging success)

Once staging testing is complete and successful:

### 10.1: Merge Code to Main Branch

```bash
# On your local machine
git checkout main
git merge feature/jitsi-integration
git push origin main
```

### 10.2: Add Production Environment Variables

On production `.env.production`, add:

```bash
# Feature Flags - START WITH DISABLED!
JITSI_ENABLED=false

# Jitsi Configuration (production)
JITSI_DOMAIN=meet.sidra.sd
JITSI_APP_ID=sidra_production
JITSI_APP_SECRET=<NEW-production-secret>  # DIFFERENT from staging!
JICOFO_COMPONENT_SECRET=<NEW-production-secret>
JICOFO_AUTH_PASSWORD=<NEW-production-password>
JVB_AUTH_PASSWORD=<NEW-production-password>
PUBLIC_IP=<production-server-ip>

# Frontend
NEXT_PUBLIC_JITSI_ENABLED=false  # START DISABLED
NEXT_PUBLIC_JITSI_DOMAIN=meet.sidra.sd
```

### 10.3: Run Database Migration

```bash
cd apps/api
npx prisma migrate deploy
```

### 10.4: Deploy Production

```bash
# On production server
cd /opt/Sidra-Ai
git pull origin main

# Backup database first!
docker exec sidra_postgres pg_dump -U sidra_user sidra_db > /backup/pre-jitsi-$(date +%Y%m%d).sql

# Deploy
docker-compose -f docker-compose.production.yml up -d --build

# Monitor
docker-compose -f docker-compose.production.yml logs -f
```

### 10.5: Verify Production (Jitsi Still Disabled)

At this point, Jitsi code is deployed but **disabled** by feature flag. Users see no changes.

Test:
- [ ] Application works normally
- [ ] No errors in logs
- [ ] External meeting links still work
- [ ] No performance degradation

### 10.6: Enable for Pilot Users (10-20 teachers)

Update database to enable Jitsi for specific teachers:

```sql
-- Add jitsiEnabled column if not exists
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS jitsi_enabled BOOLEAN DEFAULT false;

-- Enable for pilot teachers
UPDATE teacher_profiles
SET jitsi_enabled = true
WHERE id IN ('teacher1-id', 'teacher2-id', ...);
```

Or set global flag to true and monitor:

```bash
# In .env.production
JITSI_ENABLED=true

# Restart
docker-compose -f docker-compose.production.yml restart api web
```

### 10.7: Monitor Pilot (1-2 weeks)

Watch for:
- CPU/RAM usage (should stay <70%)
- Error logs
- User feedback
- Session completion rate
- Video quality reports

### 10.8: Gradual Rollout

If pilot is successful:

**Week 1**: Enable for 25% of teachers
**Week 2**: Enable for 50% of teachers
**Week 3**: Enable for 100% of teachers

---

## Useful Commands

```bash
# Staging
./scripts/deploy-staging.sh status   # Check status
./scripts/deploy-staging.sh logs     # View logs
./scripts/deploy-staging.sh restart  # Restart
./scripts/deploy-staging.sh stop     # Stop staging
./scripts/deploy-staging.sh start    # Start staging

# Resource monitoring
docker stats

# Check disk space
df -h

# Check server load
top

# Restart production (if needed)
docker-compose -f docker-compose.production.yml restart
```

---

## Troubleshooting

### Staging containers won't start

```bash
# Check logs
docker-compose -f docker-compose.staging.yml logs

# Common issues:
# 1. Port conflicts - make sure ports are different from production
# 2. .env.staging missing or invalid
# 3. DNS not configured
# 4. SSL certificates not obtained
```

### "Out of memory" errors

```bash
# Check memory usage
free -h

# If too high:
# 1. Stop staging temporarily
./scripts/deploy-staging.sh stop

# 2. Or reduce resource limits in docker-compose.staging.yml
```

### Jitsi meeting won't connect

```bash
# Check Jitsi logs
docker logs sidra_jvb_staging
docker logs sidra_prosody_staging

# Common issues:
# 1. PUBLIC_IP not set correctly in .env.staging
# 2. JWT secret mismatch between API and Jitsi
# 3. Ports 10000/udp and 4443/tcp not open
```

### SSL certificate errors

```bash
# Re-obtain certificates
docker-compose -f docker-compose.production.yml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@sidra.sd \
  --agree-tos \
  --force-renewal \
  -d staging.sidra.sd \
  -d api-staging.sidra.sd \
  -d meet-staging.sidra.sd

# Restart nginx
docker-compose -f docker-compose.production.yml restart nginx
```

---

## Cleanup (After Production Deployment)

Once Jitsi is successfully deployed to production and stable, you can remove staging to free up resources:

```bash
# WARNING: This deletes all staging data!
./scripts/deploy-staging.sh clean
```

Or keep staging for future feature testing (recommended).

---

## Summary Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Setup staging environment | 1 hour | Ready to start |
| Copy database and verify | 30 mins | Ready to start |
| Integrate Jitsi code | 1-2 weeks | Development |
| Test on staging | 1-2 weeks | QA |
| Deploy to production (flag off) | 1 hour | Deployment |
| Pilot with 10-20 teachers | 1-2 weeks | Monitoring |
| Gradual rollout to all | 2-4 weeks | Scaling |
| **Total** | **6-10 weeks** | **Complete** |

---

## Support

If you encounter issues:

1. Check the logs: `./scripts/deploy-staging.sh logs`
2. Check resource usage: `docker stats`
3. Review this guide's troubleshooting section
4. Check Jitsi documentation: https://jitsi.github.io/handbook/

---

## Next Steps

You're now ready to:
1. ✅ Complete `.env.staging` configuration
2. ✅ Set up DNS records
3. ✅ Run `./scripts/deploy-staging.sh setup`
4. ✅ Start integrating Jitsi!

Good luck! 🚀
