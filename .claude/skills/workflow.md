---
name: sidra-development-workflow
description: Use this skill when the user wants to deploy, check staging status, prepare for production, or follow the development workflow. Keywords: deploy, staging, production, workflow, release, merge, PR.
---

# Sidra Development Workflow

## Branch Strategy

```
main (production) ← PR ← develop (staging) ← feature branches
```

- **main**: Production-ready code, deployed to `sidra-production`
- **develop**: Integration branch, deployed to `sidra-staging`
- **feature/***: Individual feature branches

## Daily Workflow

### 1. Start of Day - Check Staging Health

```bash
# Check backend logs for errors/warnings
railway logs --service Sidra-Backend-Staging | tail -50

# Check frontend logs
railway logs --service Sidra-frontend-Staging | tail -50

# Verify build passes
npm run build

# Run tests
npm run test
```

**Known Issues to Watch:**
- `EmailOutboxWorker` timeout warnings (recurring - needs investigation)
- Non-standard NODE_ENV warning on frontend

### 2. Development Cycle

```bash
# Create feature branch
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# Make changes, then test locally
npm run dev

# Build to verify no errors
npm run build

# Commit changes
git add .
git commit -m "feat: description"

# Push and create PR to develop
git push -u origin feature/your-feature-name
```

### 3. Merging to Develop (Staging)

After PR approval:
```bash
git checkout develop
git pull origin develop
git merge feature/your-feature-name
git push origin develop
```

Railway auto-deploys `develop` branch to staging.

### 4. Pre-Production Checklist

Before merging develop → main:

- [ ] All tests passing (`npm run test`)
- [ ] Build succeeds (`npm run build`)
- [ ] No TypeScript errors (`npm run lint`)
- [ ] Staging tested manually
- [ ] No critical errors in staging logs
- [ ] Database migrations applied (if any)
- [ ] Environment variables synced between staging/production

### 5. Production Release

```bash
# Create PR from develop to main
gh pr create --base main --head develop --title "Release: description"

# After approval and merge, verify production
railway link  # Select sidra-production
railway logs --service Sidra-Backend -f
```

## Railway Commands Quick Reference

| Action | Command |
|--------|---------|
| Check staging logs | `railway logs --service Sidra-Backend-Staging -f` |
| Check prod logs | Switch to prod project, then `railway logs` |
| Set env var | `railway variables set KEY=value` |
| List env vars | `railway variables` |
| Manual deploy | `railway up --service <service-name>` |
| Open dashboard | `railway open` |

## Environment URLs

- **Staging Frontend**: https://sidra-staging.up.railway.app
- **Staging API**: https://sidra-staging-api.up.railway.app
- **Production Frontend**: (check Railway dashboard)
- **Production API**: (check Railway dashboard)
