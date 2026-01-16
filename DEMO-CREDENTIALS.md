# 🎯 Sidra Platform - Demo Credentials (Removed)

This document previously included plaintext demo credentials. These have been
removed to avoid distributing real emails, phone numbers, or passwords.

Use your local seed scripts or environment-specific test accounts instead.
- Manage wallet at `/student/wallet`
- View packages at `/student/packages`
- Add favorite teachers

---

## 🎫 Pre-Created Support Tickets

The demo includes 5 support tickets showcasing different statuses:

### Ticket 1: TKT-2512-0001 (OPEN)
- **Creator**: Parent
- **Category**: Technical
- **Priority**: HIGH
- **Subject**: Cannot upload profile picture
- **Status**: OPEN (awaiting admin response)
- **Messages**: 1 customer message

### Ticket 2: TKT-2512-0002 (IN_PROGRESS - SLA BREACHED)
- **Creator**: Teacher
- **Category**: Financial
- **Priority**: CRITICAL
- **Subject**: Withdrawal request not processed
- **Status**: IN_PROGRESS
- **Assigned To**: Admin
- **SLA**: BREACHED (shows red warning)
- **Messages**: 3 messages (including 1 internal note)
- **Escalation**: L2

### Ticket 3: TKT-2512-0003 (WAITING_FOR_CUSTOMER)
- **Creator**: Parent
- **Category**: Session
- **Priority**: NORMAL
- **Subject**: Teacher did not show up for scheduled session
- **Status**: WAITING_FOR_CUSTOMER
- **Assigned To**: Admin
- **Messages**: 1 admin message requesting info

### Ticket 4: TKT-2512-0004 (RESOLVED)
- **Creator**: Teacher
- **Category**: Academic
- **Priority**: LOW
- **Subject**: How to update my teaching subjects?
- **Status**: RESOLVED
- **Resolution**: Complete with notes
- **Messages**: 2 messages (resolved conversation)

### Ticket 5: TKT-2512-0005 (CLOSED)
- **Creator**: Parent
- **Category**: General
- **Priority**: LOW
- **Subject**: How do I cancel a booking?
- **Status**: CLOSED
- **Resolution**: Complete
- **Closed**: 3 days ago

---

## 🧪 Testing Workflows

### Support Ticket System Testing

#### As a User (Parent/Teacher/Student):
1. Login with any user account
2. Navigate to "الدعم الفني" (Support) in the menu
3. Click "Create Ticket"
4. Fill out the form:
   - Category: Choose from 6 options
   - Priority: CRITICAL, HIGH, NORMAL, LOW
   - Subject: Short description
   - Description: Detailed explanation
   - Evidence: Add screenshot URLs
5. Submit and verify redirect to ticket detail
6. View ticket in list with status badges
7. Add a message/reply
8. Close ticket (if you created it)

#### As Admin:
1. Login as admin@sidra.com
2. Navigate to "التذاكر والدعم" in Operations menu
3. View ticket queue with stats dashboard
4. Filter by:
   - Status (7 statuses)
   - Priority (4 levels)
   - Search (ticket ID, subject, user name)
5. Click on ticket to open detail
6. Update ticket:
   - Change status
   - Change priority
   - Change escalation level (L1/L2/L3)
   - Add resolution note
7. Assign ticket to agent
8. Escalate ticket (L1 → L2 → L3)
9. Add internal note (yellow form)
10. Reply to customer
11. Verify internal notes are hidden from users

---

## 📊 Demo Data Overview

### Platform Statistics
- **Total Users**: 4 (1 Admin, 1 Teacher, 1 Parent, 1 Student)
- **Teachers**: 1 verified teacher
- **Bookings**: 1 active booking
- **Packages**: 1 student package
- **Support Tickets**: 5 tickets (various statuses)
- **Wallet Balances**: Parent has 50,000 SDG

### Curriculum Data
- **Curriculum**: Sudanese National Curriculum
- **Stages**: Primary, Intermediate, Secondary
- **Grades**: Grade 1-12
- **Subjects**: Mathematics, English, Science, Arabic

### Package Tiers
- Starter Pack: 5 sessions (5% discount)
- Standard Pack: 10 sessions (8% discount)
- Smart Pack: 12 sessions (10% discount) ⭐ Featured
- Premium Pack: 15 sessions (15% discount)

---

## 🚀 Quick Start Guide

