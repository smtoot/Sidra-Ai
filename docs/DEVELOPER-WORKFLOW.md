# Sidra Development Workflow Guide

> **IMPORTANT**: This document is mandatory reading for all developers working on the Sidra platform. Following these guidelines ensures code quality, prevents production incidents, and maintains environment isolation.

## Table of Contents

1. [Environment Overview](#environment-overview)
2. [Golden Rules](#golden-rules)
3. [⚠️ Database Migrations (CRITICAL)](#database-migrations-critical)
4. [Branch Strategy](#branch-strategy)
5. [Development Workflow](#development-workflow)
6. [Code Review Process](#code-review-process)
7. [Deployment Process](#deployment-process)
8. [Hotfix Procedure](#hotfix-procedure)
9. [Environment URLs](#environment-urls)
10. [Common Mistakes to Avoid](#common-mistakes-to-avoid)

---

## Environment Overview

We maintain **two completely isolated environments**:

| Environment | Purpose | Branch | Auto-Deploy |
|-------------|---------|--------|-------------|
| **Staging** | Testing, QA, development verification | `develop` | Yes |
| **Production** | Live users, real data | `main` | Yes |

### Key Principles

- **Staging** is for testing. Break things here, not in production.
- **Production** is sacred. Only tested, reviewed code goes here.
- **Never** push directly to `main`. Always go through `develop` first.
- **Never** share credentials between environments.

---

## Golden Rules

### 1. NEVER Push Directly to Main

```bash
# WRONG - Never do this
git push origin main

# CORRECT - Always push to develop first
git push origin develop
```

### 2. ALL Changes Go Through Staging First

```
Feature → develop → TEST ON STAGING → main → Production
```

No exceptions. Even "small fixes" must be tested on staging.

### 3. NEVER Bypass Code Review

All changes to `main` require:
- Pull Request from `develop`
- At least one approval
- All CI checks passing

### 4. NEVER Mix Environment Configurations

- Staging uses `sidra-staging` R2 bucket
- Production uses `sidra-production` R2 bucket
- Each environment has unique JWT secrets
- Database credentials are isolated

---

## ⚠️ Database Migrations (CRITICAL)

> **WARNING**: Incorrect database changes have caused production outages. This section is MANDATORY reading for anyone touching the Prisma schema.

### The Golden Rule of Database Changes

```
NEVER edit schema.prisma without creating a migration!
```

### What Happens When You Skip Migrations

| What You Did | What Happens |
|--------------|--------------|
| Edit `schema.prisma` and push | Code expects new column that doesn't exist |
| App tries to query the table | **CRASH** - `Column does not exist` |
| Production goes down | Users can't use the platform |

**Real example (Jan 1, 2026):** `searchConfig` was added to `SystemSettings` without a migration. Production crashed with:
```
PrismaClientKnownRequestError:
The column `system_settings.searchConfig` does not exist in the current database.
```

### Correct Workflow for Database Changes

```bash
# 1. Make your schema change
# Edit packages/database/prisma/schema.prisma

# 2. CREATE THE MIGRATION (THIS IS CRITICAL!)
cd packages/database
npx prisma migrate dev --name descriptive_name_here

# 3. Verify migration was created
ls prisma/migrations/  # Should see new folder with your migration

# 4. Commit BOTH files together
git add prisma/schema.prisma
git add prisma/migrations/
git commit -m "feat: add xyz field with migration"

# 5. Push to deploy
git push origin develop
```

### Migration Checklist

Before pushing any database change, verify:

- [ ] `schema.prisma` has your new field/table
- [ ] New migration folder exists in `prisma/migrations/`
- [ ] Migration `.sql` file contains the correct `ALTER TABLE` or `CREATE TABLE`
- [ ] Both files are committed together

### How Migrations Are Applied

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DATABASE MIGRATION DEPLOYMENT                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   1. You push code with migration file                                   │
│   2. Railway detects the push                                            │
│   3. Railway runs: npx prisma migrate deploy                             │
│   4. Migration is applied to database                                    │
│   5. App starts with correct schema                                      │
│                                                                          │
│   ⚠️  If migration file is MISSING:                                      │
│   - Step 3 does nothing (no pending migrations)                          │
│   - Step 5 crashes (code expects columns that don't exist)               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Common Database Mistakes

#### Mistake 1: Editing schema.prisma directly

**WRONG:**
```bash
# Edit schema.prisma, add a field
git add prisma/schema.prisma
git commit -m "add new field"
git push  # CRASH! No migration file!
```

**CORRECT:**
```bash
# Edit schema.prisma, add a field
npx prisma migrate dev --name add_new_field  # Creates migration
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add new field with migration"
git push  # Works! Migration is applied.
```

#### Mistake 2: Using `prisma db push` instead of `migrate dev`

**WRONG:**
```bash
npx prisma db push  # Updates local DB but NO migration file created!
```

**CORRECT:**
```bash
npx prisma migrate dev --name your_change  # Creates migration file
```

> `db push` is for prototyping only. Never use it for changes you want to deploy.

#### Mistake 3: Forgetting to commit the migration folder

**WRONG:**
```bash
git add prisma/schema.prisma
git commit -m "update schema"  # Migration folder not added!
```

**CORRECT:**
```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "update schema with migration"
```

### If You Realize You Forgot a Migration

If code is already pushed without a migration:

```bash
# 1. Create the migration locally
cd packages/database
npx prisma migrate dev --name add_missing_xyz

# 2. Or manually create migration file if prisma migrate fails
mkdir -p prisma/migrations/YYYYMMDDHHMMSS_add_xyz
echo 'ALTER TABLE "table_name" ADD COLUMN "column_name" TYPE;' > prisma/migrations/YYYYMMDDHHMMSS_add_xyz/migration.sql

# 3. Commit and push immediately
git add prisma/migrations/
git commit -m "fix: add missing migration for xyz"
git push
```

### Database Change Review Checklist

When reviewing PRs with database changes:

- [ ] Is there a new migration folder?
- [ ] Does the migration SQL match the schema change?
- [ ] Is the migration reversible (for rollback)?
- [ ] Have indexes been added for frequently queried columns?
- [ ] Are there any breaking changes for existing data?

---

## Branch Strategy

### Protected Branches

| Branch | Protection Level | Who Can Merge |
|--------|-----------------|---------------|
| `main` | Highest | Team leads only, via PR |
| `develop` | Medium | Developers, via PR or direct push |

### Branch Naming Convention

```
feature/    - New features (feature/user-authentication)
fix/        - Bug fixes (fix/login-error)
hotfix/     - Urgent production fixes (hotfix/critical-security-patch)
chore/      - Maintenance tasks (chore/update-dependencies)
docs/       - Documentation (docs/api-documentation)
refactor/   - Code refactoring (refactor/optimize-queries)
```

### Branch Hierarchy

```
main (production)
  ↑
  │ PR only (requires review)
  │
develop (staging)
  ↑
  │ PR or direct push
  │
feature/* fix/* chore/* (working branches)
```

---

## Development Workflow

### Starting New Work

```bash
# 1. Always start from develop
git checkout develop
git pull origin develop

# 2. Create your working branch
git checkout -b feature/your-feature-name

# 3. Make your changes...

# 4. Commit with clear messages
git add .
git commit -m "feat: add user profile page"

# 5. Push your branch
git push origin feature/your-feature-name
```

### Commit Message Format

Follow conventional commits:

```
type(scope): description

Types:
- feat:     New feature
- fix:      Bug fix
- docs:     Documentation
- style:    Formatting (no code change)
- refactor: Code restructuring
- test:     Adding tests
- chore:    Maintenance

Examples:
- feat(auth): add password reset functionality
- fix(api): resolve CORS issue for upload endpoint
- docs(readme): update deployment instructions
```

### Merging to Develop

**Option A: Direct Push (small changes)**
```bash
git checkout develop
git pull origin develop
git merge feature/your-feature-name
git push origin develop
# → Auto-deploys to STAGING
```

**Option B: Pull Request (recommended)**
1. Push your feature branch
2. Create PR on GitHub: `feature/your-feature-name` → `develop`
3. Get review (optional for develop)
4. Merge PR
5. → Auto-deploys to STAGING

### Testing on Staging

After merging to `develop`:

1. Wait for Railway deployment (check Railway dashboard)
2. Test your changes at staging URLs:
   - Web: `https://sidra-staging.up.railway.app`
   - API: `https://sidra-staging-api.up.railway.app`
3. Verify:
   - [ ] Feature works as expected
   - [ ] No console errors
   - [ ] API endpoints respond correctly
   - [ ] No regression in existing features

---

## Code Review Process

### For Develop Branch

- Reviews are encouraged but not required
- Direct pushes allowed for small, safe changes
- Use PRs for larger changes or when unsure

### For Main Branch (Production)

**Mandatory requirements:**

1. **Pull Request Required**
   ```
   develop → main
   ```

2. **Review Checklist**
   - [ ] Code follows project standards
   - [ ] No console.log or debug code
   - [ ] No hardcoded secrets or URLs
   - [ ] Tests pass (if applicable)
   - [ ] Tested on staging environment
   - [ ] No breaking changes (or documented migration)

3. **Approval Required**
   - Minimum 1 approval from team lead
   - All CI checks must pass

---

## Deployment Process

### To Staging (Automatic)

```bash
# Any push to develop triggers staging deployment
git push origin develop
```

Railway automatically:
1. Detects the push
2. Builds the application
3. Runs database migrations
4. Deploys to staging servers

### To Production (Requires PR)

```bash
# Step 1: Ensure develop is up to date
git checkout develop
git pull origin develop

# Step 2: Ensure main is up to date
git checkout main
git pull origin main

# Step 3: Create PR on GitHub
# Go to GitHub → Pull Requests → New Pull Request
# Base: main ← Compare: develop

# Step 4: Get approval and merge

# Step 5: Production auto-deploys after merge
```

### Deployment Verification

After each deployment:

**Staging:**
- [ ] Check Railway dashboard for successful deployment
- [ ] Visit `https://sidra-staging.up.railway.app`
- [ ] Test critical user flows

**Production:**
- [ ] Check Railway dashboard for successful deployment
- [ ] Visit `https://sidra-frontend-production.up.railway.app`
- [ ] Test critical user flows
- [ ] Monitor error logs for 15 minutes

---

## Hotfix Procedure

For **urgent production issues only**. Use sparingly.

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-issue-description

# 2. Make the minimal fix

# 3. Push and create PR directly to main
git push origin hotfix/critical-issue-description
# Create PR: hotfix/* → main (requires expedited review)

# 4. After merge to main, sync back to develop
git checkout develop
git pull origin develop
git merge main
git push origin develop
```

### Hotfix Rules

- Only for critical production issues
- Minimal changes only (fix the issue, nothing else)
- Still requires code review (can be expedited)
- Must be merged back to develop immediately

---

## Environment URLs

### Staging Environment

| Service | URL |
|---------|-----|
| Web App | `https://sidra-staging.up.railway.app` |
| API | `https://sidra-staging-api.up.railway.app` |
| API Health | `https://sidra-staging-api.up.railway.app/health` |

### Production Environment

| Service | URL |
|---------|-----|
| Web App | `https://sidra-frontend-production.up.railway.app` |
| API | `https://sidra-backend-production.up.railway.app` |
| API Health | `https://sidra-backend-production.up.railway.app/health` |

### Custom Domains (via Cloudflare)

| Service | Staging | Production |
|---------|---------|------------|
| Web | `staging.sidra.sd` | `sidra.sd` / `www.sidra.sd` |
| API | `api-staging.sidra.sd` | `api.sidra.sd` |

> **Setup Guide:** See [CLOUDFLARE-RAILWAY-SETUP.md](./CLOUDFLARE-RAILWAY-SETUP.md) for complete domain configuration instructions.

---

## Common Mistakes to Avoid

### 1. Pushing Directly to Main

**Wrong:**
```bash
git checkout main
git commit -m "quick fix"
git push origin main  # NEVER DO THIS
```

**Correct:**
```bash
git checkout develop
git commit -m "quick fix"
git push origin develop
# Test on staging, then create PR to main
```

### 2. Using Production API URL in Development

**Wrong:**
```javascript
// .env.local
NEXT_PUBLIC_API_URL=https://sidra-backend-production.up.railway.app
```

**Correct:**
```javascript
// .env.local (for local development)
NEXT_PUBLIC_API_URL=http://localhost:4000

// Or use staging for testing
NEXT_PUBLIC_API_URL=https://sidra-staging-api.up.railway.app
```

### 3. Committing Sensitive Data

**Never commit:**
- `.env` files with real credentials
- API keys or secrets
- Database connection strings
- Private keys

**Use:**
- `.env.example` with placeholder values
- Environment variables in Railway dashboard
- Secret management tools

### 4. Skipping Staging Testing

**Wrong:**
```
"It's a small change, I'll push directly to production"
```

**Correct:**
```
All changes, regardless of size, must be tested on staging first.
```

### 5. Merging Without Pulling Latest

**Wrong:**
```bash
git checkout main
git merge develop  # Without pulling first
```

**Correct:**
```bash
git checkout main
git pull origin main
git checkout develop
git pull origin develop
git checkout main
git merge develop
```

---

## Quick Reference

### Daily Development Checklist

```bash
# Morning routine
git checkout develop
git pull origin develop

# Start work
git checkout -b feature/your-task

# End of day
git add .
git commit -m "feat: description"
git push origin feature/your-task
```

### Release to Production Checklist

- [ ] All features tested on staging
- [ ] No known bugs in staging
- [ ] Create PR: develop → main
- [ ] Get approval
- [ ] Merge PR
- [ ] Verify production deployment
- [ ] Monitor for 15 minutes

### Emergency Contacts

For production issues:
1. Check Railway dashboard for errors
2. Check application logs
3. Contact team lead

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-30 | Claude Code | Initial document |
| 1.1 | 2026-01-01 | Claude Code | Added critical Database Migrations section after production outage |

---

**Remember: Production is sacred. When in doubt, test on staging first.**
