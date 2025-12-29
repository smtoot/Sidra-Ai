# Railway Deployment Plan - Sidra Platform

**Date:** December 30, 2024
**Status:** Planning
**Repository:** https://github.com/smtoot/Sidra-Ai.git
**Domain:** sidra.sd

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture on Railway](#architecture-on-railway)
3. [Environment Strategy](#environment-strategy)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Railway Project Setup](#railway-project-setup)
6. [Configuration Files Needed](#configuration-files-needed)
7. [Environment Variables](#environment-variables)
8. [Database Management](#database-management)
9. [File Storage Strategy](#file-storage-strategy)
10. [Domain & SSL Setup](#domain--ssl-setup)
11. [Monitoring & Logging](#monitoring--logging)
12. [Development Workflow](#development-workflow)
13. [Cost Estimation](#cost-estimation)
14. [Implementation Checklist](#implementation-checklist)

---

## Overview

### What We're Deploying

| Component | Technology | Railway Service Type |
|-----------|------------|---------------------|
| **API** | NestJS 11 | Web Service |
| **Web** | Next.js 16 | Web Service |
| **Database** | PostgreSQL 15 | Railway Postgres |
| **File Storage** | Cloudflare R2 | External (S3-compatible) |
| **Email** | SendGrid | External (not Railway) |

### Goals

1. **Continuous Deployment** - Push to GitHub → Auto-deploy to Railway
2. **Environment Separation** - Staging for testing, Production for users
3. **Zero-Downtime Deploys** - Users never see downtime
4. **Easy Rollbacks** - One-click revert if something breaks

---

## Architecture on Railway

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Railway Project: sidra-staging                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐   │
│   │   PostgreSQL    │    │    API Service   │    │   Web Service   │   │
│   │   (Database)    │◄───│    (NestJS)      │    │   (Next.js)     │   │
│   │                 │    │                  │    │                 │   │
│   │  sidra_staging  │    │  Port: 4000      │    │  Port: 3000     │   │
│   └─────────────────┘    └─────────────────┘    └─────────────────┘   │
│           │                      │                      │             │
│           │              ┌───────┴───────┐              │             │
│           │              │   Internal    │              │             │
│           └──────────────│   Network     │──────────────┘             │
│                          └───────────────┘                            │
│                                                                         │
│   External Services:                                                    │
│   • Cloudflare R2 (file uploads)                                       │
│   • SendGrid (emails)                                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                       Railway Project: sidra-production                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   (Same structure as staging, different environment variables)          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Environment Strategy

### Three Environments

| Environment | Branch | Auto-Deploy | Purpose |
|-------------|--------|-------------|---------|
| **Local** | Any | No | Development on your machine |
| **Staging** | `develop` or `main` | Yes | Testing before production |
| **Production** | `main` (manual promote) | Manual | Live users |

### Recommended Branch Strategy

```
feature/xyz ──► develop ──► main
                  │           │
                  ▼           ▼
              [Staging]   [Production]
              Auto-deploy  Manual deploy
```

**Workflow:**
1. Develop on feature branches
2. Merge to `develop` → Auto-deploys to staging
3. Test on staging
4. Merge to `main` → Manually promote to production (or auto-deploy if confident)

---

## CI/CD Pipeline

### GitHub → Railway Connection

Railway connects directly to your GitHub repository. No GitHub Actions needed for basic deployment.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   VS Code    │     │    GitHub    │     │   Railway    │
│  (Claude)    │────►│   Repository │────►│   Deploy     │
│              │push │              │webhook│             │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │   Railway    │
                     │   Builds     │
                     │   & Deploys  │
                     └──────────────┘
```

### How It Works

1. **You push code** to GitHub (from Claude Code or any tool)
2. **Railway detects** the push via webhook
3. **Railway builds** your app using Nixpacks (auto-detected)
4. **Railway deploys** with zero-downtime (blue-green)
5. **Health check** confirms app is running
6. **Traffic shifts** to new version

### GitHub Actions for Testing (Required)

Tests run automatically before Railway deploys. If tests fail, deployment is blocked.

**See:** `.github/workflows/ci.yml` (created separately)

---

## Railway Project Setup

### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub (recommended for easy repo access)
3. Verify your account

### Step 2: Create Projects

Create two separate Railway projects:

| Project Name | Purpose | Branch Trigger |
|--------------|---------|----------------|
| `sidra-staging` | Testing environment | `develop` or `main` |
| `sidra-production` | Live environment | `main` (manual) |

### Step 3: Add Services to Each Project

For each project, add these services:

#### 3.1 PostgreSQL Database

1. Click **"New"** → **"Database"** → **"PostgreSQL"**
2. Railway provisions a managed PostgreSQL instance
3. Copy the `DATABASE_URL` from the service variables

#### 3.2 API Service (NestJS)

1. Click **"New"** → **"GitHub Repo"**
2. Select `smtoot/Sidra-Ai`
3. Configure:
   - **Root Directory:** `apps/api`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm run start:prod`
4. Add environment variables (see [Environment Variables](#environment-variables))

#### 3.3 Web Service (Next.js)

1. Click **"New"** → **"GitHub Repo"**
2. Select `smtoot/Sidra-Ai`
3. Configure:
   - **Root Directory:** `apps/web`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm run start`
4. Add environment variables

### Step 4: Link Services

Railway automatically creates an internal network. Use Railway's variable references:

```
# In API service, reference the database:
DATABASE_URL=${{Postgres.DATABASE_URL}}

# In Web service, reference the API:
NEXT_PUBLIC_API_URL=${{API.RAILWAY_PUBLIC_DOMAIN}}
```

---

## Configuration Files Needed

### 1. Railway Configuration (railway.json)

Create in the root of your project:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 2. API Nixpacks Configuration (apps/api/nixpacks.toml)

```toml
[phases.setup]
nixPkgs = ["nodejs_20", "npm"]

[phases.install]
cmds = [
  "cd ../.. && npm ci",
  "cd ../../packages/database && npx prisma generate"
]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npx prisma migrate deploy --schema=../../packages/database/prisma/schema.prisma && npm run start:prod"
```

### 3. Web Nixpacks Configuration (apps/web/nixpacks.toml)

```toml
[phases.setup]
nixPkgs = ["nodejs_20", "npm"]

[phases.install]
cmds = ["cd ../.. && npm ci"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm run start"
```

### 4. Alternative: Procfile (simpler approach)

**apps/api/Procfile:**
```
web: npx prisma migrate deploy --schema=../../packages/database/prisma/schema.prisma && npm run start:prod
```

**apps/web/Procfile:**
```
web: npm run start
```

---

## Environment Variables

### API Service Variables

| Variable | Staging Value | Production Value |
|----------|---------------|------------------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | `${{Postgres.DATABASE_URL}}` |
| `PORT` | `4000` | `4000` |
| `JWT_SECRET` | Generate unique | Generate unique (different!) |
| `ALLOWED_ORIGINS` | `https://staging.sidra.sd` | `https://app.sidra.sd` |
| `NODE_ENV` | `production` | `production` |
| `SENDGRID_API_KEY` | Your key | Your key |
| `R2_ACCOUNT_ID` | Your Cloudflare account ID | Your Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | Your R2 access key | Your R2 access key |
| `R2_SECRET_ACCESS_KEY` | Your R2 secret | Your R2 secret |
| `R2_BUCKET_NAME` | `sidra-staging` | `sidra-production` |
| `R2_PUBLIC_URL` | `https://uploads-staging.sidra.sd` | `https://uploads.sidra.sd` |

### Web Service Variables

| Variable | Staging Value | Production Value |
|----------|---------------|------------------|
| `NEXT_PUBLIC_API_URL` | `https://api-staging.sidra.sd` | `https://api.sidra.sd` |
| `PORT` | `3000` | `3000` |
| `NODE_ENV` | `production` | `production` |

### Generating JWT Secret

Run this command to generate a strong secret:

```bash
openssl rand -base64 64
```

**Important:** Use DIFFERENT secrets for staging and production!

---

## Database Management

### Migrations Strategy

Migrations run automatically on each deploy via the start command:

```bash
npx prisma migrate deploy
```

This applies any pending migrations from `packages/database/prisma/migrations/`.

### Seeding

For staging, you may want to seed demo data. Add a post-deploy script:

```bash
# After first deploy, run manually via Railway CLI:
railway run --service api -- npx prisma db seed
```

### Backups

Railway PostgreSQL includes:
- **Daily automatic backups** (retained for 7 days on Pro plan)
- **Point-in-time recovery** (Pro plan)
- **Manual snapshots** available

### Connecting to Database Locally

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Connect to database
railway connect postgres
```

---

## File Storage Strategy

### Cloudflare R2 Setup

We use **Cloudflare R2** instead of AWS S3 because:
- **Free tier:** 10GB storage + 10 million reads/month
- **No egress fees:** AWS charges for downloads, R2 doesn't
- **S3-compatible:** Your existing AWS SDK code works with minor config changes
- **Global CDN:** Built-in Cloudflare edge caching

#### 1. Create Cloudflare Account

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Sign up (free account works)
3. Navigate to **R2** in the sidebar

#### 2. Create R2 Buckets

| Bucket Name | Purpose | Public Access |
|-------------|---------|---------------|
| `sidra-staging` | Staging files | Via custom domain |
| `sidra-production` | Production files | Via custom domain |

#### 3. Create R2 API Token

1. Go to **R2** → **Manage R2 API Tokens**
2. Click **Create API Token**
3. Permissions: **Object Read & Write**
4. Specify bucket (or all buckets)
5. Save the **Access Key ID** and **Secret Access Key**

#### 4. Configure Custom Domain (Optional but Recommended)

1. In R2 bucket settings → **Custom Domains**
2. Add: `uploads.sidra.sd` (production) or `uploads-staging.sidra.sd` (staging)
3. Cloudflare handles SSL automatically

#### 5. CORS Configuration

In R2 bucket → **Settings** → **CORS Policy**:

```json
[
  {
    "AllowedOrigins": [
      "https://app.sidra.sd",
      "https://staging.sidra.sd",
      "http://localhost:3002"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

#### 6. Code Changes Required

Your existing AWS SDK code needs minimal changes. Update the S3 client configuration:

```typescript
// Before (AWS S3)
import { S3Client } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
});

// After (Cloudflare R2)
import { S3Client } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
```

#### 7. R2 Free Tier Limits

| Resource | Free Limit | Notes |
|----------|------------|-------|
| Storage | 10 GB | Per month |
| Class A ops (writes) | 1 million | PUT, POST, LIST |
| Class B ops (reads) | 10 million | GET, HEAD |
| Egress | Unlimited | No bandwidth charges! |

This is more than enough for starting out.

---

## Domain & SSL Setup

### Domain Structure for sidra.sd

| Subdomain | Environment | Service |
|-----------|-------------|---------|
| `app.sidra.sd` | Production | Web (Next.js) |
| `api.sidra.sd` | Production | API (NestJS) |
| `staging.sidra.sd` | Staging | Web (Next.js) |
| `api-staging.sidra.sd` | Staging | API (NestJS) |
| `uploads.sidra.sd` | Production | Cloudflare R2 |
| `uploads-staging.sidra.sd` | Staging | Cloudflare R2 |

### Railway Default Domains (Fallback)

Each service gets a free subdomain (use during initial setup):
- API: `sidra-api.up.railway.app`
- Web: `sidra-web.up.railway.app`

### Custom Domain Setup

#### Step 1: In Railway Dashboard

For each service:
1. Go to **Service Settings** → **Domains**
2. Click **Add Custom Domain**
3. Enter your subdomain (e.g., `app.sidra.sd`)
4. Railway provides a CNAME target

#### Step 2: DNS Configuration

Add these records in your DNS provider (where sidra.sd is registered):

```
# Production Web
Type: CNAME
Name: app
Value: [Railway provides this value]
TTL: Auto

# Production API
Type: CNAME
Name: api
Value: [Railway provides this value]
TTL: Auto

# Staging Web
Type: CNAME
Name: staging
Value: [Railway provides this value]
TTL: Auto

# Staging API
Type: CNAME
Name: api-staging
Value: [Railway provides this value]
TTL: Auto
```

#### Step 3: SSL Certificates

Railway automatically provisions SSL certificates via Let's Encrypt once DNS propagates (usually 5-30 minutes).

---

## Monitoring & Logging

### Built-in Railway Features

- **Logs:** Real-time log streaming in dashboard
- **Metrics:** CPU, Memory, Network graphs
- **Deploys:** History with one-click rollback
- **Alerts:** Email notifications for deploy failures

### Recommended Additions

#### 1. Health Check Endpoint

Add to API (`apps/api/src/health/health.controller.ts`):

```typescript
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @Public()
  async check() {
    // Check database connection
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  }
}
```

Configure in Railway: **Settings → Health Check Path:** `/health`

#### 2. Error Tracking (Optional)

Consider adding Sentry for error tracking:

```bash
npm install @sentry/node @sentry/nestjs
```

---

## Development Workflow

### Daily Workflow with Claude Code

```
┌─────────────────────────────────────────────────────────────────┐
│                    Your Development Flow                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. LOCAL DEVELOPMENT                                           │
│     ┌─────────────────────────────────────────────────────┐    │
│     │  VS Code + Claude Code                              │    │
│     │  • npm run dev (runs API + Web locally)             │    │
│     │  • Local PostgreSQL via Docker                      │    │
│     │  • Test changes immediately                         │    │
│     └─────────────────────────────────────────────────────┘    │
│                          │                                      │
│                          ▼                                      │
│  2. COMMIT & PUSH                                               │
│     ┌─────────────────────────────────────────────────────┐    │
│     │  git add . && git commit -m "feat: ..."             │    │
│     │  git push origin develop                            │    │
│     └─────────────────────────────────────────────────────┘    │
│                          │                                      │
│                          ▼                                      │
│  3. AUTO-DEPLOY TO STAGING                                      │
│     ┌─────────────────────────────────────────────────────┐    │
│     │  Railway detects push → Builds → Deploys            │    │
│     │  ~2-5 minutes                                       │    │
│     │  URL: https://staging.sidra.sd                      │    │
│     └─────────────────────────────────────────────────────┘    │
│                          │                                      │
│                          ▼                                      │
│  4. TEST ON STAGING                                             │
│     ┌─────────────────────────────────────────────────────┐    │
│     │  • Verify feature works                             │    │
│     │  • Check logs in Railway dashboard                  │    │
│     │  • Test with real database                          │    │
│     └─────────────────────────────────────────────────────┘    │
│                          │                                      │
│                          ▼                                      │
│  5. PROMOTE TO PRODUCTION                                       │
│     ┌─────────────────────────────────────────────────────┐    │
│     │  git checkout main                                  │    │
│     │  git merge develop                                  │    │
│     │  git push origin main                               │    │
│     │  OR: Use Railway dashboard to promote               │    │
│     └─────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Quick Commands Reference

```bash
# Start local development
npm run dev

# Check local database
cd packages/database && npx prisma studio

# Push to staging (auto-deploys)
git add . && git commit -m "feat: your feature" && git push origin develop

# View Railway logs
railway logs --service api

# Connect to staging database
railway connect postgres

# Run migrations manually on Railway
railway run --service api -- npx prisma migrate deploy

# Rollback last deploy (in Railway dashboard or CLI)
railway rollback --service api
```

### Feature Development Example

```bash
# 1. Start from develop branch
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/vacation-mode

# 3. Develop with Claude Code
# ... make changes ...

# 4. Test locally
npm run dev

# 5. Commit and push to feature branch
git add .
git commit -m "feat: implement vacation mode for teachers"
git push origin feature/vacation-mode

# 6. Create PR: feature/vacation-mode → develop
# (Railway doesn't deploy feature branches by default)

# 7. Merge PR → Auto-deploys to staging

# 8. Test on staging
# https://staging.sidra.sd

# 9. When ready, merge develop → main
git checkout main
git merge develop
git push origin main
# → Deploys to production
```

---

## Cost Estimation

### Railway Pricing (as of 2024)

| Plan | Price | What You Get |
|------|-------|--------------|
| **Hobby** | $5/mo | 512MB RAM, 1 vCPU per service |
| **Pro** | $20/mo + usage | Unlimited resources, team features |

### Estimated Monthly Costs (Staging + Production)

| Resource | Staging | Production | Total |
|----------|---------|------------|-------|
| PostgreSQL (2 instances) | ~$5 | ~$10 | ~$15 |
| API Service (2 instances) | ~$5 | ~$15 | ~$20 |
| Web Service (2 instances) | ~$5 | ~$15 | ~$20 |
| Network egress | ~$2 | ~$5 | ~$7 |
| **Subtotal Railway** | ~$17 | ~$45 | **~$62/mo** |

### External Services

| Service | Cost |
|---------|------|
| Cloudflare R2 | **FREE** (10GB storage, unlimited egress) |
| SendGrid | Free tier (100 emails/day) or $15/mo |
| Domain (sidra.sd) | Already owned |
| **Total External** | **~$0-15/mo** |

### Total Estimated Cost

| Environment | Monthly Cost |
|-------------|--------------|
| Staging only | ~$20-25/mo |
| Staging + Production | ~$60-80/mo |

**Note:** Costs are lower than AWS-based setups because:
- Cloudflare R2 is free (vs ~$10/mo for S3)
- No egress fees for file downloads

---

## Implementation Checklist

### Phase 1: Preparation (Before Railway)

- [ ] Generate JWT secrets (one for staging, one for production)
- [ ] Create Cloudflare account and R2 buckets
- [ ] Create SendGrid account and verify sender
- [ ] Verify DNS access for sidra.sd
- [ ] Create `railway.json` in project root
- [ ] Create `nixpacks.toml` files for API and Web
- [ ] Create `.github/workflows/ci.yml` for testing
- [ ] Add health check endpoint to API
- [ ] Push all changes to GitHub

### Phase 2: Staging Setup

- [ ] Create Railway account (sign up with GitHub)
- [ ] Create `sidra-staging` project
- [ ] Add PostgreSQL database
- [ ] Add API service (connect to GitHub, set root directory)
- [ ] Configure API environment variables
- [ ] Add Web service
- [ ] Configure Web environment variables
- [ ] Verify services are linked (internal network)
- [ ] Test deployment
- [ ] Run database seed (optional)

### Phase 3: Production Setup

- [ ] Create `sidra-production` project
- [ ] Add PostgreSQL database
- [ ] Add API service
- [ ] Configure API environment variables (different JWT!)
- [ ] Add Web service
- [ ] Configure Web environment variables
- [ ] Add custom domains (app.sidra.sd, api.sidra.sd)
- [ ] Configure DNS records in sidra.sd provider
- [ ] Verify SSL certificates

### Phase 4: CI/CD Setup

- [ ] Configure branch triggers (develop → staging, main → production)
- [ ] Verify GitHub Actions runs tests on push
- [ ] Test full workflow: push → tests pass → deploy
- [ ] Test failure case: push → tests fail → no deploy
- [ ] Verify rollback works
- [ ] Document workflow for team

### Phase 5: Monitoring & Maintenance

- [ ] Set up Railway alerts (deploy failures)
- [ ] Add Sentry for error tracking (optional)
- [ ] Document backup procedures
- [ ] Create runbook for common issues
- [ ] Set up uptime monitoring (optional: UptimeRobot, Checkly)

---

## Quick Start Commands

Once everything is set up, here are the commands you'll use most:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to staging project
railway link sidra-staging

# View logs
railway logs --service api
railway logs --service web

# Run command on Railway
railway run --service api -- npx prisma migrate status

# Open Railway dashboard
railway open

# Switch to production project
railway link sidra-production
```

---

## Support Resources

- **Railway Docs:** https://docs.railway.app
- **Railway Discord:** https://discord.gg/railway
- **Prisma + Railway:** https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-railway
- **Next.js on Railway:** https://docs.railway.app/guides/nextjs

---

## Next Steps

1. **Review this plan** and ask any questions
2. **Prepare external services** (AWS S3, SendGrid, domain)
3. **Let me know when ready** and I'll help you:
   - Create the configuration files
   - Set up the Railway projects step by step
   - Configure everything correctly

Would you like me to start creating the configuration files?