### Step 1: Start the Services

**Terminal 1 - API Server:**
```bash
cd apps/api
npm run dev
```
API will run on: http://localhost:3000

**Terminal 2 - Web App:**
```bash
cd apps/web
npm run dev
```
Web will run on: http://localhost:3001

### Step 2: Access the Platform
Open your browser and go to: http://localhost:3001

### Step 3: Login
Use any of the credentials above. All passwords are: `Demo2024!`

---

## 🎯 Feature Testing Checklist

### User Management
- [ ] Login with email
- [ ] Login with phone number
- [ ] View user profile
- [ ] Edit profile information

### Teacher Features
- [ ] View teacher dashboard
- [ ] Check pending booking requests
- [ ] View upcoming sessions
- [ ] Manage availability schedule
- [ ] Check wallet balance
- [ ] Request withdrawal
- [ ] View teaching subjects and prices

### Parent Features
- [ ] Search for teachers
- [ ] Book a session
- [ ] Purchase a package
- [ ] Manage children profiles
- [ ] View booking history
- [ ] Add funds to wallet
- [ ] Rate a completed session

### Admin Features
- [ ] View admin dashboard
- [ ] Manage all bookings
- [ ] View all transactions
- [ ] Approve teacher applications
- [ ] Handle disputes
- [ ] Manage support tickets
- [ ] View system audit logs

### Support Ticket Features
- [ ] Create ticket (all roles)
- [ ] View ticket list
- [ ] Filter tickets by status/priority
- [ ] Search tickets
- [ ] Add messages to tickets
- [ ] Close/reopen tickets (users)
- [ ] Assign tickets (admin)
- [ ] Update status/priority (admin)
- [ ] Escalate tickets (admin)
- [ ] Add internal notes (admin only)
- [ ] View SLA breach indicators
- [ ] View status history

---

## 📝 Testing Notes

### Known Demo Limitations
1. **Email notifications** - Not sent in demo mode (logged to console)
2. **SMS notifications** - Not sent in demo mode (logged to console)
3. **Payment gateway** - Mock payments only
4. **File uploads** - Use placeholder URLs
5. **Real-time updates** - Refresh page to see changes

### Demo Data Refresh
To reset all demo data to initial state:
```bash
cd packages/database
npx prisma migrate reset --force
npx prisma db seed
npx tsx prisma/seed-comprehensive-demo.ts
```

---

## 🆘 Support

If you encounter any issues:
1. Check that both API and Web servers are running
2. Verify database is accessible
3. Check browser console for errors
4. Ensure you're using the correct credentials
5. Try logging out and logging back in

---

## 📱 Mobile Testing

The platform is fully responsive. Test on:
- Desktop browsers (Chrome, Firefox, Safari)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Tablet devices

---

## 🎨 UI/UX Testing Points

### Navigation
- [ ] All menu items are clickable
- [ ] Active page is highlighted
- [ ] Navigation collapses on mobile
- [ ] Breadcrumbs work correctly

### Forms
- [ ] Validation messages appear
- [ ] Required fields are marked
- [ ] Submit buttons disable during submission
- [ ] Success/error messages display

### Support Tickets
- [ ] Status badges show correct colors
- [ ] Priority badges show correct colors
- [ ] SLA breach indicator is red
- [ ] Internal notes have yellow background
- [ ] Message thread is chronological
- [ ] Timestamps are formatted correctly

---

## 🔒 Security Notes

**IMPORTANT**: These are DEMO credentials only!

- Never use these credentials in production
- Change all passwords before going live
- The demo password `Demo2024!` is intentionally simple
- All demo data should be cleared before production deployment

---

## ✅ Demo Verification Checklist

After seeding, verify:
- [ ] Can login as Admin
- [ ] Can login as Teacher
- [ ] Can login as Parent
- [ ] Can login as Student
- [ ] 5 support tickets visible in admin queue
- [ ] Ticket TKT-2512-0002 shows SLA breach
- [ ] Internal notes visible only to admin
- [ ] Stats dashboard shows correct counts
- [ ] All navigation links work
- [ ] Can create new tickets
- [ ] Can reply to tickets
- [ ] Can assign tickets (admin)

---

**Demo Data Version**: 1.0
**Last Updated**: December 2024
**Password for ALL accounts**: `Demo2024!`

🎉 **Happy Testing!**
