# Sidra AI - VPS Deployment Instructions

## Current Status

✅ **Completed on your local machine:**
1. Created `docker-compose.production.yml` - Full production orchestration
2. Created `Dockerfile.web` - Next.js container configuration
3. Created `nginx/nginx.conf` - Main Nginx configuration
4. Created `nginx/conf.d/default.conf` - Site-specific routing for sidra.sd
5. Created `.env.production` - Production environment variables with generated secrets

✅ **Completed on your VPS (148.135.136.4):**
1. Created user `sidra` with sudo (wheel) permissions
2. Updated system packages
3. Configured firewalld (ports 22, 80, 443, 10000 open)
4. Installed Docker CE and Docker Compose v5.0.1
5. Cloned repository to `/home/sidra/Sidra-Ai/`

---

## Next Steps - Upload Configuration Files to VPS

You have TWO options to upload the new files to your VPS:

### Option A: Using Webmin File Manager (Easiest!)

1. **Login to Webmin:**
   - Open browser: `https://148.135.136.4:10000`
   - Login with: `root` and your password

2. **Navigate to the project directory:**
   - Go to **"Others"** → **"File Manager"**
   - Navigate to `/home/sidra/Sidra-Ai/`

3. **Upload each file:**

   **File 1: docker-compose.production.yml**
   - Click **"Upload to current directory"**
   - Select the file from your local machine: `docker-compose.production.yml`
   - Upload it to `/home/sidra/Sidra-Ai/`

   **File 2: Dockerfile.web**
   - Same process, upload `Dockerfile.web` to `/home/sidra/Sidra-Ai/`

   **File 3: .env.production**
   - Upload `.env.production` to `/home/sidra/Sidra-Ai/`
   - **IMPORTANT:** After upload, right-click the file → **"Change Permissions"**
   - Set permissions to `600` (read/write for owner only)

   **File 4 & 5: Nginx configs**
   - First, create directory: `/home/sidra/Sidra-Ai/nginx/`
     - Click **"Create"** → **"New Directory"** → Name it `nginx`
   - Enter the `nginx/` directory
   - Upload `nginx.conf` to `/home/sidra/Sidra-Ai/nginx/`
   - Create subdirectory: `/home/sidra/Sidra-Ai/nginx/conf.d/`
   - Enter `conf.d/` and upload `default.conf`

4. **Change ownership to sidra user:**
   - Open **"Tools"** → **"Command Shell"**
   - Run:
     ```bash
     chown -R sidra:sidra /home/sidra/Sidra-Ai/
     chmod 600 /home/sidra/Sidra-Ai/.env.production
     ```

### Option B: Using Git Push (Alternative)

If you prefer using Git:

1. Commit the new files to your repository:
   ```bash
   cd /Users/omerheathrow/Sidra-Ai
   git add docker-compose.production.yml Dockerfile.web nginx/
   git commit -m "Add production deployment configuration"
   git push origin main
   ```

2. Pull on the VPS (via Webmin Terminal):
   ```bash
   cd /home/sidra/Sidra-Ai
   git pull origin main
   ```

3. **Manually upload `.env.production`** via Webmin File Manager
   - **DO NOT commit .env.production to Git!** (It contains secrets)
   - Upload it using Webmin File Manager as described in Option A
   - Set permissions: `chmod 600 .env.production`

---

## After Files are Uploaded - Complete Setup

Once all files are on the VPS, continue with these steps via **Webmin Terminal**:

### Step 1: Update .env.production with YOUR credentials

**In Webmin File Manager:**
1. Navigate to `/home/sidra/Sidra-Ai/`
2. Click on `.env.production` to edit it
3. Replace these placeholder values with your actual credentials:

   ```bash
   # Replace these values:
   RESEND_API_KEY=re_YOUR_RESEND_API_KEY_HERE  # Get from https://resend.com/api-keys

   R2_ACCOUNT_ID=YOUR_R2_ACCOUNT_ID            # Get from Cloudflare R2 dashboard
   R2_ACCESS_KEY_ID=YOUR_R2_ACCESS_KEY_ID
   R2_SECRET_ACCESS_KEY=YOUR_R2_SECRET_ACCESS_KEY
   R2_BUCKET_NAME=sidra-uploads
   R2_PUBLIC_URL=https://pub-YOUR_BUCKET_ID.r2.dev
   ```

4. Save the file

### Step 2: Create Required Directories

**In Webmin Terminal**, run:

```bash
cd /home/sidra/Sidra-Ai

# Create directories for SSL certificates and backups
mkdir -p certbot/conf certbot/www backups scripts

# Verify structure
ls -la
```

### Step 3: Obtain SSL Certificates from Let's Encrypt

**IMPORTANT:** Make sure your domain `sidra.sd` and `api.sidra.sd` are already pointing to your VPS IP (148.135.136.4) before running these commands!

