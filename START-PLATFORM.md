# 🚀 Sidra Platform - Startup Guide

## Prerequisites

Before starting, ensure you have:
- ✅ Node.js 18+ installed
- ✅ PostgreSQL database running
- ✅ All dependencies installed (`npm install` in root)
- ✅ Database seeded with demo data

---

## Step-by-Step Startup

### Step 1: Start the API Server

Open a new terminal window:

```bash
cd /Users/omerheathrow/Sidra-Ai
npm run dev --workspace=api
```

**Expected Output:**
```
[Nest] INFO Starting Nest application...
[Nest] INFO AppModule dependencies initialized
[Nest] INFO Mapped {/api/auth/login, POST} route
[Nest] INFO Nest application successfully started
[Nest] INFO Application is running on: http://localhost:3000
```

**Troubleshooting:**
- If port 3000 is busy: Kill the process or change port in `.env`
- If database error: Check PostgreSQL is running
- If module errors: Run `npm install` again

---

### Step 2: Start the Web App

Open another terminal window:

```bash
cd /Users/omerheathrow/Sidra-Ai
npm run dev --workspace=web
```

**Expected Output:**
```
> web@0.1.0 dev
> next dev

  ▲ Next.js 16.0.10
  - Local:        http://localhost:3001
  - Environments: .env

 ✓ Ready in 2.1s
```

**Troubleshooting:**
- If port 3001 is busy: Next.js will auto-increment to 3002
- If build errors: Run `npm run build --workspace=web` to check for issues

---

### Step 3: Access the Platform

Open your browser and navigate to:

**🌐 http://localhost:3001**

You should see the Sidra login page.

---

## Quick Login Test

### Test 1: Admin Login
1. Go to http://localhost:3001/login
2. Enter:
   - Email: `admin@sidra.com`
   - Password: `Demo2024!`
3. Click Login
4. You should see the Admin Dashboard
5. Navigate to "العمليات" → "التذاكر والدعم"
6. Verify 5 tickets are visible

### Test 2: Parent Login
1. Logout (click logout in sidebar)
2. Enter:
   - Email: `parent@sidra.com`
   - Password: `Demo2024!`
3. Click Login
4. Navigate to "الدعم الفني" (Support)
5. Verify you see 3 tickets (only parent's tickets)

---

## Verify All Services

### Check API Health
```bash
curl http://localhost:3000
```
Should return: `{"message":"Sidra API is running"}`

### Check Database Connection
```bash
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM support_tickets;"
```
Should return: 5 tickets

### Check Web App
Visit: http://localhost:3001
Should load login page without errors

---

## Demo Data Verification

### Verify Support Tickets

**As Admin:**
1. Login as admin@sidra.com
2. Go to `/admin/support-tickets`
3. Check stats:
   - Total: 5
   - Open: 1
   - In Progress: 1
   - Waiting: 1 (for customer)
   - SLA Breach: 1 (red badge)
4. Click on TKT-2512-0002 (SLA breached ticket)
5. Verify you see:
   - Red "SLA Breach" badge
   - 3 messages (1 internal note highlighted yellow)
   - Assigned to System Admin
   - Escalation Level: L2

**As Parent:**
1. Login as parent@sidra.com
2. Go to `/support`
3. Verify you see only 3 tickets:
   - TKT-2512-0001 (OPEN)
   - TKT-2512-0003 (WAITING_FOR_CUSTOMER)
   - TKT-2512-0005 (CLOSED)
4. Click on TKT-2512-0003
5. Verify status is "Waiting for You"
6. Add a reply message
7. Verify status changes to "Waiting for Support"

**As Teacher:**
1. Login as teacher@sidra.com
2. Go to `/support`
3. Verify you see only 2 tickets:
   - TKT-2512-0002 (IN_PROGRESS)
   - TKT-2512-0004 (RESOLVED)
4. Click on TKT-2512-0002
5. Verify you CANNOT see the internal note (hidden from users)

---

## Create New Test Data

### Create a New Support Ticket

**As Parent:**
1. Login as parent@sidra.com
2. Go to `/support/new`
3. Fill form:
   - Category: "Session"
   - Priority: "High"
   - Subject: "Test ticket for demo"
   - Description: "This is a test ticket created during demo"
4. Click "Create Ticket"
5. Verify redirect to ticket detail page
6. Note the Ticket ID (should be TKT-2512-0006)

**As Admin:**
1. Login as admin@sidra.com
2. Go to `/admin/support-tickets`
3. Verify new ticket appears in queue
4. Total count should be 6 now
5. Click on the new ticket
6. Test actions:
   - Assign to yourself
   - Change priority to CRITICAL
   - Change status to IN_PROGRESS
   - Add internal note: "This is a test note"
   - Reply to customer
7. Verify all changes are saved

---

## Environment Variables Check

Ensure these are set in your `.env` files:

**Root `.env`:**
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
```

**apps/api/.env:**
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
PORT=3000
```

**apps/web/.env:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## Common Issues & Solutions

### Issue: "Cannot connect to database"
**Solution:**
```bash
# Check PostgreSQL is running
brew services list | grep postgresql
# or
sudo systemctl status postgresql

# Restart PostgreSQL
brew services restart postgresql
```

### Issue: "Port already in use"
**Solution:**
```bash
# Find process on port 3000
lsof -i :3000
# Kill it
kill -9 <PID>

# Or change port in apps/api/.env
PORT=3001
```

### Issue: "Module not found"
**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild packages
npm run build --workspace=@sidra/shared
npm run build --workspace=@sidra/database
```

### Issue: "Prisma Client not generated"
**Solution:**
```bash
cd packages/database
npx prisma generate
```

### Issue: "No tickets showing"
**Solution:**
```bash
# Re-run seed
cd packages/database
npx prisma db seed
npx tsx prisma/seed-comprehensive-demo.ts
```

---

## Performance Tips

### Speed up development:
1. Use `npm run dev` instead of `npm run build && npm start`
2. Keep both terminals open (API + Web)
3. Use browser DevTools for debugging
4. Enable hot reload in Next.js (default)

### Clear cache if needed:
```bash
# Clear Next.js cache
rm -rf apps/web/.next

# Clear Turbo cache
rm -rf .turbo

# Rebuild
npm run build
```

---

## Shutdown

### Graceful Shutdown:
1. Press `Ctrl+C` in API terminal
2. Press `Ctrl+C` in Web terminal
3. All services will stop cleanly

### Force Shutdown:
```bash
# Kill all Node processes (use with caution)
pkill -f node

# Kill specific ports
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

---

## Next Steps

After verifying the platform works:

1. **Test User Flows** - Follow [DEMO-CREDENTIALS.md](DEMO-CREDENTIALS.md)
2. **Test Support Tickets** - Create, reply, close, reopen
3. **Test Admin Features** - Assign, escalate, add internal notes
4. **Test All Roles** - Login as each user type
5. **Mobile Testing** - Test on mobile browsers
6. **Performance Testing** - Check load times

---

## Support

If you encounter issues:
1. Check both terminals for error messages
2. Review browser console (F12)
3. Check database is accessible
4. Verify all environment variables are set
5. Re-run seed if data is missing

---

**Platform**: Sidra Educational Platform
**Version**: Phase 0-3 Complete
**Last Updated**: December 2024

✨ **Ready to explore the platform!**
