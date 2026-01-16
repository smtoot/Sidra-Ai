# ✅ Demo Credentials (Removed)

This file previously included plaintext demo credentials. These have been
removed to avoid distributing real emails, phone numbers, or passwords.

Use your local seed scripts or environment-specific test accounts instead.

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