**In Webmin Terminal**, run:

```bash
cd /home/sidra/Sidra-Ai

# Step 1: Create temporary HTTP-only Nginx config
cat > nginx/conf.d/temp.conf << 'EOF'
server {
    listen 80;
    server_name sidra.sd api.sidra.sd;
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    location / {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
EOF

# Step 2: Start temporary Nginx container
docker run -d --name nginx_temp \
  -p 80:80 \
  -v $(pwd)/nginx/conf.d:/etc/nginx/conf.d:ro \
  -v $(pwd)/certbot/www:/var/www/certbot:ro \
  nginx:alpine

# Step 3: Obtain certificate for main domain
docker run -it --rm \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/certbot/www:/var/www/certbot \
  certbot/certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email YOUR_EMAIL@example.com \
  --agree-tos --no-eff-email \
  -d sidra.sd

# Step 4: Obtain certificate for API subdomain
docker run -it --rm \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/certbot/www:/var/www/certbot \
  certbot/certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email YOUR_EMAIL@example.com \
  --agree-tos --no-eff-email \
  -d api.sidra.sd

# Step 5: Clean up temporary container
docker stop nginx_temp && docker rm nginx_temp
rm nginx/conf.d/temp.conf

# Step 6: Verify certificates
ls -la certbot/conf/live/
```

**Expected output:**
```
drwxr-xr-x 2 root root 4096 Jan 11 12:00 sidra.sd
drwxr-xr-x 2 root root 4096 Jan 11 12:01 api.sidra.sd
```

### Step 4: Start PostgreSQL Database

```bash
cd /home/sidra/Sidra-Ai

# Start PostgreSQL only (to run migrations)
docker compose -f docker-compose.production.yml up -d postgres

# Watch logs until it says "database system is ready to accept connections"
docker compose -f docker-compose.production.yml logs -f postgres
# Press Ctrl+C when ready
```

### Step 5: Run Database Migrations

```bash
cd /home/sidra/Sidra-Ai

# Install dependencies (needed for Prisma CLI)
docker compose -f docker-compose.production.yml exec postgres sh -c "
  cd /app && \
  npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma
"

# If the above doesn't work, run migrations from your local machine:
# Make sure DATABASE_URL in .env.production is accessible
```

**Alternative: Run migrations from the API container after it starts**

### Step 6: Build and Start All Services

```bash
cd /home/sidra/Sidra-Ai

# Build all Docker images (this will take 5-10 minutes)
docker compose -f docker-compose.production.yml build

# Start all services
docker compose -f docker-compose.production.yml up -d

# Check status
docker compose -f docker-compose.production.yml ps

# View logs
docker compose -f docker-compose.production.yml logs -f
```

**Expected output:**
```
NAME                IMAGE               STATUS
sidra_postgres      postgres:15-alpine  Up (healthy)
sidra_api           sidra-api:latest    Up (healthy)
sidra_web           sidra-web:latest    Up (healthy)
sidra_nginx         nginx:alpine        Up (healthy)
sidra_certbot       certbot/certbot     Up
```

### Step 7: Verify Services are Running

```bash
# Test API health (inside Docker network)
docker compose -f docker-compose.production.yml exec api curl -f http://localhost:4000/health

# Test from outside (via Nginx)
curl https://api.sidra.sd/health
curl https://sidra.sd

# Check database
docker compose -f docker-compose.production.yml exec postgres psql -U sidra_prod -d sidra_production -c "\dt"
```

### Step 8: Setup Automated Database Backups

**In Webmin File Manager:**
1. Navigate to `/home/sidra/Sidra-Ai/scripts/`
2. Create new file: `backup-database.sh`
3. Paste this content:

```bash
#!/bin/bash
set -e

BACKUP_DIR="/home/sidra/Sidra-Ai/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/sidra_backup_$DATE.sql.gz"

# Delete backups older than 7 days
find $BACKUP_DIR -name "sidra_backup_*.sql.gz" -mtime +7 -delete

# Create compressed backup
docker exec sidra_postgres pg_dump -U sidra_prod sidra_production | gzip > $BACKUP_FILE

echo "Backup created: $BACKUP_FILE"
```

4. Save and make executable via Terminal:

```bash
chmod +x /home/sidra/Sidra-Ai/scripts/backup-database.sh

# Test backup script
/home/sidra/Sidra-Ai/scripts/backup-database.sh

# Schedule daily backups at 2 AM
crontab -e
# Add this line:
0 2 * * * /home/sidra/Sidra-Ai/scripts/backup-database.sh >> /home/sidra/Sidra-Ai/backups/backup.log 2>&1
```

---

## Verify Production Deployment

### Check Cron Jobs are Running

