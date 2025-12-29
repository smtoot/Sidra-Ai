# Railway Deployment Plan - Sidra Platform

**Date:** December 30, 2024
**Status:** Ready for Implementation
**Repository:** https://github.com/smtoot/Sidra-Ai.git
**Domain:** sidra.sd (to be configured later)

---

## Current Status

| Item | Status |
|------|--------|
| Railway account | ✅ Created |
| Cloudflare account | ✅ Created |
| Cloudflare R2 | ✅ Integrated & Working |
| GitHub Actions CI | ✅ Created |
| Railway config files | ✅ Created |
| Health check endpoint | ✅ Exists |
| DNS for sidra.sd | ⏳ Pending |

---

## Deployment Strategy

We will deploy in **two phases**:

### Phase A: Deploy with Railway Default Domains (NOW)
- Use `*.up.railway.app` domains
- Test everything works
- No DNS required

### Phase B: Add Custom Domains (LATER)
- Configure DNS for sidra.sd
- Add custom domains in Railway
- Update environment variables

---

## Phase A: Step-by-Step Deployment Guide

### Prerequisites Checklist

Before starting, ensure you have:

- [x] Railway account (signed up with GitHub)
- [x] Cloudflare R2 credentials (already working)
- [x] GitHub repository accessible
- [ ] JWT secrets generated (do this now)

### Step 0: Generate JWT Secrets

Run this command **twice** and save both secrets securely:

```bash
openssl rand -base64 64
```

Save as:
- **Staging JWT:** `_________________________________`
- **Production JWT:** `_________________________________`

**IMPORTANT:** Use different secrets for staging and production!

---

### Step 1: Push Configuration Files to GitHub

First, commit and push the Railway configuration files:

```bash
cd /Users/omerheathrow/Sidra-Ai

# Check what files are ready to commit
git status

# Add the new configuration files
git add railway.json
git add apps/api/nixpacks.toml
git add apps/web/nixpacks.toml
git add .github/workflows/ci.yml

# Commit
git commit -m "chore: add Railway deployment configuration

- Add railway.json for Railway build settings
- Add nixpacks.toml for API and Web services
- Update CI workflow for testing before deploy"

# Push to main branch
git push origin main
```

---

### Step 2: Create Staging Project in Railway

