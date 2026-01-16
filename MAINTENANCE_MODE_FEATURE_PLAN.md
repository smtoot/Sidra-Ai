# Maintenance Mode Feature - Implementation Plan

## Executive Summary

This plan outlines the implementation of a maintenance mode system that displays a professional maintenance page to users during deployments, updates, or emergency maintenance. This prevents users from experiencing errors or inconsistent behavior while the system is being updated.

**Core Capabilities:**
- Display bilingual (Arabic/English) maintenance page to all users
- Optional countdown timer for scheduled maintenance
- Admin/staff IP whitelist bypass for testing during maintenance
- Multiple activation methods: environment variable, admin panel toggle, CLI script
- Nginx-based static fallback for maximum reliability
- Next.js middleware for dynamic maintenance messages
- Preserve health check endpoints for monitoring

---

## Current System Analysis

### What Already Exists
✅ **Nginx Reverse Proxy**: Already configured in `nginx/nginx.conf` and `docker-compose.production.yml`
✅ **Environment Variables**: `.env.production` system for configuration
✅ **Docker Health Checks**: Working health checks for all services
✅ **Admin Panel**: Admin dashboard at `/admin` for system management
✅ **Bilingual Support**: Arabic/English throughout the application
✅ **Design System**: Consistent Sidra branding and styling

### What Needs to Be Built
❌ Static maintenance HTML page for nginx
❌ Next.js middleware for maintenance mode detection
❌ Environment variable toggle mechanism
❌ Admin panel toggle interface (optional Phase 2)
❌ IP whitelist bypass functionality
❌ Helper scripts for enabling/disabling maintenance mode
❌ Maintenance mode API endpoint
❌ Countdown timer component

---

## Implementation Phases

### Phase 1: Core Maintenance Mode (MVP)
**Goal**: Basic maintenance page with environment variable toggle

#### 1.1 Static Maintenance Page

**File**: `apps/web/public/maintenance.html` (new file)

Create a standalone HTML page with:
- Sidra branding (logo from `/images/logo.png`)
- Bilingual messaging (Arabic primary, English secondary)
- Clean, professional design matching Sidra's brand
- No external dependencies (inline CSS/JS)
- Optional countdown timer
- Contact information for urgent issues
- Animated loading indicator

**Design Requirements**:
```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>صيانة - Sidra | Maintenance</title>
  <!-- Inline CSS for reliability -->
</head>
<body>
  <!-- Centered content with Sidra logo -->
  <!-- Bilingual maintenance message -->
  <!-- Optional countdown timer -->
  <!-- Contact information -->
  <!-- Animated icons/spinner -->
</body>
</html>
```

#### 1.2 Environment Variable Configuration

**File**: `apps/web/.env.example` and `apps/web/.env.production`

Add new environment variables:
```bash
# Maintenance Mode Configuration
MAINTENANCE_MODE=false                          # true to enable maintenance mode
MAINTENANCE_MESSAGE_AR="نحن نقوم بتحديث النظام"  # Arabic message
MAINTENANCE_MESSAGE_EN="We are upgrading the system"  # English message
MAINTENANCE_END_TIME=""                         # ISO timestamp for countdown (optional)
MAINTENANCE_WHITELIST_IPS=""                    # Comma-separated IPs to bypass
```

#### 1.3 Next.js Middleware for Maintenance Detection

**File**: `apps/web/src/middleware.ts` (modify existing or create)

```typescript
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const maintenanceMode = process.env.MAINTENANCE_MODE === 'true';

  // Skip for health checks and static assets
  const path = request.nextUrl.pathname;
  if (path === '/api/health' || path.startsWith('/_next/') || path.startsWith('/images/')) {
    return NextResponse.next();
  }

  // Check IP whitelist
  const clientIP = request.ip || request.headers.get('x-forwarded-for');
  const whitelist = process.env.MAINTENANCE_WHITELIST_IPS?.split(',') || [];
  const isWhitelisted = whitelist.some(ip => clientIP?.includes(ip.trim()));

  if (maintenanceMode && !isWhitelisted) {
    // Redirect to maintenance page
    return NextResponse.rewrite(new URL('/maintenance.html', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and images
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

#### 1.4 Nginx Configuration for Maintenance Mode

**File**: `nginx/nginx.conf` (modify existing)

Add maintenance mode check before proxying to Next.js:

```nginx
server {
    listen 80;
    server_name sidra.sd www.sidra.sd;

    # Maintenance mode flag file
    set $maintenance_mode off;
    if (-f /etc/nginx/maintenance.flag) {
        set $maintenance_mode on;
    }

    # Health check endpoint - always available
    location /api/health {
        proxy_pass http://sidra_api:4000;
        # ... proxy settings
    }

    # Maintenance page - serve static file
    location = /maintenance.html {
        root /var/www/html;
        internal;
    }

    # Check maintenance mode
    location / {
        # If maintenance flag exists, show maintenance page
        if ($maintenance_mode = on) {
            rewrite ^(.*)$ /maintenance.html break;
        }

        proxy_pass http://sidra_web:3000;
        # ... existing proxy settings
    }

    # ... rest of configuration
}
```

#### 1.5 Helper Scripts for Toggle

**File**: `scripts/enable-maintenance.sh` (new file)

```bash
#!/bin/bash
# Enable maintenance mode

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