```bash
# View API logs to see cron jobs executing
docker compose -f docker-compose.production.yml logs api | grep -E "Running|Processing"

# You should see entries like:
# [EscrowSchedulerService] Running auto-release job...
# [EmailOutboxWorker] Processing pending emails
# [PackageScheduler] Running package expiry cron job...
```

### Test Full User Flow

1. **Visit website:** https://sidra.sd
2. **Test registration:** Try registering a new account
3. **Check email:** Verify OTP email arrives (Resend working)
4. **Test file upload:** Upload a profile picture (R2 working)
5. **Create booking:** Test booking flow (database & notifications working)

---

## DNS Configuration

**IMPORTANT:** Before going live, update your DNS records:

In your domain registrar (where you bought sidra.sd):

| Type | Name | Value         | TTL |
|------|------|---------------|-----|
| A    | @    | 148.135.136.4 | 300 |
| A    | api  | 148.135.136.4 | 300 |

**Verify DNS propagation:**

```bash
# From your local machine
nslookup sidra.sd
nslookup api.sidra.sd

# Both should show: 148.135.136.4
```

---

## Troubleshooting

### If a service fails to start:

```bash
# Check logs
docker compose -f docker-compose.production.yml logs <service-name>

# Examples:
docker compose -f docker-compose.production.yml logs api
docker compose -f docker-compose.production.yml logs web
docker compose -f docker-compose.production.yml logs postgres

# Restart a service
docker compose -f docker-compose.production.yml restart <service-name>

# Rebuild a service
docker compose -f docker-compose.production.yml up -d --build <service-name>
```

### If database migrations fail:

```bash
# Run migrations manually
docker compose -f docker-compose.production.yml exec api sh
cd /app
npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma
exit
```

### If SSL certificate renewal fails:

```bash
# Test renewal manually
docker compose -f docker-compose.production.yml exec certbot certbot renew --dry-run

# Check certificate expiry
docker compose -f docker-compose.production.yml exec certbot certbot certificates
```

### Check resource usage:

```bash
# Overall system resources
docker stats

# Disk space
df -h

# Running containers
docker ps -a
```

---

## Monitoring Commands (Save These!)

```bash
# View all logs
docker compose -f docker-compose.production.yml logs -f

# View specific service logs
docker compose -f docker-compose.production.yml logs -f api

# Check service status
docker compose -f docker-compose.production.yml ps

# Restart all services
docker compose -f docker-compose.production.yml restart

# Stop all services
docker compose -f docker-compose.production.yml down

# Start all services
docker compose -f docker-compose.production.yml up -d

# View database
docker compose -f docker-compose.production.yml exec postgres psql -U sidra_prod -d sidra_production
```

---

## Security Checklist

✅ Firewall configured (firewalld)
✅ PostgreSQL only on localhost (127.0.0.1:5432)
✅ SSL/TLS enabled (Let's Encrypt)
✅ Strong random secrets generated
✅ .env.production has 600 permissions
✅ Rate limiting enabled (Nginx)
✅ Security headers configured
✅ Non-root user for containers

---

## What About Railway?

After 48-72 hours of stable VPS operation:

1. **Test everything thoroughly on VPS**
2. **Verify backups are working**
3. **Delete Railway production environment** (save ~$45/month)
4. **Keep Railway staging for testing** (optional, or disable crons with `ENABLE_CRON=false`)

---

## Cost Comparison

**Railway (Before):**
- Production: ~$30-45/month
- Staging: ~$15-20/month
- **Total: ~$50/month**

**VPS (After):**
- Hostinger VPS: Check your plan (likely $10-25/month)
- Domain: Already owned
- SSL: Free (Let's Encrypt)
- **Total: ~$15/month**

**Savings: ~$35/month (~$420/year)** 🎉

---

## Need Help?

If you get stuck:

1. Check the logs: `docker compose -f docker-compose.production.yml logs -f`
2. Verify DNS is pointing to VPS: `nslookup sidra.sd`
3. Verify firewall ports are open: `firewall-cmd --list-all`
4. Check Docker is running: `systemctl status docker`
5. Verify .env.production has correct values

---

## Summary of Files Created

**Configuration Files:**
- ✅ `docker-compose.production.yml` - Orchestrates all services
- ✅ `Dockerfile.web` - Next.js container build
- ✅ `nginx/nginx.conf` - Main Nginx config
- ✅ `nginx/conf.d/default.conf` - Site routing
- ✅ `.env.production` - Environment variables (with secrets)

**Next Steps:**
1. Upload files to VPS (Webmin or Git)
2. Add your Resend and R2 credentials to .env.production
3. Obtain SSL certificates
4. Build and start services
5. Run database migrations
6. Test deployment
7. Update DNS
8. Monitor for 48 hours
9. Delete Railway

You've got this! 🚀