1. Go to [railway.app](https://railway.app) and log in
2. Click **"New Project"**
3. Select **"Empty Project"**
4. Click on the project name and rename it to: **`sidra-staging`**

---

### Step 3: Add PostgreSQL Database

1. In your `sidra-staging` project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Wait for it to provision (takes ~30 seconds)
4. Click on the PostgreSQL service
5. Go to **"Variables"** tab
6. Note the `DATABASE_URL` - Railway will auto-inject this

---

### Step 4: Add API Service

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your repository: `smtoot/Sidra-Ai`
3. Railway will detect the monorepo

**Configure the service:**

4. Click on the new service
5. Go to **"Settings"** tab
6. Set these values:

| Setting | Value |
|---------|-------|
| **Service Name** | `api` |
| **Root Directory** | `apps/api` |
| **Watch Paths** | `apps/api/**`, `packages/**` |

7. Go to **"Variables"** tab and add these environment variables:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
PORT=4000
NODE_ENV=production
JWT_SECRET=[YOUR_STAGING_JWT_SECRET]
ALLOWED_ORIGINS=https://${{RAILWAY_PUBLIC_DOMAIN}}

# Your existing R2 credentials
R2_ACCOUNT_ID=[your-cloudflare-account-id]
R2_ACCESS_KEY_ID=[your-r2-access-key]
R2_SECRET_ACCESS_KEY=[your-r2-secret-key]
R2_BUCKET_NAME=[your-existing-bucket-name]
R2_PUBLIC_URL=[your-existing-r2-public-url]
```

8. Go to **"Settings"** → **"Networking"**
9. Click **"Generate Domain"** to get a public URL
10. Note the URL (e.g., `sidra-api-staging.up.railway.app`)

---

### Step 5: Add Web Service

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your repository: `smtoot/Sidra-Ai`

**Configure the service:**

3. Click on the new service
4. Go to **"Settings"** tab
5. Set these values:

| Setting | Value |
|---------|-------|
| **Service Name** | `web` |
| **Root Directory** | `apps/web` |
| **Watch Paths** | `apps/web/**`, `packages/**` |

6. Go to **"Variables"** tab and add:

```
PORT=3000
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://[YOUR-API-DOMAIN].up.railway.app
```

Replace `[YOUR-API-DOMAIN]` with the API domain from Step 4.

7. Go to **"Settings"** → **"Networking"**
8. Click **"Generate Domain"** to get a public URL
9. Note the URL (e.g., `sidra-web-staging.up.railway.app`)

---

### Step 6: Update API ALLOWED_ORIGINS

Now that you have the Web URL, update the API's ALLOWED_ORIGINS:

1. Go to API service → **"Variables"**
2. Update `ALLOWED_ORIGINS`:

```
ALLOWED_ORIGINS=https://[YOUR-WEB-DOMAIN].up.railway.app
```

---

### Step 7: Configure Health Check

1. Go to API service → **"Settings"**
2. Find **"Health Check Path"**
3. Set it to: `/health`
4. Set **"Health Check Timeout"**: `300` (5 minutes for initial deploy)

---

### Step 8: Deploy and Wait

Railway will automatically start deploying. Monitor the progress:

1. Click on each service
2. Go to **"Deployments"** tab
3. Watch the build logs
4. Wait for both services to show **"Active"** status

**Expected build time:** 3-7 minutes per service

---

### Step 9: Verify Deployment

Once both services are active:

**Test API Health:**
```bash
curl https://[YOUR-API-DOMAIN].up.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-12-30T...",
  "database": "connected",
  "uptime": 123.45
}
```

**Test Web App:**
Open in browser: `https://[YOUR-WEB-DOMAIN].up.railway.app`

---

### Step 10: Seed Database (Optional)

If you want demo data in staging:

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login and link:
```bash
railway login
railway link
```

3. Select your `sidra-staging` project

4. Run seed command:
```bash
railway run --service api -- npx prisma db seed
```

---

## Environment Variables Reference

### API Service (Staging)

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `PORT` | `4000` |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Your staging secret |
| `ALLOWED_ORIGINS` | `https://[web-domain].up.railway.app` |
| `R2_ACCOUNT_ID` | Your Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | Your R2 access key |
| `R2_SECRET_ACCESS_KEY` | Your R2 secret |
| `R2_BUCKET_NAME` | Your bucket name |
| `R2_PUBLIC_URL` | Your R2 public URL |

### Web Service (Staging)

| Variable | Value |
|----------|-------|
| `PORT` | `3000` |
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_API_URL` | `https://[api-domain].up.railway.app` |

---

## Phase B: Custom Domains (When DNS Ready)

When your DNS for sidra.sd is configured:

### Step 1: Add Custom Domains in Railway

**For API service:**
1. Settings → Networking → Custom Domain
2. Add: `api.sidra.sd` (production) or `api-staging.sidra.sd` (staging)

**For Web service:**
1. Settings → Networking → Custom Domain
2. Add: `app.sidra.sd` (production) or `staging.sidra.sd` (staging)

### Step 2: Configure DNS Records

Add these CNAME records in your DNS provider:

```
api-staging  CNAME  [railway-provides-this].up.railway.app
staging      CNAME  [railway-provides-this].up.railway.app
api          CNAME  [railway-provides-this].up.railway.app
app          CNAME  [railway-provides-this].up.railway.app
```

### Step 3: Update Environment Variables

Update `ALLOWED_ORIGINS` and `NEXT_PUBLIC_API_URL` to use custom domains.

### Step 4: Update R2 CORS

Add your new domains to R2 CORS configuration.

---

## Production Setup (After Staging Works)

Repeat the same steps for production:

1. Create new project: `sidra-production`
2. Add PostgreSQL
3. Add API service (same repo, same root directory)
4. Add Web service
5. Use **different JWT secret**
6. Configure domains: `api.sidra.sd`, `app.sidra.sd`

---

## Troubleshooting

### Build Fails

**Check logs:**
1. Go to service → Deployments → Click on failed deployment
2. Read the build logs

**Common issues:**
- Missing environment variables
- Wrong root directory
- Prisma client not generated

### API Can't Connect to Database

1. Verify `DATABASE_URL` uses Railway reference: `${{Postgres.DATABASE_URL}}`
2. Check PostgreSQL service is running
3. Try redeploying API service

### Web Shows "API Connection Error"

1. Verify `NEXT_PUBLIC_API_URL` is correct
2. Check API's `ALLOWED_ORIGINS` includes the web domain
3. Check API health endpoint works

### Migrations Fail

```bash
# Run migrations manually
railway run --service api -- npx prisma migrate deploy
```

---

## Cost Breakdown

### Staging Environment

| Service | Estimated Cost |
|---------|---------------|
| PostgreSQL | ~$5/month |
| API | ~$5/month |
| Web | ~$5/month |
| **Total** | **~$15-20/month** |

### Production Environment

| Service | Estimated Cost |
|---------|---------------|
| PostgreSQL | ~$10/month |
| API | ~$15/month |
| Web | ~$15/month |
| **Total** | **~$40-50/month** |

### External Services

| Service | Cost |
|---------|------|
| Cloudflare R2 | FREE |
| SendGrid | FREE (100/day) |
| **Total** | **FREE** |

---

## Quick Reference Commands

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# View logs
railway logs --service api
railway logs --service web

# Run command on service
railway run --service api -- npx prisma migrate status

# Open dashboard
railway open

# Rollback deployment
# (Use Railway dashboard - click on previous deployment → Rollback)
```

---

## CI/CD Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Your Workflow                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. You make changes in Claude Code / VS Code                   │
│                                                                 │
│  2. git push origin main                                        │
│                          │                                      │
│                          ▼                                      │
│  3. GitHub Actions runs tests                                   │
│     ┌───────────────────────────────────────┐                  │
│     │ • Lint                                │                  │
│     │ • Build                               │                  │
│     │ • API Tests (with PostgreSQL)         │                  │
│     │ • Web Build                           │                  │
│     └───────────────────────────────────────┘                  │
│                          │                                      │
│              ┌───────────┴───────────┐                         │
│              ▼                       ▼                         │
│         Tests Pass              Tests Fail                     │
│              │                       │                         │
│              ▼                       ▼                         │
│     Railway Deploys          ❌ Deployment Blocked             │
│              │                                                 │
│              ▼                                                 │
│     🎉 Live on Railway                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Next Steps After This Plan

Once you approve this plan:

1. **I will help you push the config files** to GitHub
2. **You follow the steps** in Railway dashboard
3. **I can monitor and troubleshoot** any issues

---

## Approval Checklist

Please confirm you're ready to proceed:

- [ ] I have my Cloudflare R2 credentials ready
- [ ] I will generate JWT secrets before starting
- [ ] I understand we'll use Railway default domains first
- [ ] I understand custom domains (sidra.sd) will be added later

**Ready to proceed?** Let me know and we'll start with Step 1: Push configuration files to GitHub.
