# 🎓 Sidra Platform - Complete Demo Guide

## 📚 Table of Contents
1. [Quick Start](#quick-start)
2. [Demo Credentials](#demo-credentials)
3. [Platform Features](#platform-features)
4. [Support Ticket System](#support-ticket-system)
5. [Testing Scenarios](#testing-scenarios)
6. [Demo Data](#demo-data)

---

## 🚀 Quick Start

### 1. Start the Platform

**Terminal 1 - API:**
```bash
cd /Users/omerheathrow/Sidra-Ai
npm run dev --workspace=api
```
Wait for: "Nest application successfully started"

**Terminal 2 - Web:**
```bash
cd /Users/omerheathrow/Sidra-Ai
npm run dev --workspace=web
```
Wait for: "Ready in X.Xs"

**Access:** http://localhost:3001

---

## 🔐 Demo Credentials

### All Accounts Use Same Password: `Demo2024!`

| Role | Email | Phone | Features |
|------|-------|-------|----------|
| **ADMIN** | admin@sidra.com | +966599999999 | Full platform access, manage all tickets |
| **TEACHER** | teacher@sidra.com | +966500000002 | Teaching, wallet, own tickets |
| **PARENT** | parent@sidra.com | +966500000004 | Book sessions, manage children, tickets |
| **STUDENT** | student@sidra.com | +966500000006 | Independent bookings, tickets |

**📄 Full Details:** [DEMO-CREDENTIALS.md](DEMO-CREDENTIALS.md)
**⚡ Quick Reference:** [QUICK-LOGIN.md](QUICK-LOGIN.md)

---

## 🌟 Platform Features

### ✅ Implemented & Working

#### User Management
- ✅ Email/Phone login
- ✅ Role-based access (Admin, Teacher, Parent, Student)
- ✅ Profile management
- ✅ Verification system

#### Teaching System
- ✅ Teacher profiles with subjects & pricing
- ✅ Availability scheduling
- ✅ Session booking
- ✅ Package system (Starter, Standard, Smart, Premium)
- ✅ Ratings & reviews

#### Financial System
- ✅ Digital wallet
- ✅ Deposits & withdrawals
- ✅ Transaction history
- ✅ Package purchases
- ✅ Escrow system for bookings

#### Support System (NEW! 🎉)
- ✅ **Ticket creation** (all users)
- ✅ **Ticket queue** (admin)
- ✅ **Status management** (7 statuses)
- ✅ **Priority levels** (4 levels)
- ✅ **SLA tracking** with breach indicators
- ✅ **Escalation system** (L1 → L2 → L3)
- ✅ **Assignment workflow**
- ✅ **Internal notes** (admin-only)
- ✅ **Message threading**
- ✅ **Status history** (complete audit trail)

#### Admin Features
- ✅ Dashboard with analytics
- ✅ User management
- ✅ Teacher application approval
- ✅ Booking management
- ✅ Financial oversight
- ✅ Support ticket queue
- ✅ Dispute handling
- ✅ Audit logs

---

## 🎫 Support Ticket System

### User Capabilities

**All Users Can:**
- Create support tickets with evidence
- View their own tickets
- Reply to tickets
- Close tickets they created
- Reopen SUPPORT type tickets (not DISPUTE)
- Track ticket status in real-time

**Admins Can:**
- View all tickets in centralized queue
- Filter by status, priority, keyword
- View comprehensive stats dashboard
- Assign tickets to support agents
- Update status, priority, escalation level
- Add internal notes (hidden from users)
- Add resolution notes
- Escalate through levels (L1 → L2 → L3)

### Ticket Categories
1. **ACADEMIC** - Curriculum, teaching methods, learning
2. **SESSION** - Scheduling, attendance, session quality
3. **FINANCIAL** - Payments, refunds, wallet issues
4. **TECHNICAL** - Platform bugs, login, performance
5. **BEHAVIORAL** - Conduct, professionalism
6. **GENERAL** - Everything else

### Priority Levels
- **CRITICAL** - SLA: 2 hours (financial, safety)
- **HIGH** - SLA: 12 hours (session disruptions)
- **NORMAL** - SLA: 24 hours (general support)
- **LOW** - SLA: 72 hours (feature requests)

### Ticket Statuses
1. **OPEN** - Newly created, awaiting assignment
2. **IN_PROGRESS** - Someone is working on it
3. **WAITING_FOR_CUSTOMER** - Waiting for user reply
4. **WAITING_FOR_SUPPORT** - Waiting for support reply
5. **RESOLVED** - Issue resolved, awaiting close
6. **CLOSED** - Fully closed
7. **CANCELLED** - User cancelled

### Escalation Levels
- **L1** - Basic support / Teacher
- **L2** - Advanced support / Support role
- **L3** - Management / Admin

---

## 🧪 Testing Scenarios

### Scenario 1: User Creates Ticket

**As Parent:**
1. Login: parent@sidra.com / Demo2024!
2. Navigate: الدعم الفني (Support)
3. Click: "Create Ticket"
4. Fill form:
   ```
   Category: Technical
   Priority: High
   Subject: Payment not processing
   Description: I tried to add 10,000 SDG but payment failed
   Evidence: https://example.com/payment-error.png
   ```
5. Submit
6. **Verify:**
   - Redirected to ticket detail
   - Ticket has ID: TKT-2512-000X
   - Status shows "Open"
   - Can add messages

### Scenario 2: Admin Manages Ticket

**As Admin:**
1. Login: admin@sidra.com / Demo2024!
2. Navigate: العمليات → التذاكر والدعم
3. **View Stats:**
   - Total: 5+ tickets
   - Open: X tickets
   - In Progress: X tickets
   - SLA Breach: 1 ticket (red)
4. Click on: TKT-2512-0002 (Financial, SLA Breached)
5. **Verify:**
   - Red "SLA Breach" badge
   - Priority: CRITICAL
   - Assigned to: Admin
   - 3 messages (1 internal note in yellow)
6. **Take Actions:**
   - Click "Escalate Ticket" → L2 becomes L3
   - Change Priority to NORMAL
   - Add Internal Note: "Spoke with finance team"
   - Add Public Reply: "Processing your withdrawal now"
   - Change Status to RESOLVED
   - Add Resolution Note: "Withdrawal processed successfully"
7. **Verify:**
   - All changes saved
   - Status history updated
   - Internal note NOT visible to teacher

### Scenario 3: Test SLA Breach

**As Admin:**
1. View ticket: TKT-2512-0002
2. **Verify SLA Breach Indicators:**
   - Red "SLA Breach" badge on card
   - Red count in stats (SLA Breach: 1)
   - SLA Deadline shows past time
   - `slaBreach: true` in data

### Scenario 4: Test Internal Notes

**As Admin:**
1. Open any ticket
2. Scroll to "Add Internal Note" (yellow form)
3. Type: "Checking with technical team"
4. Submit
5. **Verify:**
   - Note appears with yellow background
   - Badge: "Internal Note"
6. Logout

**As Parent/Teacher:**
1. Login with ticket creator account
2. Open same ticket
3. **Verify:**
   - Internal note is NOT visible
   - Only public messages shown

### Scenario 5: Test Assignment

**As Admin:**
1. Open unassigned ticket
2. Click "Assign to Agent"
3. Select agent from dropdown
4. Assign
5. **Verify:**
   - "Assigned to: [Name]" displayed
   - Agent name shown in ticket card
   - Agent can now manage ticket

### Scenario 6: Test Filtering

**As Admin:**
1. Go to ticket queue
2. **Test Search:**
   - Type: "TKT-2512" → Shows all tickets
   - Type: "withdrawal" → Shows financial ticket
   - Type: "Khalid" → Shows parent's tickets
3. **Test Status Filter:**
   - Select: "In Progress" → Shows only IN_PROGRESS
   - Select: "All Statuses" → Shows all
4. **Test Priority Filter:**
   - Select: "Critical" → Shows only CRITICAL
   - Select: "All Priorities" → Shows all
5. **Verify:**
   - Count updates: "Showing X of Y tickets"
   - Results match filters

---

## 📊 Demo Data

### Pre-Created Users (4)
- 1 Admin (full access)
- 1 Teacher (verified, 2 subjects)
- 1 Parent (50k balance, 1 child)
- 1 Student (independent)

### Pre-Created Tickets (5)

| ID | Creator | Category | Priority | Status | Notes |
|----|---------|----------|----------|--------|-------|
| TKT-2512-0001 | Parent | TECHNICAL | HIGH | OPEN | New ticket, no response yet |
| TKT-2512-0002 | Teacher | FINANCIAL | CRITICAL | IN_PROGRESS | SLA BREACHED, assigned, has internal note |
| TKT-2512-0003 | Parent | SESSION | NORMAL | WAITING_FOR_CUSTOMER | Admin requested info |
| TKT-2512-0004 | Teacher | ACADEMIC | LOW | RESOLVED | Complete with resolution |
| TKT-2512-0005 | Parent | GENERAL | LOW | CLOSED | Fully closed |

### Platform Content
- 1 Curriculum (Sudan National)
- 3 Stages (Primary, Intermediate, Secondary)
- 12 Grades (Grade 1-12)
- 4 Subjects (Math, English, Science, Arabic)
- 4 Package Tiers (5, 10, 12, 15 sessions)

---

## 🎯 Complete Feature Test Checklist

### Support Tickets - User Flow
- [ ] Create ticket (all categories)
- [ ] Add evidence URLs
- [ ] View ticket list
- [ ] Click on ticket to view details
- [ ] Add message to ticket
- [ ] Add attachment to message
- [ ] Close own ticket
- [ ] Reopen SUPPORT ticket
- [ ] Verify cannot reopen DISPUTE ticket
- [ ] Verify cannot add message to CLOSED ticket
- [ ] View ticket status history

### Support Tickets - Admin Flow
- [ ] View ticket queue
- [ ] See stats dashboard (5 cards)
- [ ] Search by ticket ID
- [ ] Search by subject keywords
- [ ] Search by user name
- [ ] Filter by status (7 statuses)
- [ ] Filter by priority (4 levels)
- [ ] Verify "Showing X of Y" count
- [ ] Click refresh button
- [ ] Open ticket detail
- [ ] View all ticket metadata
- [ ] Update ticket status
- [ ] Update ticket priority
- [ ] Update escalation level
- [ ] Add resolution note
- [ ] Assign ticket to agent
- [ ] View agent dropdown (loads users)
- [ ] Escalate ticket (L1→L2→L3)
- [ ] Verify cannot escalate beyond L3
- [ ] Add internal note
- [ ] Verify internal note has yellow bg
- [ ] Add public reply
- [ ] View message thread (chronological)
- [ ] View status history timeline
- [ ] See SLA breach indicator (red badge)
- [ ] See SLA deadline
- [ ] See evidence links
- [ ] See creator info
- [ ] See assigned agent info

### Support Tickets - Permission Tests
- [ ] Regular user sees only own tickets
- [ ] Regular user cannot access /admin/support-tickets
- [ ] Regular user cannot see internal notes
- [ ] Admin sees all tickets
- [ ] Support role sees all tickets
- [ ] Admin can update any ticket
- [ ] Admin can assign tickets
- [ ] Admin can escalate tickets

### Navigation Tests
- [ ] Parent sees "الدعم الفني" in menu
- [ ] Teacher sees "الدعم الفني" in menu
- [ ] Student sees "الدعم الفني" in menu
- [ ] Admin sees "التذاكر والدعم" in Operations
- [ ] All links navigate correctly
- [ ] Active page highlighted

### Other Platform Features
- [ ] Login with email
- [ ] Login with phone
- [ ] View dashboard (each role)
- [ ] Teacher: View sessions
- [ ] Teacher: Check wallet
- [ ] Teacher: Manage availability
- [ ] Parent: Search teachers
- [ ] Parent: View children
- [ ] Parent: Check wallet
- [ ] Parent: View packages
- [ ] Student: Search teachers
- [ ] Student: View bookings
- [ ] Admin: View all bookings
- [ ] Admin: View all users
- [ ] Admin: Manage teachers

---

## 📱 Mobile Testing

Test responsive design on:
- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] iPad (Safari)
- [ ] Desktop Chrome
- [ ] Desktop Firefox
- [ ] Desktop Safari

**Key Tests:**
- Navigation menu collapses
- Forms are usable
- Buttons are tappable
- Text is readable
- Tables scroll horizontally
- Modals are centered

---

## 🔧 Troubleshooting

### Can't see tickets?
```bash
# Re-run seed
cd packages/database
npx tsx prisma/seed-comprehensive-demo.ts
```

### API not starting?
```bash
# Check database connection
npx prisma db execute --stdin <<< "SELECT 1;"

# Regenerate Prisma Client
npx prisma generate
```

### Build errors?
```bash
# Clean and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📖 Documentation Index

1. **[DEMO-CREDENTIALS.md](DEMO-CREDENTIALS.md)** - Full credentials & testing guide
2. **[QUICK-LOGIN.md](QUICK-LOGIN.md)** - Quick reference card
3. **[START-PLATFORM.md](START-PLATFORM.md)** - Startup & troubleshooting
4. **[PHASE-3-INTEGRATION-TESTING.md](PHASE-3-INTEGRATION-TESTING.md)** - Technical testing
5. **[COMPLETE-PLATFORM-GUIDE.md](COMPLETE-PLATFORM-GUIDE.md)** - This file

---

## 🎉 Summary

### What's Working
✅ **Phase 0**: Database schema (4 tables, 5 enums)
✅ **Phase 1**: Backend API (14 endpoints)
✅ **Phase 2**: Frontend UI (5 pages, 14 components)
✅ **Phase 3**: Integration & testing (all verified)
✅ **Demo Data**: 5 tickets, 4 users, complete platform data

### Password for ALL Accounts
```
Demo2024!
```

### Quick Test
1. Start API + Web
2. Login: admin@sidra.com / Demo2024!
3. Go to: /admin/support-tickets
4. Verify: 5 tickets visible
5. Click: TKT-2512-0002 (SLA breached)
6. Verify: Red badge, internal note, 3 messages

---

**Platform Ready! ✨**

Start exploring at: http://localhost:3001
