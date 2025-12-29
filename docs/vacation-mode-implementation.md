# Vacation Mode Implementation Plan

**Date:** December 29, 2024  
**Status:** ✅ Implementation Complete  
**Estimated Effort:** ~7.5 hours

---

## Overview

Allow teachers to temporarily pause their availability without losing their profile visibility or search ranking. When on vacation, teachers remain visible in search results with a "في إجازة" badge, but the booking button is disabled.

---

## Design Decisions

| Behavior | Implementation |
|----------|----------------|
| **Search visibility** | ✅ Teacher STAYS visible in search results |
| **Booking button** | 🔒 Disabled with "في إجازة" message |
| **Profile visibility** | ✅ Fully accessible with vacation badge |
| **Return date** | ⚠️ **MANDATORY** - Teacher must select |
| **Maximum period** | ⏱️ Admin-configurable (default: 21 days) |
| **Auto-return** | ✅ Scheduler auto-disables after expiry |
| **Re-enable** | Teacher must manually toggle again if still unavailable |

### Why This Approach?
- **Preserves search ranking** - Teacher doesn't lose visibility during absence
- **Prevents abuse** - Can't stay on vacation indefinitely
- **Transparent to students** - They see exactly when teacher returns
- **Admin control** - Platform can set reasonable limits

---

## Database Schema Changes

### TeacherProfile Model

Add the following fields to `TeacherProfile` in `schema.prisma`:

```prisma
model TeacherProfile {
  // ... existing fields ...
  
  // --- Vacation Mode ---
  isOnVacation       Boolean   @default(false)  // Primary toggle
  vacationStartDate  DateTime?                   // When vacation started
  vacationEndDate    DateTime?                   // REQUIRED return date when enabling
  vacationReason     String?                     // Optional internal note
}
```

### SystemSettings Model

Add to `SystemSettings`:

```prisma
model SystemSettings {
  // ... existing fields ...
  
  // --- Vacation Settings ---
  maxVacationDays    Int       @default(21)     // Maximum allowed vacation period
}
```

---

## Backend Implementation

### 1. Teacher Service (`teacher.service.ts`)

```typescript
async updateVacationMode(userId: string, dto: UpdateVacationModeDto) {
  const profile = await this.prisma.teacherProfile.findUnique({
    where: { userId }
  });
  
  if (!profile) throw new NotFoundException('Teacher profile not found');
  
  if (dto.isOnVacation) {
    // Validate return date is provided
    if (!dto.returnDate) {
      throw new BadRequestException('يجب تحديد تاريخ العودة');
    }
    
    // Get max vacation days from system settings
    const settings = await this.prisma.systemSettings.findUnique({
      where: { id: 'default' }
    });
    const maxDays = settings?.maxVacationDays || 21;
    
    // Calculate days difference
    const returnDate = new Date(dto.returnDate);
    const now = new Date();
    const diffDays = Math.ceil((returnDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) {
      throw new BadRequestException('تاريخ العودة يجب أن يكون في المستقبل');
    }
    
    if (diffDays > maxDays) {
      throw new BadRequestException(`الحد الأقصى لفترة الإجازة هو ${maxDays} يوم`);
    }
    
    return this.prisma.teacherProfile.update({
      where: { userId },
      data: {
        isOnVacation: true,
        vacationStartDate: new Date(),
        vacationEndDate: returnDate,
        vacationReason: dto.reason || null
      }
    });
  } else {
    // Disable vacation mode
    return this.prisma.teacherProfile.update({
      where: { userId },
      data: {
        isOnVacation: false,
        vacationStartDate: null,
        vacationEndDate: null,
        vacationReason: null
      }
    });
  }
}

async getVacationMode(userId: string) {
  const profile = await this.prisma.teacherProfile.findUnique({
    where: { userId },
    select: {
      isOnVacation: true,
      vacationStartDate: true,
      vacationEndDate: true,
      vacationReason: true
    }
  });
  
  if (!profile) throw new NotFoundException('Teacher profile not found');
  return profile;
}

async getVacationSettings() {
  const settings = await this.prisma.systemSettings.findUnique({
    where: { id: 'default' }
  });
  return {
    maxVacationDays: settings?.maxVacationDays || 21
  };
}
```

