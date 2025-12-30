# Railway Dual Environment Setup Plan

## Overview

This plan outlines the steps to set up two completely isolated Railway environments for Sidra:
- **Staging**: For testing and QA
- **Production**: For live users

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         GitHub Repository                            │
│                         (smtoot/Sidra-Ai)                           │
├─────────────────────────────┬───────────────────────────────────────┤
│         develop branch      │           main branch                 │
│              │              │               │                       │
│              ▼              │               ▼                       │
├─────────────────────────────┼───────────────────────────────────────┤
│    STAGING PROJECT          │      PRODUCTION PROJECT               │
│    (sidra-staging)          │      (sidra-production)               │
├─────────────────────────────┼───────────────────────────────────────┤
│                             │                                       │
│  ┌─────────────────────┐    │    ┌─────────────────────┐           │
│  │   Staging API       │    │    │   Production API    │           │
│  │   (NestJS)          │    │    │   (NestJS)          │           │
│  │                     │    │    │                     │           │
│  │ api-staging.sidra.  │    │    │ api.sidra.sd        │           │
│  │ sd                   │    │    │                     │           │
│  └──────────┬──────────┘    │    └──────────┬──────────┘           │
│             │               │               │                       │
│  ┌──────────▼──────────┐    │    ┌──────────▼──────────┐           │
│  │   Staging DB        │    │    │   Production DB     │           │
│  │   (PostgreSQL)      │    │    │   (PostgreSQL)      │           │
│  │                     │    │    │                     │           │
│  │   Test data only    │    │    │   Real user data    │           │
│  └─────────────────────┘    │    └─────────────────────┘           │
│                             │                                       │
│  ┌─────────────────────┐    │    ┌─────────────────────┐           │
│  │   Staging Web       │    │    │   Production Web    │           │
│  │   (Next.js)         │    │    │   (Next.js)         │           │
│  │                     │    │    │                     │           │
│  │ staging.sidra.sd    │    │    │ www.sidra.sd        │           │
│  └─────────────────────┘    │    └─────────────────────┘           │
│                             │                                       │
└─────────────────────────────┴───────────────────────────────────────┘
```

## Phase 1: Git Branch Setup

### Step 1.1: Create develop branch
```bash
# Create and push develop branch from current main
git checkout main
git pull origin main
git checkout -b develop
git push -u origin develop
```

### Step 1.2: Configure branch protection rules (GitHub)
1. Go to GitHub → Settings → Branches
2. Add rule for `main`:
   - Require pull request before merging
   - Require status checks to pass
   - Require branches to be up to date
3. Add rule for `develop`:
   - Require status checks to pass (optional, less strict)

## Phase 2: Rename Current Project to Staging

### Step 2.1: Rename in Railway
1. Go to Railway dashboard → cozy-expression project
2. Click Settings (top right)
3. Change project name to: `sidra-staging`
4. Update environment name to: `staging`

### Step 2.2: Configure staging branch deployment
1. Go to each service (Sidra-Ai, perfect-youthfulness)
2. Settings → Source
3. Change branch from `main` to `develop`

### Step 2.3: Update staging environment variables
Add/verify these variables for staging identification:

**API Service:**
```
NODE_ENV=staging
APP_ENV=staging
ALLOWED_ORIGINS=https://staging.sidra.sd,http://localhost:3000
```

**Web Service:**
```
NEXT_PUBLIC_API_URL=https://[staging-api-url].railway.app
NEXT_PUBLIC_ENV=staging
```

## Phase 3: Create Production Project

### Step 3.1: Create new Railway project
1. Go to Railway dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose `smtoot/Sidra-Ai`
5. Name the project: `sidra-production`

### Step 3.2: Add PostgreSQL database
1. Click "+ New" in the project
2. Select "Database" → "PostgreSQL"
3. Wait for provisioning

### Step 3.3: Add API service
1. Click "+ New" → "GitHub Repo"
2. Select `smtoot/Sidra-Ai`
3. Configure:
   - **Service name**: `sidra-api`
   - **Root directory**: `/`
   - **Branch**: `main`
   - **Builder**: Dockerfile
   - **Dockerfile path**: `Dockerfile.api`
   - **Watch patterns**: `apps/api/**`, `packages/**`, `Dockerfile.api`

### Step 3.4: Add Web service
1. Click "+ New" → "GitHub Repo"
2. Select `smtoot/Sidra-Ai`
3. Configure:
   - **Service name**: `sidra-web`
   - **Root directory**: `/`
   - **Branch**: `main`
   - **Builder**: Nixpacks
   - **Watch patterns**: `apps/web/**`, `packages/shared/**`

### Step 3.5: Configure environment variables

**PostgreSQL** (auto-generated, note these down):
- `DATABASE_URL`
- `PGHOST`
- `PGPORT`
- `PGUSER`
- `PGPASSWORD`
- `PGDATABASE`

**API Service** (copy from staging, update values):
```
# Database
DATABASE_URL=${{Postgres.DATABASE_URL}}

# App Config
NODE_ENV=production
APP_ENV=production
PORT=3001

# Security
JWT_SECRET=[GENERATE_NEW_SECURE_SECRET]
JWT_EXPIRATION=7d
ENCRYPTION_KEY=[GENERATE_NEW_32_CHAR_KEY]

# CORS
ALLOWED_ORIGINS=https://sidra.sd,https://www.sidra.sd

# Email (SendGrid)
SENDGRID_API_KEY=[PRODUCTION_SENDGRID_KEY]
SENDGRID_FROM_EMAIL=noreply@sidra.sd

# Storage (Cloudflare R2)
R2_ACCESS_KEY_ID=[PRODUCTION_R2_KEY]
R2_SECRET_ACCESS_KEY=[PRODUCTION_R2_SECRET]
R2_BUCKET_NAME=sidra-production
R2_ENDPOINT=[R2_ENDPOINT]
R2_PUBLIC_URL=[R2_PUBLIC_URL]

# Admin
ADMIN_PHONE=[ADMIN_PHONE]
ADMIN_PASSWORD=[SECURE_ADMIN_PASSWORD]
```

**Web Service**:
```
NEXT_PUBLIC_API_URL=https://api.sidra.sd
NEXT_PUBLIC_ENV=production
```

## Phase 4: Custom Domain Setup

### Step 4.1: DNS Configuration (at your domain registrar)

Add these DNS records for `sidra.sd`:

| Type  | Name    | Value                                    | TTL  |
|-------|---------|------------------------------------------|------|
| CNAME | api     | [production-api].up.railway.app          | 3600 |
| CNAME | www     | [production-web].up.railway.app          | 3600 |
| CNAME | @       | [production-web].up.railway.app          | 3600 |
| CNAME | staging | [staging-web].up.railway.app             | 3600 |
| CNAME | api-staging | [staging-api].up.railway.app         | 3600 |

### Step 4.2: Add domains in Railway

**Production API**:
1. Service → Settings → Domains
2. Add custom domain: `api.sidra.sd`

**Production Web**:
1. Service → Settings → Domains
2. Add custom domains: `sidra.sd`, `www.sidra.sd`

**Staging API**:
1. Service → Settings → Domains
2. Add custom domain: `api-staging.sidra.sd`

**Staging Web**:
1. Service → Settings → Domains
2. Add custom domain: `staging.sidra.sd`

## Phase 5: Security Considerations

### Step 5.1: Generate new secrets for production
```bash
# Generate JWT secret (run locally)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate encryption key (32 characters)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### Step 5.2: Cloudflare R2 Bucket Setup (Detailed)

You need **two separate R2 buckets** for complete environment isolation:

#### Current State
- Existing bucket: `sidra-production` (currently used by staging Railway)

#### Required Setup

**Option A: Rename existing bucket approach**
1. Keep `sidra-production` bucket for actual production
2. Create new bucket `sidra-staging` for staging environment
3. Update staging Railway to use `sidra-staging`

**Option B: Create fresh production bucket**
1. Rename/treat existing `sidra-production` as staging
2. Create new bucket for production

#### Step-by-Step R2 Setup

**1. Create staging bucket in Cloudflare:**
```
Bucket name: sidra-staging
Location: Auto (or same region as production)
```

**2. Create R2 API Token for Staging:**
1. Go to Cloudflare Dashboard → R2 → Manage R2 API Tokens
2. Create new token:
   - Name: `sidra-staging-api`
   - Permissions: Object Read & Write
   - Specify bucket: `sidra-staging`
3. Save the Access Key ID and Secret Access Key

**3. Create R2 API Token for Production:**
1. Create another token:
   - Name: `sidra-production-api`
   - Permissions: Object Read & Write
   - Specify bucket: `sidra-production`
2. Save the Access Key ID and Secret Access Key

**4. Environment Variables for Each Environment:**

**Staging Railway (`sidra-staging` project):**
```
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=staging-access-key-id
R2_SECRET_ACCESS_KEY=staging-secret-access-key
R2_BUCKET_NAME=sidra-staging
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://staging-pub-xxx.r2.dev  # If using public bucket
```

**Production Railway (`sidra-production` project):**
```
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=production-access-key-id
R2_SECRET_ACCESS_KEY=production-secret-access-key
R2_BUCKET_NAME=sidra-production
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://production-pub-xxx.r2.dev  # If using public bucket
```

#### R2 Bucket Summary

| Setting | Staging | Production |
|---------|---------|------------|
| Bucket Name | `sidra-staging` | `sidra-production` |
| API Token Name | `sidra-staging-api` | `sidra-production-api` |
| Data | Test files, can be cleared | Real user files, protected |
| Public Access | Optional | As needed |

#### Important Notes:
- **Never share API keys** between environments
- **Staging data can be deleted** periodically for cleanup
- **Production data must be backed up** (consider R2 lifecycle rules)
- Each bucket has separate access keys for security isolation

### Step 5.3: Separate SendGrid configurations (optional)
- Consider separate SendGrid accounts or subusers for staging vs production
- Staging can use sandbox mode to prevent real emails

## Phase 6: Deployment Workflow

### Daily Development Workflow
```
1. Create feature branch from develop
   git checkout develop
   git checkout -b feature/new-feature

2. Develop and test locally
   npm run dev

3. Push and create PR to develop
   git push origin feature/new-feature
   # Create PR: feature/new-feature → develop

4. Merge to develop → Auto-deploys to STAGING
   # Test on staging.sidra.sd

5. When ready for production, create PR: develop → main
   # Requires review and approval

6. Merge to main → Auto-deploys to PRODUCTION
```

### Hotfix Workflow (urgent production fixes)
```
1. Create hotfix branch from main
   git checkout main
   git checkout -b hotfix/critical-fix

2. Fix and test

3. Create PR directly to main
   # Emergency review and merge

4. After production deploy, merge main back to develop
   git checkout develop
   git merge main
   git push origin develop
```

## Phase 7: Monitoring & Alerts

### Step 7.1: Set up Railway observability
- Enable metrics for both projects
- Set up alerts for:
  - Service down
  - High error rates
  - Database connection issues

### Step 7.2: Health check endpoints
Both environments already have:
- API: `/health` endpoint
- Web: `/` as healthcheck

## Implementation Checklist

### Phase 1: Git Setup
- [ ] Create `develop` branch
- [ ] Push `develop` to GitHub
- [ ] Configure branch protection for `main`
- [ ] Configure branch protection for `develop` (optional)

### Phase 2: Rename Staging
- [ ] Rename Railway project to `sidra-staging`
- [ ] Change API service to watch `develop` branch
- [ ] Change Web service to watch `develop` branch
- [ ] Update staging environment variables
- [ ] Verify staging deployment works

### Phase 3: Create Production
- [ ] Create new Railway project `sidra-production`
- [ ] Add PostgreSQL database
- [ ] Add API service (watching `main`)
- [ ] Add Web service (watching `main`)
- [ ] Configure all environment variables
- [ ] Generate new secrets for production
- [ ] Verify production deployment works

### Phase 4: Domains
- [ ] Add DNS records for production domains
- [ ] Add DNS records for staging domains
- [ ] Configure custom domains in Railway (production)
- [ ] Configure custom domains in Railway (staging)
- [ ] Verify SSL certificates are issued

### Phase 5: Security & R2 Storage
- [ ] Verify unique JWT_SECRET for production
- [ ] Verify unique ENCRYPTION_KEY for production
- [ ] Create `sidra-staging` R2 bucket in Cloudflare
- [ ] Create R2 API token for staging bucket
- [ ] Create R2 API token for production bucket (if new)
- [ ] Update staging Railway with staging R2 credentials
- [ ] Configure production Railway with production R2 credentials
- [ ] Update CORS settings for both environments
- [ ] Verify file uploads work on staging
- [ ] Verify file uploads work on production

### Phase 6: Testing
- [ ] Test staging deployment (push to develop)
- [ ] Test production deployment (push to main)
- [ ] Verify database migrations run correctly
- [ ] Test API health endpoints on both environments
- [ ] Test Web apps on both environments

### Phase 7: Documentation
- [ ] Document environment URLs in README
- [ ] Document deployment workflow for team
- [ ] Document environment variable requirements

## Final Environment Summary

| Item | Staging | Production |
|------|---------|------------|
| Railway Project | sidra-staging | sidra-production |
| Git Branch | develop | main |
| API URL | api-staging.sidra.sd | api.sidra.sd |
| Web URL | staging.sidra.sd | sidra.sd / www.sidra.sd |
| Database | Isolated staging DB | Isolated production DB |
| R2 Bucket | sidra-staging | sidra-production |
| Auto-deploy | Yes (on develop push) | Yes (on main push) |

## Cost Estimate

Railway pricing (approximate):
- **Staging**: ~$5-10/month (lower resources)
- **Production**: ~$10-20/month (standard resources)
- **Total**: ~$15-30/month

Note: Costs depend on usage. Railway's hobby plan may cover staging; production may need Pro plan for reliability.
