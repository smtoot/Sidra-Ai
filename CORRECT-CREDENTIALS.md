# ✅ ACTUAL WORKING CREDENTIALS

## 🔐 Real Demo Account Credentials

**IMPORTANT: Use these credentials, not the ones in other docs!**

### All Accounts Use: `password123`

---

## 📧 Email Login (Recommended)

| Role | Email | Password |
|------|-------|----------|
| **ADMIN** | admin@sidra.com | password123 |
| **TEACHER** | teacher@sidra.com | password123 |
| **PARENT** | parent@sidra.com | password123 |
| **STUDENT** | student@sidra.com | password123 |

---

## 📱 Phone Login (Alternative)

| Role | Phone Number | Password |
|------|--------------|----------|
| **ADMIN** | 0599999999 | password123 |
| **TEACHER** | 0500000002 | password123 |
| **PARENT** | 0500000004 | password123 |
| **STUDENT** | 0500000006 | password123 |

**Note:** Phone numbers do NOT have country code prefix. Use exactly as shown above.

---

## 🚀 Quick Login Test

### Method 1: Email (Easiest)
1. Go to: http://localhost:3001/login
2. Email: `admin@sidra.com`
3. Password: `password123`
4. Click Login

### Method 2: Phone Number
1. Go to: http://localhost:3001/login
2. Phone: `0599999999`
3. Password: `password123`
4. Click Login

---

## 👤 User Details

### ADMIN Account
- **Email**: admin@sidra.com
- **Phone**: 0599999999
- **Password**: password123
- **Name**: System Admin
- **Role**: ADMIN
- **Access**: Full platform, all support tickets, all features

### TEACHER Account
- **Email**: teacher@sidra.com
- **Phone**: 0500000002
- **Password**: password123
- **Name**: Ahmad Teacher
- **Role**: TEACHER
- **Access**: Teaching dashboard, own tickets, wallet, sessions
- **Has Tickets**: TKT-2512-0002 (IN_PROGRESS), TKT-2512-0004 (RESOLVED)

### PARENT Account
- **Email**: parent@sidra.com
- **Phone**: 0500000004
- **Password**: password123
- **Name**: Khalid Parent
- **Role**: PARENT
- **Access**: Parent dashboard, own tickets, children, bookings
- **Wallet**: 50,000 SDG
- **Has Tickets**: TKT-2512-0001 (OPEN), TKT-2512-0003 (WAITING_FOR_CUSTOMER), TKT-2512-0005 (CLOSED)

### STUDENT Account
- **Email**: student@sidra.com
- **Phone**: 0500000006
- **Password**: password123
- **Name**: Omar Student
- **Role**: STUDENT
- **Access**: Student dashboard, own tickets, bookings

---

## 🎫 Pre-Created Support Tickets

### View as Admin
Login as admin and go to: `/admin/support-tickets`

You should see **5 tickets**:
1. TKT-2512-0001 - Technical (OPEN) - Parent
2. TKT-2512-0002 - Financial (IN_PROGRESS, **SLA BREACHED**) - Teacher
3. TKT-2512-0003 - Session (WAITING_FOR_CUSTOMER) - Parent
4. TKT-2512-0004 - Academic (RESOLVED) - Teacher
5. TKT-2512-0005 - General (CLOSED) - Parent

### View as Parent
Login as parent and go to: `/support`

You should see **3 tickets** (only your own):
- TKT-2512-0001
- TKT-2512-0003
- TKT-2512-0005

### View as Teacher
Login as teacher and go to: `/support`

You should see **2 tickets** (only your own):
- TKT-2512-0002
- TKT-2512-0004

---

## ✅ Verification Steps

### Step 1: Test Admin Login
```
1. Open: http://localhost:3001/login
2. Email: admin@sidra.com
3. Password: password123
4. Click Login
5. Should see: Admin Dashboard
```

### Step 2: View Support Tickets
```
1. Click: العمليات (Operations) in sidebar
2. Click: التذاكر والدعم (Support Tickets)
3. Should see: 5 tickets with stats dashboard
```

### Step 3: Test SLA Breach Ticket
```
1. Click on: TKT-2512-0002
2. Should see:
   - Red "SLA Breach" badge
   - Priority: CRITICAL
   - Status: IN_PROGRESS
   - 3 messages (1 internal note in yellow)
```

### Step 4: Test Parent Login
```
1. Logout
2. Email: parent@sidra.com
3. Password: password123
4. Click Login
5. Navigate to: الدعم الفني (Support)
6. Should see: 3 tickets only
```

---

## 🔧 If Login Still Fails

### Reset Password Manually
```bash
npx tsx -e "
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
const prisma = new PrismaClient();

async function resetPassword() {
  const hash = await bcrypt.hash('password123', 10);
  await prisma.user.updateMany({
    data: { passwordHash: hash }
  });
  console.log('✅ All passwords reset to: password123');
  await prisma.\$disconnect();
}

resetPassword();
"
```

### Or Re-run Full Seed
```bash
cd packages/database
npx prisma migrate reset --force
npx prisma db seed
npx tsx prisma/seed-comprehensive-demo.ts
```

---

## 📝 Copy-Paste Ready

**Admin Login:**
```
Email: admin@sidra.com
Password: password123
```

**Teacher Login:**
```
Email: teacher@sidra.com
Password: password123
```

**Parent Login:**
```
Email: parent@sidra.com
Password: password123
```

**Student Login:**
```
Email: student@sidra.com
Password: password123
```

---

## ⚠️ Important Notes

1. **Use Email Login** - It's more reliable than phone login
2. **Password is lowercase** - `password123` not `Password123`
3. **No spaces** - Make sure there are no extra spaces
4. **Phone has no country code** - Use `0599999999` not `+966599999999`
5. **Case sensitive** - Email should be all lowercase

---

## 🎯 Quick Test Checklist

- [ ] Login as admin@sidra.com works
- [ ] Can see 5 tickets in admin queue
- [ ] TKT-2512-0002 has red SLA breach badge
- [ ] Login as parent@sidra.com works
- [ ] Parent sees only 3 tickets
- [ ] Login as teacher@sidra.com works
- [ ] Teacher sees only 2 tickets

---

**Working Credentials Confirmed! ✅**

All passwords: `password123`
All emails work: admin@, teacher@, parent@, student@ + sidra.com