MESSAGE_AR="${1:-نحن نقوم بتحسين سدرة. سنعود قريباً}"
MESSAGE_EN="${2:-We are upgrading Sidra. We'll be back soon}"
END_TIME="${3:-}"

echo "🔧 Enabling maintenance mode..."

# Update .env.production
cd "$PROJECT_ROOT"
sed -i.bak 's/MAINTENANCE_MODE=false/MAINTENANCE_MODE=true/' apps/web/.env.production
sed -i.bak "s|MAINTENANCE_MESSAGE_AR=.*|MAINTENANCE_MESSAGE_AR=\"$MESSAGE_AR\"|" apps/web/.env.production
sed -i.bak "s|MAINTENANCE_MESSAGE_EN=.*|MAINTENANCE_MESSAGE_EN=\"$MESSAGE_EN\"|" apps/web/.env.production
sed -i.bak "s|MAINTENANCE_END_TIME=.*|MAINTENANCE_END_TIME=\"$END_TIME\"|" apps/web/.env.production

# For nginx-based maintenance (optional fallback)
# Create flag file on VPS
if [ -n "$VPS_HOST" ]; then
  ssh "$VPS_USER@$VPS_HOST" "touch /etc/nginx/maintenance.flag && sudo nginx -s reload"
fi

echo "✅ Maintenance mode enabled"
echo "Message (AR): $MESSAGE_AR"
echo "Message (EN): $MESSAGE_EN"
[ -n "$END_TIME" ] && echo "Estimated completion: $END_TIME"
```

**File**: `scripts/disable-maintenance.sh` (new file)

```bash
#!/bin/bash
# Disable maintenance mode

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "✅ Disabling maintenance mode..."

cd "$PROJECT_ROOT"
sed -i.bak 's/MAINTENANCE_MODE=true/MAINTENANCE_MODE=false/' apps/web/.env.production

# Remove nginx flag file
if [ -n "$VPS_HOST" ]; then
  ssh "$VPS_USER@$VPS_HOST" "rm -f /etc/nginx/maintenance.flag && sudo nginx -s reload"
fi

echo "🎉 Maintenance mode disabled - system is live!"
```

#### 1.6 Docker Configuration Updates

**File**: `docker-compose.production.yml` (modify)

Add volume mount for maintenance page and flag:

```yaml
services:
  nginx:
    # ... existing configuration
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./apps/web/public/maintenance.html:/var/www/html/maintenance.html:ro
      - maintenance-flag:/etc/nginx:rw
      # ... other volumes

volumes:
  maintenance-flag:
    driver: local
```

---

### Phase 2: Enhanced Features (Optional)
**Goal**: Admin panel control and scheduled maintenance

#### 2.1 Admin Panel Toggle Interface

**File**: `apps/web/src/app/admin/system/page.tsx` (new page)

Admin dashboard section to:
- View current maintenance status
- Enable/disable maintenance mode
- Set maintenance message (AR/EN)
- Set estimated completion time
- View maintenance history/logs
- Configure IP whitelist

**File**: `apps/api/src/admin/admin.controller.ts` (add endpoints)

```typescript
@Post('maintenance/enable')
@Roles(Role.ADMIN)
async enableMaintenance(@Body() dto: EnableMaintenanceDto) {
  // Update system config or write to flag file
  // Log maintenance event
  // Notify admins
}

@Post('maintenance/disable')
@Roles(Role.ADMIN)
async disableMaintenance() {
  // Clear maintenance flag
  // Log event
  // Notify admins
}