### 2. Teacher Controller (`teacher.controller.ts`)

```typescript
@Get('vacation-mode')
@UseGuards(JwtAuthGuard)
getVacationMode(@Request() req) {
  return this.teacherService.getVacationMode(req.user.userId);
}

@Patch('vacation-mode')
@UseGuards(JwtAuthGuard)
updateVacationMode(@Request() req, @Body() dto: UpdateVacationModeDto) {
  return this.teacherService.updateVacationMode(req.user.userId, dto);
}

@Get('vacation-settings')
@UseGuards(JwtAuthGuard)
getVacationSettings() {
  return this.teacherService.getVacationSettings();
}
```

### 3. Booking Service (`booking.service.ts`)

Add validation in `createBooking` method:

```typescript
// Check if teacher is on vacation
const teacherProfile = await this.prisma.teacherProfile.findUnique({
  where: { id: teacherId }
});

if (teacherProfile.isOnVacation) {
  const returnDate = teacherProfile.vacationEndDate 
    ? format(teacherProfile.vacationEndDate, 'dd MMM yyyy')
    : '';
  throw new BadRequestException(
    `المعلم في إجازة حالياً${returnDate ? ` حتى ${returnDate}` : ''}. يرجى المحاولة لاحقاً.`
  );
}
```

### 4. Marketplace Service (`marketplace.service.ts`)

**DO NOT filter vacation teachers from search.** Include vacation status in returned data:

```typescript
// In getTeacherPublicProfile return:
return {
  // ... existing fields ...
  isOnVacation: teacher.isOnVacation,
  vacationEndDate: teacher.vacationEndDate,
};
```

### 5. Vacation Scheduler (`vacation.scheduler.ts`)

Create new file:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VacationScheduler {
  private readonly logger = new Logger(VacationScheduler.name);

  constructor(private prisma: PrismaService) {}

  // Run every hour at minute 0
  @Cron(CronExpression.EVERY_HOUR)
  async handleVacationExpiry() {
    const now = new Date();
    
    const expiredVacations = await this.prisma.teacherProfile.updateMany({
      where: {
        isOnVacation: true,
        vacationEndDate: { lte: now }
      },
      data: {
        isOnVacation: false,
        vacationStartDate: null,
        vacationEndDate: null,
        vacationReason: null
      }
    });

    if (expiredVacations.count > 0) {
      this.logger.log(`Auto-returned ${expiredVacations.count} teachers from vacation`);
    }
  }
}
```

---

## Frontend Implementation

### 1. VacationModeSettings Component

Create `apps/web/src/components/teacher/settings/VacationModeSettings.tsx`:

**When vacation is OFF:**
```
┌─────────────────────────────────────────────────────────────┐
│ 🏖️ وضع الإجازة                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  عند تفعيل وضع الإجازة:                                     │
│  • ستظهر في نتائج البحث مع شارة "في إجازة"                  │
│  • زر الحجز سيكون معطلاً للطلاب                            │
│  • الحجوزات المؤكدة ستبقى كما هي                            │
│                                                             │
│  ┌─────────────────────────────────────────┐               │
│  │  [🔘] تفعيل وضع الإجازة                 │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
│  📅 تاريخ العودة (مطلوب)                                    │
│  ┌─────────────────────────────────────────┐               │
│  │  [Date Picker - max 21 days]            │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
│  ⚠️ الحد الأقصى لفترة الإجازة: 21 يوم                       │
│  💡 سيتم إيقاف وضع الإجازة تلقائياً في تاريخ العودة          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**When vacation is ON:**
```
┌─────────────────────────────────────────────────────────────┐
│ 🏖️ وضع الإجازة                           ✅ مفعّل           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  🌴 أنت في إجازة حالياً                              │ │
│  │                                                       │ │
│  │  بدأت: 29 ديسمبر 2024                                │ │
│  │  تنتهي: 15 يناير 2025 (17 يوم متبقي)                 │ │
│  │                                                       │ │
│  │  [إنهاء الإجازة الآن]                                │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. Teacher Settings Page

Add component to `apps/web/src/app/teacher/settings/page.tsx`:

```tsx
import { VacationModeSettings } from '@/components/teacher/settings/VacationModeSettings';

