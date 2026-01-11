# Sidra AI - Railway to VPS Migration Guide

**Date:** January 11, 2026
**Migration Type:** Railway → Self-Hosted VPS (Hostinger)
**Status:** ✅ Complete and Live

> **⚠️ SECURITY NOTE:** This document uses placeholders for sensitive information. Real credentials are stored securely on the VPS in `.env.production` and should NEVER be committed to version control. Contact DevOps/Admin for actual credentials.

**Placeholder Values Used:**
- `<VPS_IP_ADDRESS>` - Actual VPS IP address
- `<VPS_USER>` - VPS SSH username
- `<DB_USER>` - PostgreSQL username
- `<DB_PASSWORD>` - PostgreSQL password
- `<DB_NAME>` - PostgreSQL database name

---

## Table of Contents

1. [Migration Overview](#migration-overview)
2. [What Changed](#what-changed)
3. [New Production Environment](#new-production-environment)
4. [Developer Workflow Changes](#developer-workflow-changes)
5. [Deployment Process](#deployment-process)
6. [Environment Variables](#environment-variables)
7. [Database Management](#database-management)
8. [Monitoring and Logs](#monitoring-and-logs)
9. [Troubleshooting](#troubleshooting)
10. [Rollback Plan](#rollback-plan)
11. [Migration Summary](#migration-summary)

---

## Migration Overview

### Why We Migrated

**Cost Reduction:**
- **Before:** Railway costs spiked from $1/week to $1.50/day (~$45/month)
- **Root Cause:** Running both production and staging environments with 11 cron jobs (especially email-outbox.worker running every 30 seconds)
- **After:** Self-hosted VPS at ~$5-20/month
- **Savings:** ~$25-40 per month

**Infrastructure Control:**
- Full control over server resources
- Ability to optimize cron job schedules
- Direct database access for backups and maintenance

### Migration Date & Downtime
- **Migration Completed:** January 11, 2026
- **Downtime:** Fresh deployment with new database (no data migration needed)
- **Production URLs:**
  - Website: https://sidra.sd
  - API: https://api.sidra.sd

---

## What Changed

### Infrastructure Changes

| Aspect | Before (Railway) | After (VPS) |
|--------|-----------------|-------------|
| **Hosting** | Railway PaaS | Hostinger VPS (AlmaLinux 9.7) |
| **Orchestration** | Railway's internal | Docker Compose |
| **Database** | Railway PostgreSQL | Self-hosted PostgreSQL 15 (Docker) |
| **SSL/TLS** | Railway managed | Let's Encrypt (auto-renewal via Certbot) |
| **Reverse Proxy** | Railway's proxy | Nginx |
| **Deployments** | Git push to Railway | Manual or CI/CD to VPS |
| **Logs** | Railway dashboard | Docker logs |
| **Monitoring** | Railway metrics | Need to implement (optional) |

### Application Changes

**No code changes required!** The application code remains exactly the same. Only infrastructure and deployment configuration changed.

**Configuration Changes:**
- New `docker-compose.production.yml` file
- New `Dockerfile.web` for Next.js production build
- Nginx configuration files
- Updated environment variables (new database credentials, same API keys)

---

## New Production Environment

### Server Details

```
Server: Hostinger VPS
OS: AlmaLinux 9.7 (RHEL-based)
IP: <VPS_IP_ADDRESS>
Domain: sidra.sd
API Domain: api.sidra.sd
```

### Services Architecture

```
┌─────────────────────────────────────────────┐
│           Internet (HTTPS/HTTP)             │
└────────────────┬────────────────────────────┘
                 │
         ┌───────▼────────┐
         │  Nginx (Alpine) │
         │  Port 80, 443   │
         │  SSL Termination │
         └───┬─────────┬───┘
             │         │
    ┌────────▼──┐  ┌──▼─────────┐
    │  Web      │  │  API       │
    │  Next.js  │  │  NestJS    │
    │  Port 3000│  │  Port 4000 │
    └───────────┘  └──┬─────────┘
                      │
                ┌─────▼──────────┐
                │  PostgreSQL 15 │
                │  Port 5432     │
                └────────────────┘
```

### Docker Services

All services run as Docker containers orchestrated by Docker Compose:

1. **postgres** - PostgreSQL 15 database
   - Port: 5432 (localhost only)
   - Health checks enabled
   - Persistent volume: `postgres_data`

2. **api** - NestJS backend
   - Internal port: 4000
   - Cron jobs enabled (ENABLE_CRON=true)
   - Connected to postgres and nginx networks

3. **web** - Next.js frontend
   - Internal port: 3000
   - Server-side rendering enabled
   - Connects to API via internal Docker network

4. **nginx** - Reverse proxy
   - Ports: 80 (HTTP), 443 (HTTPS)
   - SSL certificates from Let's Encrypt
   - Rate limiting configured
   - Security headers enabled

5. **certbot** - SSL certificate management
   - Auto-renewal every 12 hours
   - Stores certificates in `/etc/letsencrypt`

---

## Developer Workflow Changes

### Local Development (No Changes)

**Local development workflow remains exactly the same:**

```bash
# Still works as before
npm install
npm run dev
```

Local development still uses:
- Local PostgreSQL or Railway development database
- Local environment variables from `.env` or `.env.local`
- Hot reload and development mode

### What Developers Need to Know

#### 1. Environment Variables

**Important:** The production environment now uses different credentials.

- **Database:** New PostgreSQL instance with new credentials
- **API Keys:** Same (Resend, R2, etc.)
- **Secrets:** New JWT_SECRET, ENCRYPTION_KEY, OTP_SECRET generated

**Developer Action Required:**
- Continue using your local `.env` for development
- Do NOT commit `.env.production` to git (it's in `.gitignore`)
- Contact DevOps/Admin for production credentials if needed

#### 2. Database Access

**Before (Railway):**
```bash
# Could access via Railway CLI
railway run psql
```

**After (VPS):**
```bash
# SSH into VPS first
ssh <VPS_USER>@<VPS_IP_ADDRESS>

# Then access database
docker compose -f docker-compose.production.yml exec postgres psql -U <DB_USER> -d <DB_USER>uction
```

**Database Backups:**
```bash
# On VPS
docker compose -f docker-compose.production.yml exec postgres pg_dump -U <DB_USER> <DB_USER>uction > backup_$(date +%Y%m%d).sql
```

#### 3. Viewing Logs

**Before (Railway):**
```bash
railway logs
```

**After (VPS):**
```bash
# SSH into VPS
ssh <VPS_USER>@<VPS_IP_ADDRESS>
cd /home/<VPS_USER>/Sidra-Ai

# View all logs
docker compose -f docker-compose.production.yml logs -f

# View specific service
docker compose -f docker-compose.production.yml logs -f api
docker compose -f docker-compose.production.yml logs -f web
docker compose -f docker-compose.production.yml logs -f nginx
```

#### 4. Deployments

**Before (Railway):**
- Push to main branch → Automatic deployment

**After (VPS):**
- Manual deployment process (see below)
- Can set up CI/CD later (GitHub Actions, etc.)

---

## Deployment Process

### Prerequisites

1. **SSH Access:** Get SSH key added to VPS
2. **Repository Access:** Ensure you have access to the Git repository
3. **Docker Knowledge:** Basic understanding of Docker commands

### Step-by-Step Deployment

#### Option 1: Manual Deployment (Current Method)

```bash
# 1. SSH into VPS
ssh <VPS_USER>@<VPS_IP_ADDRESS>

# 2. Navigate to project directory
cd /home/<VPS_USER>/Sidra-Ai

# 3. Pull latest changes
git pull origin main

# 4. Rebuild and restart services
docker compose -f docker-compose.production.yml up -d --build

# 5. Run migrations (if any new migrations)
docker compose -f docker-compose.production.yml run --rm --entrypoint="" \
  -e DATABASE_URL='postgresql://<DB_USER>:<DB_PASSWORD>@postgres:5432/<DB_NAME>' \
  api sh -c 'cd /app && npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma'

# 6. Check service status
docker compose -f docker-compose.production.yml ps

# 7. View logs
docker compose -f docker-compose.production.yml logs -f
```

#### Option 2: Automated Deployment Script

Create a deployment script (`deploy.sh`):

```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Pull latest code
echo "📥 Pulling latest changes..."
git pull origin main

# Rebuild services
echo "🔨 Building services..."
docker compose -f docker-compose.production.yml build

# Run migrations
echo "🗄️  Running database migrations..."
docker compose -f docker-compose.production.yml run --rm --entrypoint="" \
  -e DATABASE_URL='postgresql://<DB_USER>:<DB_PASSWORD>@postgres:5432/<DB_NAME>' \
  api sh -c 'cd /app && npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma'

# Restart services
echo "♻️  Restarting services..."
docker compose -f docker-compose.production.yml up -d

# Check health
echo "🏥 Checking service health..."
sleep 10
docker compose -f docker-compose.production.yml ps

echo "✅ Deployment complete!"
```

Usage:
```bash
ssh <VPS_USER>@<VPS_IP_ADDRESS>
cd /home/<VPS_USER>/Sidra-Ai
./deploy.sh
```

#### Option 3: CI/CD with GitHub Actions (Future)

Can set up automated deployments using GitHub Actions:
- Push to `main` branch triggers deployment
- Runs tests before deploying
- Automatic rollback on failure

---

## Environment Variables

### Production Environment Variables Location

File: `/home/<VPS_USER>/Sidra-Ai/.env.production` (on VPS only)

**Critical Variables:**

```bash
# Database
POSTGRES_USER=<production-db-user>
POSTGRES_PASSWORD=<production-db-password>
POSTGRES_DB=<production-db-name>
DATABASE_URL="postgresql://<user>:<password>@postgres:5432/<database>"

# Security (DO NOT SHARE - Contact DevOps for real values)
JWT_SECRET="<generated-secret>"
ENCRYPTION_KEY="<generated-secret>"
OTP_SECRET="<generated-secret>"

# External Services (Contact DevOps for real values)
RESEND_API_KEY=<resend-api-key>
R2_ACCOUNT_ID=<r2-account-id>
R2_BUCKET_NAME=sidra-production
R2_ACCESS_KEY_ID=<r2-access-key>
R2_SECRET_ACCESS_KEY=<r2-secret-key>
```

### Adding New Environment Variables

1. **Add to `.env.production` on VPS:**
   ```bash
   ssh <VPS_USER>@<VPS_IP_ADDRESS>
   cd /home/<VPS_USER>/Sidra-Ai
   nano .env.production  # Add your variable
   ```

2. **Update docker-compose.production.yml if needed:**
   - Add to `environment:` section if it needs to override env_file
   - Or just rely on `env_file: .env.production`

3. **Restart affected services:**
   ```bash
   docker compose -f docker-compose.production.yml restart api web
   ```

---

## Database Management

### Accessing the Database

```bash
# SSH into VPS
ssh <VPS_USER>@<VPS_IP_ADDRESS>

# Access PostgreSQL
docker compose -f docker-compose.production.yml exec postgres psql -U <DB_USER> -d <DB_NAME>
```

### Creating Backups

**Manual Backup:**
```bash
# On VPS
cd /home/<VPS_USER>/Sidra-Ai
docker compose -f docker-compose.production.yml exec postgres pg_dump -U <DB_USER> <DB_USER>uction > /home/<VPS_USER>/backups/backup_$(date +%Y%m%d_%H%M%S).sql
```

**Automated Backup Script:**
```bash
#!/bin/bash
# backup-db.sh

BACKUP_DIR="/home/<VPS_USER>/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/sidra_backup_$DATE.sql"

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

# Create backup
cd /home/<VPS_USER>/Sidra-Ai
docker compose -f docker-compose.production.yml exec -T postgres pg_dump -U <DB_USER> <DB_USER>uction > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "sidra_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

**Set up automated daily backups:**
```bash
# Add to crontab
crontab -e

# Add this line (daily at 2 AM)
0 2 * * * /home/<VPS_USER>/backup-db.sh >> /home/<VPS_USER>/backup.log 2>&1
```

### Restoring from Backup

```bash
# Restore from backup
gunzip -c /home/<VPS_USER>/backups/sidra_backup_YYYYMMDD_HHMMSS.sql.gz | \
docker compose -f docker-compose.production.yml exec -T postgres psql -U <DB_USER> -d <DB_USER>uction
```

### Running Migrations

```bash
# SSH into VPS
ssh <VPS_USER>@<VPS_IP_ADDRESS>
cd /home/<VPS_USER>/Sidra-Ai

# Run migrations
docker compose -f docker-compose.production.yml run --rm --entrypoint="" \
  -e DATABASE_URL='postgresql://<DB_USER>:<DB_PASSWORD>@postgres:5432/<DB_USER>uction' \
  api sh -c 'cd /app && npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma'
```

---

## Monitoring and Logs

### Viewing Logs

**All services:**
```bash
docker compose -f docker-compose.production.yml logs -f
```

**Specific service:**
```bash
docker compose -f docker-compose.production.yml logs -f api
docker compose -f docker-compose.production.yml logs -f web
docker compose -f docker-compose.production.yml logs -f nginx
docker compose -f docker-compose.production.yml logs -f postgres
```

**Last N lines:**
```bash
docker compose -f docker-compose.production.yml logs --tail 100 api
```

**Search logs:**
```bash
docker compose -f docker-compose.production.yml logs api | grep "ERROR"
```

### Service Health Checks

```bash
# Check all services status
docker compose -f docker-compose.production.yml ps

# Check API health endpoint
curl https://api.sidra.sd/health

# Check web is responding
curl -I https://sidra.sd
```

### System Resources

```bash
# Check disk usage
df -h

# Check Docker disk usage
docker system df

# Check container resources
docker stats

# Clean up unused Docker resources
docker system prune -a
```

### Recommended Monitoring Tools (Optional)

Consider setting up:
1. **Uptime Kuma** - Uptime monitoring
2. **Grafana + Prometheus** - Metrics and dashboards
3. **Logrotate** - Automatic log rotation
4. **Sentry** - Error tracking (integrate in application)

---

## Troubleshooting

### Common Issues

#### 1. Service Won't Start

**Check logs:**
```bash
docker compose -f docker-compose.production.yml logs <service-name>
```

**Check service status:**
```bash
docker compose -f docker-compose.production.yml ps
```

**Restart service:**
```bash
docker compose -f docker-compose.production.yml restart <service-name>
```

#### 2. Database Connection Issues

**Check database is running:**
```bash
docker compose -f docker-compose.production.yml ps postgres
```

**Test database connection:**
```bash
docker compose -f docker-compose.production.yml exec postgres psql -U <DB_USER> -d <DB_USER>uction -c "SELECT 1"
```

**Check DATABASE_URL format:**
```bash
docker compose -f docker-compose.production.yml exec api printenv DATABASE_URL
```

#### 3. Website Shows 502 Bad Gateway

**Check if services are running:**
```bash
docker compose -f docker-compose.production.yml ps
```

**Check Nginx configuration:**
```bash
docker compose -f docker-compose.production.yml exec nginx nginx -t
```

**Check Nginx logs:**
```bash
docker compose -f docker-compose.production.yml logs nginx
```

**Restart Nginx:**
```bash
docker compose -f docker-compose.production.yml restart nginx
```

#### 4. SSL Certificate Issues

**Check certificate expiry:**
```bash
docker compose -f docker-compose.production.yml exec certbot certbot certificates
```

**Renew certificates manually:**
```bash
docker compose -f docker-compose.production.yml run --rm certbot renew
docker compose -f docker-compose.production.yml restart nginx
```

#### 5. Out of Disk Space

**Check disk usage:**
```bash
df -h
```

**Clean Docker resources:**
```bash
docker system prune -a
```

**Remove old images:**
```bash
docker image prune -a
```

### Emergency Contacts

- **VPS Provider:** Hostinger Support
- **Domain:** sidra.sd (registered with ?)
- **Primary Admin:** [Add contact info]

---

## Rollback Plan

### If Deployment Fails

1. **Stop new deployment:**
   ```bash
   docker compose -f docker-compose.production.yml down
   ```

2. **Checkout previous version:**
   ```bash
   git log  # Find previous commit
   git checkout <previous-commit-hash>
   ```

3. **Rebuild and start:**
   ```bash
   docker compose -f docker-compose.production.yml up -d --build
   ```

4. **Restore database if needed:**
   ```bash
   # Use latest backup
   gunzip -c /home/<VPS_USER>/backups/sidra_backup_LATEST.sql.gz | \
   docker compose -f docker-compose.production.yml exec -T postgres psql -U <DB_USER> -d <DB_USER>uction
   ```

### If VPS Has Critical Issues

**Temporary fallback options:**
1. Re-enable Railway staging environment temporarily
2. Set up new VPS and restore from backup
3. Use Cloudflare's maintenance page while fixing

---

## Migration Summary

### What Was Done

#### 1. Server Setup (Day 1 - January 11, 2026)

**Initial Security Configuration:**
- Created dedicated user `sidra` with sudo privileges
- Updated system packages (AlmaLinux 9.7)
- Configured firewall (firewalld) to allow HTTP/HTTPS
- Set up SSH key authentication

**Docker Installation:**
- Installed Docker CE and Docker Compose
- Configured Docker to run as non-root user
- Set up Docker networking for service communication

#### 2. Application Configuration

**Created Production Files:**
- `docker-compose.production.yml` - Multi-service orchestration
  - PostgreSQL 15 database service
  - NestJS API service
  - Next.js web service
  - Nginx reverse proxy
  - Certbot for SSL management

- `Dockerfile.web` - Next.js production build
  - Multi-stage build for optimization
  - Production-optimized Node.js image
  - Proper user permissions

- Nginx configuration (`nginx/conf.d/default.conf`)
  - HTTPS redirect from HTTP
  - SSL/TLS configuration
  - Rate limiting
  - Security headers
  - CORS configuration
  - WebSocket support

**Environment Configuration:**
- Generated new security secrets:
  - JWT_SECRET
  - ENCRYPTION_KEY
  - OTP_SECRET
- Configured database credentials
- Maintained existing API keys (Resend, R2)

#### 3. SSL/TLS Setup

- Obtained Let's Encrypt SSL certificates for:
  - sidra.sd
  - api.sidra.sd
- Configured automatic renewal via Certbot
- Set up proper certificate mounting in Nginx

#### 4. Database Migration

**Key Challenges Solved:**
- PostgreSQL password with special characters (`/` and `+`)
- URL encoding vs raw password mismatch
- Changed password to simpler format: `<DB_PASSWORD>`

**Migration Process:**
- Created PostgreSQL database and user
- Applied all 30 Prisma migrations successfully:
  - 20251214100258_init_refactor
  - 20251220093718_phone_first_identity
  - ... (28 more migrations)
  - 20260106173326_add_user_tour_completion

#### 5. Service Configuration

**Fixed Issues:**
- Nginx `add_header` directive placement (can't use in `if` blocks)
- Web container PORT configuration (was 4000, changed to 3000)
- HTTP/2 deprecated syntax (`listen 443 ssl http2` → `listen 443 ssl; http2 on;`)
- API startup script database connection check

**Health Checks Configured:**
- API: `curl http://localhost:4000/health`
- Web: `curl http://localhost:3000`
- PostgreSQL: `pg_isready`
- Nginx: HTTP check on port 80

#### 6. Deployment Verification

**Services Status:**
- ✅ PostgreSQL: Healthy, listening on 5432
- ✅ API: Healthy, listening on 4000, cron jobs running
- ✅ Web: Healthy, listening on 3000
- ✅ Nginx: Healthy, proxying traffic on 80/443
- ✅ Certbot: Running, auto-renewal configured

**Public URLs Verified:**
- https://sidra.sd - Next.js website working
- https://api.sidra.sd/health - API health check returning JSON

### Key Technical Decisions

1. **Docker Compose over Kubernetes:**
   - Simpler for small team
   - Easier maintenance
   - Lower resource overhead
   - Can migrate to K8s later if needed

2. **AlmaLinux 9.7:**
   - RHEL-based, enterprise-grade
   - Long-term support
   - Stable and secure

3. **Nginx as Reverse Proxy:**
   - Industry standard
   - Excellent performance
   - Built-in rate limiting
   - Easy SSL configuration

4. **Let's Encrypt for SSL:**
   - Free SSL certificates
   - Automatic renewal
   - Industry trusted

5. **Same Database Password for All Environments:**
   - Simplified the URL encoding issues
   - Changed to alphanumeric password without special characters
   - More reliable across different tools (psql, Prisma, etc.)

### Files Created/Modified

**New Files:**
- `/home/<VPS_USER>/Sidra-Ai/docker-compose.production.yml`
- `/home/<VPS_USER>/Sidra-Ai/Dockerfile.web`
- `/home/<VPS_USER>/Sidra-Ai/nginx/nginx.conf`
- `/home/<VPS_USER>/Sidra-Ai/nginx/conf.d/default.conf`
- `/home/<VPS_USER>/Sidra-Ai/.env.production`

**Modified Files:**
- `packages/shared/package.json` - Added missing `@nestjs/mapped-types` dependency

### Challenges Overcome

1. **Password URL Encoding:**
   - Issue: Special characters in password (`/` and `+`) caused issues
   - Solution: Changed to simpler password without special characters

2. **Nginx Configuration Errors:**
   - Issue: `add_header` directives not allowed in `if` blocks
   - Solution: Removed redundant headers from `if` block, kept server-level headers

3. **Web Container Port Mismatch:**
   - Issue: Web listening on 4000, Nginx expecting 3000
   - Solution: Added `PORT: "3000"` environment variable

4. **Webmin Terminal Limitations:**
   - Issue: Heredoc commands getting corrupted
   - Solution: Used Python scripts to write complex files

### Performance Optimization

**Implemented:**
- HTTP/2 enabled for faster loading
- Static file caching for Next.js assets
- Connection keepalive for reduced latency
- Rate limiting to prevent abuse
- Gzip compression in Nginx

**Not Yet Implemented (Future):**
- CDN for static assets
- Redis for caching
- Database query optimization
- Application-level caching

### Security Measures

**Implemented:**
- SSL/TLS with strong ciphers (TLSv1.2, TLSv1.3)
- Security headers (HSTS, X-Frame-Options, etc.)
- Rate limiting on API and Web
- Firewall configured (only 22, 80, 443 open)
- Non-root Docker containers
- Secrets stored in environment files (not in code)

**Recommended Future Enhancements:**
- Set up fail2ban for brute force protection
- Implement database encryption at rest
- Add WAF (Web Application Firewall)
- Set up intrusion detection
- Regular security audits

---

## Cron Jobs & Background Workers

### Running Cron Jobs

The API container has `ENABLE_CRON: "true"` which enables all scheduled tasks:

**Active Cron Jobs:**
1. **Email Outbox Worker** - Every 30 seconds
   - Processes pending emails
   - This was the main cost driver on Railway

2. **Escrow Scheduler** - Every 30 minutes
   - Auto-release payments
   - Check missing meeting links
   - Send session reminders

3. **Registration Cleanup** - Daily at 2 AM
   - Clean up unverified registrations

**Viewing Cron Job Logs:**
```bash
docker compose -f docker-compose.production.yml logs api | grep -E "Scheduler|Worker"
```

### Adjusting Cron Schedules

To optimize costs and performance, you can adjust cron schedules in the API code:

Example: Change email worker from 30s to 1 minute:
```typescript
// apps/api/src/notification/email-outbox.worker.ts
@Cron('*/1 * * * *')  // Changed from '*/0.5 * * * *'
async processEmailOutbox() {
  // ...
}
```

---

## Best Practices for Developers

### 1. Always Test Locally First

Before deploying to production:
```bash
# Run tests
npm run test

# Check TypeScript compilation
npm run build

# Test with production-like environment locally
docker compose up
```

### 2. Database Migrations

**Creating new migrations:**
```bash
# Develop locally
npm run prisma:migrate:dev

# Generate migration
npx prisma migrate dev --name descriptive_migration_name

# Commit migration files
git add packages/database/prisma/migrations
git commit -m "feat: add new migration for feature X"
```

**Deploying migrations:**
```bash
# After deployment, migrations run automatically via startup script
# Or run manually:
docker compose -f docker-compose.production.yml run --rm api \
  npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma
```

### 3. Environment Variables

**Never commit secrets:**
- `.env` files are in `.gitignore`
- Use example files: `.env.example`
- Document required variables

**Adding new variables:**
1. Add to `.env.example` with placeholder
2. Update this documentation
3. Notify team to update their local `.env`
4. Update `.env.production` on VPS

### 4. Logging

**Use structured logging:**
```typescript
// Good
this.logger.log('User registered', { userId, email });

// Avoid
console.log('User registered');
```

**Log levels:**
- `ERROR` - Critical issues needing immediate attention
- `WARN` - Important but not critical
- `LOG` - General information
- `DEBUG` - Detailed debugging info (disabled in production)

### 5. Error Handling

**Always handle errors gracefully:**
```typescript
try {
  await someOperation();
} catch (error) {
  this.logger.error('Operation failed', error.stack);
  throw new InternalServerException('Failed to complete operation');
}
```

---

## Next Steps & Recommendations

### Immediate (Next 7 Days)

- [ ] Set up automated database backups (daily)
- [ ] Test backup restoration process
- [ ] Document manual deployment procedure for team
- [ ] Share VPS access with key team members

### Short Term (Next 30 Days)

- [ ] Implement monitoring solution (Uptime Kuma or similar)
- [ ] Set up log rotation to prevent disk space issues
- [ ] Create deployment script or CI/CD pipeline
- [ ] Review and optimize cron job schedules
- [ ] Disable Railway staging environment

### Medium Term (Next 90 Days)

- [ ] Implement Redis for caching
- [ ] Set up CDN for static assets
- [ ] Database query optimization
- [ ] Load testing and performance tuning
- [ ] Consider horizontal scaling strategy

### Long Term (Future)

- [ ] Multi-region deployment for redundancy
- [ ] Kubernetes migration if needed
- [ ] Advanced monitoring and alerting
- [ ] Disaster recovery plan
- [ ] Compliance audits (if required)

---

## Important Notes

### 🔒 Security Reminders

- **Never commit `.env.production`** - Contains production secrets
- **Rotate secrets regularly** - Especially after team changes
- **Keep system updated** - Run `dnf update` monthly
- **Monitor access logs** - Check for suspicious activity
- **Use strong passwords** - For all accounts and databases

### 💰 Cost Management

- **Monitor VPS resources** - Upgrade if needed, downgrade if overprovisioned
- **Review cron jobs** - Optimize frequency to reduce CPU usage
- **Database optimization** - Regular VACUUM and index maintenance
- **Log rotation** - Prevent logs from filling disk

### 📞 Support

For issues or questions:
1. Check this documentation first
2. Check logs: `docker compose logs`
3. Search common issues in troubleshooting section
4. Contact team lead or DevOps

---

## Appendix

### A. Useful Commands Cheatsheet

```bash
# SSH into VPS
ssh <VPS_USER>@<VPS_IP_ADDRESS>

# Navigate to project
cd /home/<VPS_USER>/Sidra-Ai

# View all services
docker compose -f docker-compose.production.yml ps

# View logs
docker compose -f docker-compose.production.yml logs -f [service]

# Restart service
docker compose -f docker-compose.production.yml restart [service]

# Rebuild and restart
docker compose -f docker-compose.production.yml up -d --build [service]

# Stop all services
docker compose -f docker-compose.production.yml down

# Start all services
docker compose -f docker-compose.production.yml up -d

# Access database
docker compose -f docker-compose.production.yml exec postgres psql -U <DB_USER> -d <DB_USER>uction

# Run migrations
docker compose -f docker-compose.production.yml run --rm --entrypoint="" \
  -e DATABASE_URL='postgresql://<DB_USER>:<DB_PASSWORD>@postgres:5432/<DB_USER>uction' \
  api sh -c 'cd /app && npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma'

# Backup database
docker compose -f docker-compose.production.yml exec postgres pg_dump -U <DB_USER> <DB_USER>uction > backup.sql

# Check disk space
df -h

# Clean Docker
docker system prune -a
```

### B. File Locations

```
VPS File Structure:
/home/<VPS_USER>/
├── Sidra-Ai/                          # Main project directory
│   ├── docker-compose.production.yml  # Docker orchestration
│   ├── .env.production                # Production environment variables
│   ├── apps/
│   │   ├── api/                       # NestJS API
│   │   └── web/                       # Next.js frontend
│   ├── packages/
│   │   ├── database/                  # Prisma schema & migrations
│   │   └── shared/                    # Shared code
│   ├── nginx/
│   │   ├── nginx.conf                 # Main nginx config
│   │   └── conf.d/
│   │       └── default.conf           # Site-specific config
│   └── Dockerfile.web                 # Web container build file
├── backups/                           # Database backups (create this)
└── logs/                              # Application logs (optional)

System Directories:
/etc/letsencrypt/                      # SSL certificates
/var/lib/docker/volumes/               # Docker persistent volumes
```

### C. Port Mapping

| Service | Internal Port | External Port | Access |
|---------|--------------|---------------|--------|
| Nginx | 80, 443 | 80, 443 | Public |
| API | 4000 | - | Via Nginx only |
| Web | 3000 | - | Via Nginx only |
| PostgreSQL | 5432 | 127.0.0.1:5432 | Localhost only |

### D. Network Architecture

```
Docker Networks:
- sidra_network (bridge)
  - postgres
  - api
  - web
  - nginx
  - certbot

External Access:
Internet → Nginx (80/443) → API (4000) or Web (3000)
                           ↓
                      PostgreSQL (5432)
```

---

## Document Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-01-11 | 1.0.0 | Initial migration documentation | Claude |

---

## Feedback & Updates

This document should be updated whenever:
- Infrastructure changes are made
- New services are added
- Deployment process changes
- Common issues are discovered
- Team workflows evolve

Keep this document as a single source of truth for production deployment!

---

**Last Updated:** January 11, 2026
**Next Review:** February 11, 2026