@Get('maintenance/status')
@Roles(Role.ADMIN)
async getMaintenanceStatus() {
  // Return current status and configuration
}
```

#### 2.2 Scheduled Maintenance

**File**: `packages/shared/src/maintenance/scheduled-maintenance.dto.ts` (new)

```typescript
export interface ScheduledMaintenanceDto {
  startTime: string;        // ISO timestamp
  endTime: string;          // ISO timestamp
  messageAr: string;
  messageEn: string;
  notifyUsers: boolean;     // Send email notification
  autoEnable: boolean;      // Automatically enable at startTime
  autoDisable: boolean;     // Automatically disable at endTime
}
```

**Implementation**: Use BullMQ job scheduler to:
- Automatically enable maintenance at scheduled time
- Send notification emails to users
- Automatically disable after completion
- Log all events

#### 2.3 Maintenance History & Logs

**File**: `packages/database/prisma/schema.prisma` (add new model)

```prisma
model maintenance_events {
  id              String    @id @default(cuid())
  eventType       String    // "ENABLED" | "DISABLED" | "SCHEDULED"
  triggeredBy     String?   // admin user ID or "AUTOMATIC"
  triggeredAt     DateTime  @default(now())
  messageAr       String?
  messageEn       String?
  scheduledStart  DateTime?
  scheduledEnd    DateTime?
  actualStart     DateTime?
  actualEnd       DateTime?
  affectedUsers   Int?      // count of active sessions interrupted
  notes           String?

  @@index([triggeredAt])
  @@map("maintenance_events")
}
```

---

### Phase 3: Advanced Features (Future)
**Goal**: Granular control and notifications

#### 3.1 Partial Maintenance Mode
- Maintenance for specific features/routes
- API-only maintenance (keep web browsing active)
- Gradual rollout with percentage-based traffic routing

#### 3.2 User Notifications
- In-app banner warning before scheduled maintenance
- Email notifications to active users
- WebSocket push for real-time alerts
- Countdown timer in user dashboard

#### 3.3 Maintenance Templates
- Pre-configured templates for common scenarios:
  - "Database Migration" (2-3 hours)
  - "Quick Update" (15 minutes)
  - "Emergency Patch" (unknown duration)
  - "Scheduled Upgrade" (with specific end time)

---

## Technical Considerations

### Security
- **IP Whitelist Validation**: Validate IP format, support CIDR notation
- **Admin Authentication**: Require 2FA for maintenance mode changes
- **Audit Logging**: Log all maintenance mode changes with user ID and timestamp
- **Rate Limiting**: Prevent abuse of maintenance toggle API

### Performance
- **Static HTML**: Maintenance page loads instantly (no JS dependencies)
- **CDN Caching**: Optionally serve from CDN for global reach
- **Nginx-First**: Check maintenance flag before proxying to Next.js

### Reliability
- **Fallback Layers**:
  1. Nginx flag file (works even if Next.js is down)
  2. Next.js middleware (dynamic control)
  3. Environment variable (restart required but most reliable)
- **Health Checks**: Always bypass maintenance mode for monitoring
- **Graceful Degradation**: If maintenance page fails, show basic HTML error page

### User Experience
- **Clear Messaging**: Explain what's happening and when it'll be done
- **Estimated Time**: Show countdown or estimated completion
- **Contact Info**: Provide support contact for urgent issues
- **Bilingual**: Arabic primary (RTL), English secondary
- **Mobile Responsive**: Works on all device sizes
- **Accessibility**: Screen reader compatible, high contrast

---

## Migration & Rollback Plan

### Deployment Steps
1. **Test in Local Environment**:
   ```bash
   cd /path/to/Sidra-Ai
   MAINTENANCE_MODE=true npm run dev
   # Verify maintenance page displays correctly
   ```

2. **Deploy to VPS**:
   ```bash
   # Copy maintenance page to nginx volume
   scp apps/web/public/maintenance.html sidra@vps:/path/to/nginx/html/

   # Update nginx config
   scp nginx/nginx.conf sidra@vps:/etc/nginx/nginx.conf
   sudo nginx -s reload

   # Update environment variables
   # Test toggle scripts
   ```

3. **Test Maintenance Mode**:
   ```bash
   ./scripts/enable-maintenance.sh "تحديث سريع" "Quick update" "2026-01-12T18:00:00Z"
   # Verify page displays
   # Test admin IP bypass
   ./scripts/disable-maintenance.sh
   ```

### Rollback Plan
If issues occur:
1. **Immediate**: `rm /etc/nginx/maintenance.flag && sudo nginx -s reload`
2. **Revert nginx config**: `sudo nginx -s reload` with previous config
3. **Disable env var**: Set `MAINTENANCE_MODE=false` and restart containers

---

## Testing Checklist

### Unit Tests
- [ ] Middleware correctly detects maintenance mode
- [ ] IP whitelist parsing and matching
- [ ] Countdown timer calculation

### Integration Tests
- [ ] Maintenance page displays when mode is enabled
- [ ] Health checks still work during maintenance
- [ ] Admin IPs can bypass maintenance
- [ ] Static assets load correctly
- [ ] Maintenance toggle scripts work on VPS

### User Acceptance Tests
- [ ] Arabic text displays correctly (RTL)
- [ ] English fallback works
- [ ] Mobile responsive design
- [ ] Countdown timer updates correctly
- [ ] Contact links work
- [ ] Logo displays properly

### Load Tests
- [ ] Nginx serves static page efficiently (>10k req/s)
- [ ] No performance impact when maintenance mode is off
- [ ] Flag file check is fast (<1ms)

---

## Documentation Requirements

### User Documentation
- **For End Users**: Notification about scheduled maintenance
- **For Admins**: How to enable/disable maintenance mode
- **For Developers**: How to test locally, deploy changes

### Code Documentation
- Comment all maintenance-related environment variables
- Document middleware logic
- Explain nginx configuration changes

### Operations Runbook
```markdown
# Maintenance Mode Operations