// In the settings list:
<VacationModeSettings isReadOnly={isReadOnly} />
```

### 3. Teacher Dashboard Banner

Add to `apps/web/src/app/teacher/page.tsx`:

```tsx
{profile.isOnVacation && (
  <Card className="border-amber-200 bg-amber-50 mb-6">
    <CardContent className="p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-100 rounded-full">
          <Palmtree className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h3 className="font-bold text-amber-900">وضع الإجازة مفعّل</h3>
          <p className="text-sm text-amber-700">
            أنت مرئي للطلاب لكن الحجز معطل
            {profile.vacationEndDate && ` • العودة: ${format(new Date(profile.vacationEndDate), 'dd MMM')}`}
          </p>
        </div>
      </div>
      <Link href="/teacher/settings">
        <Button variant="outline" size="sm">إدارة</Button>
      </Link>
    </CardContent>
  </Card>
)}
```

### 4. Teacher Public Profile

Update `TeacherProfileView.tsx`:

```tsx
{teacher.isOnVacation && (
  <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
    <Palmtree className="w-4 h-4" />
    في إجازة
    {teacher.vacationEndDate && (
      <span className="text-amber-600">
        • يعود {format(new Date(teacher.vacationEndDate), 'dd MMM')}
      </span>
    )}
  </div>
)}
```

**Disable booking button:**

```tsx
<Button 
  disabled={teacher.isOnVacation}
  className={teacher.isOnVacation ? 'opacity-50 cursor-not-allowed' : ''}
>
  {teacher.isOnVacation ? 'المعلم في إجازة' : 'احجز الآن'}
</Button>
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/teacher/vacation-mode` | Get current vacation status |
| `PATCH` | `/teacher/vacation-mode` | Enable/disable vacation mode |
| `GET` | `/teacher/vacation-settings` | Get max vacation days (for UI) |

---

## Admin Settings

Add to admin system settings:

```tsx
<div className="space-y-4">
  <Label>الحد الأقصى لفترة الإجازة (بالأيام)</Label>
  <Input 
    type="number" 
    value={maxVacationDays}
    onChange={(e) => setMaxVacationDays(Number(e.target.value))}
    min={1}
    max={90}
  />
  <p className="text-sm text-gray-500">
    أقصى مدة يمكن للمعلم تفعيل وضع الإجازة
  </p>
</div>
```

---

## Testing Checklist

### Automated Tests
- [ ] Enable vacation with valid date → Success
- [ ] Enable vacation without date → Error
- [ ] Enable vacation > max days → Error
- [ ] Search for vacation teacher → Visible with badge
- [ ] Try booking vacation teacher → Error message
- [ ] Auto-return after expiry → Scheduler works

### Manual Testing
- [ ] As Teacher: Enable vacation → Check dashboard banner
- [ ] As Student: Search → See teacher with badge → Try booking → Blocked
- [ ] As Admin: Change max days → Verify teacher sees new limit
- [ ] Wait for expiry → Verify auto-return works

---

## Implementation Order

1. **Schema changes** - Add fields to TeacherProfile and SystemSettings
2. **Backend API** - Teacher service and controller methods
3. **Booking validation** - Block booking for vacation teachers
4. **Scheduler** - Auto-return cron job
5. **Frontend settings** - VacationModeSettings component
6. **Dashboard integration** - Vacation banner
7. **Public profile** - Vacation badge and disabled button
8. **Admin settings** - Max vacation days configuration

---

## Effort Breakdown

| Task | Effort |
|------|--------|
| Schema changes | 15 min |
| Backend API + validation | 1.5 hours |
| Scheduler implementation | 30 min |
| Frontend settings component | 2 hours |
| Profile/booking integration | 1 hour |
| Admin settings | 30 min |
| Dashboard banner | 30 min |
| Testing | 1 hour |
| **Total** | **~7.5 hours** |