## Enabling Maintenance (Planned Update)
1. Notify users 24-48 hours in advance
2. Schedule maintenance during low-traffic hours (2-5 AM)
3. Run: `./scripts/enable-maintenance.sh "رسالة عربية" "English message" "2026-01-15T03:00:00Z"`
4. Verify maintenance page displays
5. Proceed with deployment
6. Run: `./scripts/disable-maintenance.sh`
7. Verify system is accessible

## Emergency Maintenance
1. SSH to VPS: `ssh sidra@148.135.136.4`
2. Create flag: `touch /etc/nginx/maintenance.flag`
3. Reload nginx: `sudo nginx -s reload`
4. Fix critical issue
5. Remove flag: `rm /etc/nginx/maintenance.flag && sudo nginx -s reload`
```

---

## Success Metrics

### Immediate (Phase 1)
- Maintenance page loads in <100ms
- Zero user-facing errors during deployments
- 100% uptime for health check endpoints
- Admin bypass works reliably

### Long-term (Phase 2-3)
- Reduced user complaints during maintenance windows
- Scheduled maintenance completion within estimated time
- Audit log for all maintenance events
- Template library reduces setup time to <2 minutes

---

## Dependencies

### Required Packages
- None (Phase 1 uses only built-in features)

### Optional Packages (Phase 2)
- `@nestjs/bullmq` - For scheduled maintenance jobs
- `nodemailer` - For user notifications (already in use)

---

## Timeline Estimates

### Phase 1 (MVP): ~4-6 hours
- Static maintenance page: 1-2 hours
- Middleware implementation: 1 hour
- Nginx configuration: 1 hour
- Toggle scripts: 1 hour
- Testing: 1-2 hours

### Phase 2 (Enhanced): ~8-12 hours
- Admin panel UI: 3-4 hours
- API endpoints: 2-3 hours
- Scheduled maintenance: 2-3 hours
- Database schema & logging: 1-2 hours

### Phase 3 (Advanced): ~16-24 hours
- Partial maintenance modes: 6-8 hours
- User notification system: 6-8 hours
- Template management: 4-8 hours

---

## Next Steps

1. **Review & Approval**: Review this plan and approve Phase 1 implementation
2. **Create Maintenance Page**: Design and build the static HTML page
3. **Implement Middleware**: Add Next.js maintenance detection
4. **Configure Nginx**: Update nginx.conf with maintenance mode logic
5. **Create Scripts**: Build enable/disable helper scripts
6. **Test Locally**: Verify all components work in development
7. **Deploy to VPS**: Roll out to production with testing
8. **Document**: Create runbook for operations team

---

## Questions for Discussion

1. **Branding**: Do you have specific colors/styling for the maintenance page?
2. **Messaging**: Default maintenance messages in Arabic/English?
3. **Contact Info**: Which email/phone should be displayed for urgent issues?
4. **Admin IPs**: Which IP addresses should bypass maintenance mode?
5. **Notification**: Should we email users before scheduled maintenance?
6. **Phase Priority**: Start with Phase 1 only, or include Phase 2 admin panel?

---

**Document Version**: 1.0
**Last Updated**: 2026-01-12
**Author**: Claude & Sidra Team
