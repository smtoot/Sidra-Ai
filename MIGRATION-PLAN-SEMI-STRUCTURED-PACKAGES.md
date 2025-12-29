# Migration Plan: Current System → Semi-Structured Packages

## Executive Summary

This document outlines the complete migration plan from the current **flexible package system** (book anytime within 90 days) to the **semi-structured Smart Pack model** (recurring pattern + floating sessions).

**Key Decision**: Start with ONLY the Smart Pack model - no tier selection. This simplifies the UX and avoids overwhelming users with choices.

**Timeline**: Estimated 2-3 weeks for full implementation
**Risk Level**: Medium (requires careful data migration for existing packages)

---

## Current System Analysis

### What We Have Now

**Database Schema**:
```prisma
model StudentPackage {
  id                        String
  sessionCount              Int           // e.g., 10
  sessionsUsed              Int
  totalPaid                 Decimal
  escrowRemaining           Decimal
  status                    PackageStatus // ACTIVE, EXPIRED, EXHAUSTED
  expiresAt                 DateTime      // Fixed 90 days from purchase
  // ... relations
}

model PackageRedemption {
  id         String
  packageId  String
  bookingId  String
  status     RedemptionStatus // RESERVED, RELEASED, CANCELLED, REFUNDED
}

model PackageTier {
  id              String
  sessionCount    Int      // 5, 10, 20
  discountPercent Decimal
  isActive        Boolean
}
```

**Current Flow**:
1. Student selects package tier (5/10/20 sessions with tiered discounts)
2. Package purchased → 90-day expiry starts
3. Student books sessions individually (one-at-a-time)
4. Each booking creates PackageRedemption
5. After 90 days, unused sessions auto-refunded

**Issues**:
- No predictability for teachers (sessions booked sporadically)
- Students procrastinate booking
- 90-day window often expires with unused sessions
- No commitment from students = low velocity

---

## Target System: Semi-Structured Smart Pack

### What We're Building

**Core Model**:
- **10-session package** (fixed, no tier selection)
- **8 sessions auto-booked** via recurring pattern (e.g., "Every Tuesday 5pm")
- **2 floating sessions** to book anytime
- **6-week duration** from first scheduled session
- **2-week grace period** after last scheduled session for floating sessions
- **2 reschedules per session** (24h notice required)
- **10% discount** (hardcoded)

**User Journey**:
1. Student visits teacher profile → clicks "Book Package"
2. Selects recurring pattern (day + time)
3. System validates 8 consecutive weeks available
4. Shows calendar preview of all 8 auto-booked sessions
5. Student confirms and pays
6. 8 sessions created immediately as Bookings
7. 2 floating sessions remain "unbooked" until student schedules them

---

## Phase-by-Phase Migration Plan

### Phase 1: Database Schema Changes (Days 1-2)

#### 1.1 Add New Fields to StudentPackage

```prisma
model StudentPackage {
  // ... existing fields ...

  // NEW: Smart Pack specific fields
  isSmartPack           Boolean   @default(false)  // Migration flag
  recurringWeekday      String?   // "TUESDAY", "WEDNESDAY", etc.
  recurringTime         String?   // "17:00" (24h format)
  floatingSessionsTotal Int?      @default(2)      // Total floating sessions
  floatingSessionsUsed  Int?      @default(0)      // How many booked
  scheduledSessionCount Int?      @default(8)      // Auto-booked count

  // NEW: Expiry calculation fields
  firstScheduledSession DateTime? // First auto-booked session date
  lastScheduledSession  DateTime? // Last auto-booked session date
  gracePeriodEnds       DateTime? // lastScheduled + 2 weeks
}
```

#### 1.2 Add Session Tracking Fields to Booking

```prisma
model Booking {
  // ... existing fields ...

  // NEW: Package session tracking
  packageSessionType    PackageSessionType? // AUTO_SCHEDULED, FLOATING, DEMO
  rescheduleCount       Int                 @default(0)
  maxReschedules        Int                 @default(2)
  originalScheduledAt   DateTime?           // Track if rescheduled
}

enum PackageSessionType {
  AUTO_SCHEDULED  // Part of recurring pattern
  FLOATING        // Manually booked floating session
  DEMO            // Demo session (existing)
}
```

#### 1.3 Migration Script for Existing Packages

```typescript
// Migration: Mark all existing packages as legacy (not Smart Pack)
async function migrateExistingPackages() {
  await prisma.studentPackage.updateMany({
    where: {
      status: { in: ['ACTIVE', 'EXPIRED'] }
    },
    data: {
      isSmartPack: false  // Mark as legacy flexible packages
    }
  });

  console.log('✓ Marked all existing packages as legacy (flexible model)');
}
```

**Migration Strategy for Active Packages**:
- **Option A (Recommended)**: Let existing packages continue as-is (flexible model) until expiry
- **Option B**: Force migration - offer students to convert to Smart Pack with extended deadline
- **Decision**: Option A - don't disrupt existing users

---

### Phase 2: Backend API Changes (Days 3-5)

#### 2.1 Update Package Service

**New Method**: `purchaseSmartPackage()`

```typescript
// apps/api/src/package/package.service.ts

async purchaseSmartPackage(
  payerId: string,
  studentId: string,
  teacherId: string,
  subjectId: string,
  recurringWeekday: string,  // "TUESDAY"
  recurringTime: string,      // "17:00"
  idempotencyKey: string
) {
  // 1. Validate teacher availability for 8 consecutive weeks
  const availabilityCheck = await this.validateRecurringPattern(
    teacherId,
    recurringWeekday,
    recurringTime,
    8  // session count
  );

  if (!availabilityCheck.available) {
    throw new BadRequestException(
      'المعلمة ليس لديها 8 أسابيع متتالية متاحة في هذا الموعد'
    );
  }

  // 2. Calculate pricing (fixed 10-session package with 10% discount)
  const teacherSubject = await this.getTeacherSubject(teacherId, subjectId);
  const originalPrice = teacherSubject.pricePerHour;
  const discountedPrice = originalPrice * 0.9;  // 10% discount
  const totalPaid = discountedPrice * 10;

  // 3. Calculate expiry dates
  const firstSession = availabilityCheck.suggestedDates[0];
  const lastSession = availabilityCheck.suggestedDates[7];  // 8th session
  const gracePeriodEnds = addWeeks(lastSession, 2);
  const packageExpiry = gracePeriodEnds;  // Can book floating until this date

  // 4. Create package + auto-book 8 sessions in transaction
  return this.prisma.$transaction(async (tx) => {
    // Debit wallet
    await this.debitWallet(tx, payerId, totalPaid);

    // Create Smart Pack
    const pkg = await tx.studentPackage.create({
      data: {
        payerId,
        studentId,
        teacherId,
        subjectId,
        sessionCount: 10,
        sessionsUsed: 0,
        originalPricePerSession: originalPrice,
        discountedPricePerSession: discountedPrice,
        totalPaid,
        escrowRemaining: totalPaid,
        status: 'ACTIVE',
        expiresAt: packageExpiry,

        // Smart Pack specific
        isSmartPack: true,
        recurringWeekday,
        recurringTime,
        floatingSessionsTotal: 2,
        floatingSessionsUsed: 0,
        scheduledSessionCount: 8,
        firstScheduledSession: firstSession,
        lastScheduledSession: lastSession,
        gracePeriodEnds,
      }
    });

    // Auto-create 8 bookings
    for (const sessionDate of availabilityCheck.suggestedDates) {
      await tx.booking.create({
        data: {
          bookedByUserId: payerId,
          beneficiaryType: 'STUDENT',
          studentUserId: studentId,
          teacherId,
          subjectId,
          startTime: sessionDate,
          endTime: addHours(sessionDate, 1),
          price: discountedPrice,
          status: 'CONFIRMED',  // Auto-confirmed (part of package)
          packageSessionType: 'AUTO_SCHEDULED',
          rescheduleCount: 0,
          maxReschedules: 2,
        }
      });

      // Create redemption
      await tx.packageRedemption.create({
        data: {
          packageId: pkg.id,
          bookingId: booking.id,
          status: 'RESERVED',
        }
      });
    }

    return pkg;
  });
}
```

**New Method**: `validateRecurringPattern()`

```typescript
async validateRecurringPattern(
  teacherId: string,
  weekday: string,
  time: string,
  sessionCount: number
) {
  const suggestedDates: Date[] = [];
  const conflicts: Date[] = [];

  // Start from 48 hours from now (minimum notice)
  let checkDate = addDays(new Date(), 2);

  // Find the first occurrence of the target weekday
  while (checkDate.getDay() !== WEEKDAY_MAP[weekday]) {
    checkDate = addDays(checkDate, 1);
  }

  // Check next N weeks for availability
  for (let i = 0; i < sessionCount; i++) {
    const sessionDateTime = setTime(checkDate, time);  // e.g., Tuesday at 17:00

    // Check if teacher is available
    const isAvailable = await this.checkTeacherAvailability(
      teacherId,
      sessionDateTime
    );

    if (isAvailable) {
      suggestedDates.push(sessionDateTime);
    } else {
      conflicts.push(sessionDateTime);
    }

    // Move to next week
    checkDate = addDays(checkDate, 7);
  }

  // Must have all sessions available
  const available = conflicts.length === 0;

  return {
    available,
    conflicts,
    suggestedDates,
    firstSession: suggestedDates[0],
    lastSession: suggestedDates[suggestedDates.length - 1],
  };
}
```

#### 2.2 New API Endpoints

```typescript
// apps/api/src/package/package.controller.ts

@Post('smart-pack/purchase')
@UseGuards(JwtAuthGuard)
async purchaseSmartPack(
  @Request() req,
  @Body() dto: PurchaseSmartPackDto
) {
  return this.packageService.purchaseSmartPackage(
    req.user.userId,
    dto.studentId,
    dto.teacherId,
    dto.subjectId,
    dto.recurringWeekday,
    dto.recurringTime,
    dto.idempotencyKey
  );
}

@Get('smart-pack/check-availability')
async checkRecurringAvailability(@Query() query: CheckRecurringAvailabilityDto) {
  return this.packageService.validateRecurringPattern(
    query.teacherId,
    query.weekday,
    query.time,
    8  // Fixed session count
  );
}

@Post('smart-pack/:packageId/book-floating')
@UseGuards(JwtAuthGuard)
async bookFloatingSession(
  @Param('packageId') packageId: string,
  @Body() dto: BookFloatingSessionDto
) {
  return this.packageService.bookFloatingSession(
    packageId,
    dto.date,
    dto.time,
    dto.notes
  );
}

@Patch('bookings/:bookingId/reschedule')
@UseGuards(JwtAuthGuard)
async rescheduleSession(
  @Param('bookingId') bookingId: string,
  @Body() dto: RescheduleSessionDto
) {
  return this.packageService.reschedulePackageSession(
    bookingId,
    dto.newDate,
    dto.newTime,
    dto.reason
  );
}
```

#### 2.3 Create DTOs

```typescript
// packages/shared/src/package/purchase-smart-pack.dto.ts

export class PurchaseSmartPackDto {
  @IsUUID()
  studentId!: string;

  @IsUUID()
  teacherId!: string;

  @IsUUID()
  subjectId!: string;

  @IsEnum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'])
  recurringWeekday!: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  recurringTime!: string;  // "17:00" format

  @IsString()
  idempotencyKey!: string;
}

export class BookFloatingSessionDto {
  @IsDateString()
  date!: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  time!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class RescheduleSessionDto {
  @IsDateString()
  newDate!: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  newTime!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
```

#### 2.4 Update Expiry Cron Job

```typescript
// apps/api/src/package/package-expiry.cron.ts

@Cron('0 0 * * *') // Daily at midnight
async checkExpiredSmartPacks() {
  const expiredPackages = await this.prisma.studentPackage.findMany({
    where: {
      isSmartPack: true,
      status: 'ACTIVE',
      gracePeriodEnds: { lte: new Date() },
    },
    include: {
      redemptions: true,
    }
  });

  for (const pkg of expiredPackages) {
    // Count unbooked floating sessions
    const unbookedFloating = pkg.floatingSessionsTotal - pkg.floatingSessionsUsed;

    if (unbookedFloating > 0) {
      // Refund unused floating sessions
      const refundAmount = pkg.discountedPricePerSession * unbookedFloating;
      await this.refundUnusedSessions(pkg.id, refundAmount);
    }

    // Mark package as expired
    await this.prisma.studentPackage.update({
      where: { id: pkg.id },
      data: { status: 'EXPIRED' }
    });

    // Send notification
    await this.notificationService.sendPackageExpired(pkg);
  }
}
```

---

### Phase 3: Frontend Implementation (Days 6-10)

#### 3.1 Remove Package Tier Selection

**Current**: apps/web/src/app/teachers/[slug]/page.tsx shows tier selection
**New**: Single "Book Smart Pack" button with fixed 10% discount

```typescript
// Simplified booking flow - no tier selection
<Button onClick={handleBookSmartPack}>
  احجز باقة ذكية (10 جلسات)
  <Badge>خصم 10%</Badge>
</Button>
```

#### 3.2 Create Recurring Pattern Selector Component

```typescript
// apps/web/src/components/booking/RecurringPatternSelector.tsx

export function RecurringPatternSelector({
  teacherId,
  onSelect,
}: {
  teacherId: string;
  onSelect: (pattern: { weekday: string; time: string }) => void;
}) {
  const [selectedWeekday, setSelectedWeekday] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilityCheck | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (selectedWeekday && selectedTime) {
      checkAvailability();
    }
  }, [selectedWeekday, selectedTime]);

  const checkAvailability = async () => {
    setChecking(true);
    try {
      const result = await packageApi.checkRecurringAvailability({
        teacherId,
        weekday: selectedWeekday!,
        time: selectedTime!,
      });
      setAvailability(result);

      if (result.available) {
        onSelect({ weekday: selectedWeekday!, time: selectedTime! });
      }
    } catch (error) {
      toast.error('فشل التحقق من التوفر');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Weekday Selector */}
      <div>
        <Label>اليوم</Label>
        <div className="grid grid-cols-7 gap-2">
          {WEEKDAYS.map(day => (
            <Button
              key={day.value}
              variant={selectedWeekday === day.value ? 'default' : 'outline'}
              onClick={() => setSelectedWeekday(day.value)}
            >
              {day.labelAr}
            </Button>
          ))}
        </div>
      </div>

      {/* Time Selector */}
      <div>
        <Label>الوقت</Label>
        <div className="grid grid-cols-4 gap-2">
          {AVAILABLE_TIMES.map(time => (
            <Button
              key={time.value}
              variant={selectedTime === time.value ? 'default' : 'outline'}
              onClick={() => setSelectedTime(time.value)}
              disabled={!selectedWeekday}
            >
              {time.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Availability Feedback */}
      {checking && <Loader />}

      {availability && !availability.available && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            المعلمة ليس لديها 8 أسابيع متتالية متاحة في هذا الموعد
          </AlertDescription>
        </Alert>
      )}

      {availability?.available && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            ✓ هذا الموعد متاح! سيتم حجز 8 جلسات تلقائياً
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

#### 3.3 Create Schedule Preview Component

```typescript
// apps/web/src/components/booking/SchedulePreview.tsx

export function SchedulePreview({
  sessions,
  floatingCount,
}: {
  sessions: Date[];
  floatingCount: number;
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-bold">جدولك المقترح</h3>

      {/* Calendar view */}
      <Calendar
        mode="multiple"
        selected={sessions}
        className="rounded-md border"
      />

      {/* Session list */}
      <div className="space-y-2">
        {sessions.map((session, idx) => (
          <div key={idx} className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium">
                الجلسة #{idx + 1} - {format(session, 'EEEE، d MMMM yyyy', { locale: ar })}
              </p>
              <p className="text-sm text-gray-600">
                {format(session, 'h:mm a', { locale: ar })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Floating sessions note */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          لديك {floatingCount} جلسة مرنة يمكنك حجزها في أي وقت قبل انتهاء الباقة
        </AlertDescription>
      </Alert>
    </div>
  );
}
```

#### 3.4 Update Package Management Page

```typescript
// apps/web/src/app/student/packages/[id]/page.tsx

export default function SmartPackagePage({ params }: { params: { id: string } }) {
  const { data: pkg } = useQuery({
    queryKey: ['package', params.id],
    queryFn: () => packageApi.getPackage(params.id),
  });

  if (!pkg) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Package Header */}
      <Card>
        <CardHeader>
          <CardTitle>باقتي الذكية مع {pkg.teacher.displayName}</CardTitle>
          <CardDescription>
            {pkg.subject.nameAr} - {pkg.sessionCount} جلسات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>الموعد الأسبوعي</Label>
              <p>كل {WEEKDAY_AR[pkg.recurringWeekday]} {pkg.recurringTime}</p>
            </div>
            <div>
              <Label>تنتهي في</Label>
              <p>{format(pkg.gracePeriodEnds, 'dd/MM/yyyy')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Progress */}
      <Card>
        <CardHeader>
          <CardTitle>استخدام الجلسات</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={(pkg.sessionsUsed / pkg.sessionCount) * 100} />
          <div className="flex justify-between mt-2 text-sm">
            <span>مكتملة: {pkg.sessionsUsed}</span>
            <span>قادمة: {pkg.scheduledSessionCount - pkg.sessionsUsed}</span>
            <span>مرنة متاحة: {pkg.floatingSessionsTotal - pkg.floatingSessionsUsed}</span>
          </div>
        </CardContent>
      </Card>

      {/* Floating Session Booking */}
      {pkg.floatingSessionsUsed < pkg.floatingSessionsTotal && (
        <Card>
          <CardHeader>
            <CardTitle>احجز جلسة مرنة</CardTitle>
          </CardHeader>
          <CardContent>
            <FloatingSessionBooker packageId={pkg.id} />
          </CardContent>
        </Card>
      )}

      {/* Upcoming Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>الجلسات القادمة</CardTitle>
        </CardHeader>
        <CardContent>
          <UpcomingSessionsList packageId={pkg.id} />
        </CardContent>
      </Card>
    </div>
  );
}
```

#### 3.5 Create Reschedule Modal

```typescript
// apps/web/src/components/booking/RescheduleModal.tsx

export function RescheduleModal({
  booking,
  onClose,
  onSuccess,
}: {
  booking: Booking;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [newDate, setNewDate] = useState<Date | null>(null);
  const [newTime, setNewTime] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const canReschedule = booking.rescheduleCount < booking.maxReschedules;
  const tooLate = differenceInHours(booking.startTime, new Date()) < 24;

  const handleReschedule = async () => {
    if (!newDate || !newTime) return;

    setLoading(true);
    try {
      await bookingApi.reschedule(booking.id, {
        newDate: format(newDate, 'yyyy-MM-dd'),
        newTime,
        reason,
      });

      toast.success('تم تغيير موعد الجلسة بنجاح');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'فشل تغيير الموعد');
    } finally {
      setLoading(false);
    }
  };

  if (!canReschedule) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          استنفدت عمليات إعادة الجدولة المتاحة ({booking.maxReschedules})
        </AlertDescription>
      </Alert>
    );
  }

  if (tooLate) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          لا يمكن إعادة الجدولة - الجلسة بعد أقل من 24 ساعة
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إعادة جدولة الجلسة</DialogTitle>
          <DialogDescription>
            إعادة جدولة متبقية: {booking.maxReschedules - booking.rescheduleCount}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date Picker */}
          <div>
            <Label>التاريخ الجديد</Label>
            <Calendar
              mode="single"
              selected={newDate}
              onSelect={setNewDate}
              disabled={(date) => date < addDays(new Date(), 1)}
            />
          </div>

          {/* Time Selector */}
          <div>
            <Label>الوقت الجديد</Label>
            <Select onValueChange={setNewTime}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الوقت" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_TIMES.map(time => (
                  <SelectItem key={time.value} value={time.value}>
                    {time.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reason (optional) */}
          <div>
            <Label>السبب (اختياري)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="مثال: لدي موعد طارئ"
            />
          </div>

          {/* Summary */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <p>من: {format(booking.startTime, 'EEEE d MMMM، h:mm a', { locale: ar })}</p>
              {newDate && newTime && (
                <p>إلى: {format(newDate, 'EEEE d MMMM', { locale: ar })}، {newTime}</p>
              )}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button
            onClick={handleReschedule}
            disabled={!newDate || !newTime || loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : 'تأكيد التغيير'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Phase 4: Testing & Validation (Days 11-13)

#### 4.1 Unit Tests

```typescript
// apps/api/src/package/package.service.spec.ts

describe('PackageService - Smart Pack', () => {
  describe('validateRecurringPattern', () => {
    it('should validate 8 consecutive weeks availability', async () => {
      const result = await service.validateRecurringPattern(
        teacherId,
        'TUESDAY',
        '17:00',
        8
      );

      expect(result.available).toBe(true);
      expect(result.suggestedDates).toHaveLength(8);
    });

    it('should reject if conflicts exist', async () => {
      // Mock teacher has booking conflict on week 3
      const result = await service.validateRecurringPattern(
        teacherId,
        'TUESDAY',
        '17:00',
        8
      );

      expect(result.available).toBe(false);
      expect(result.conflicts).toHaveLength(1);
    });
  });

  describe('purchaseSmartPackage', () => {
    it('should create package + 8 bookings atomically', async () => {
      const pkg = await service.purchaseSmartPackage(/* ... */);

      const bookings = await prisma.booking.findMany({
        where: { /* redemptions.packageId: pkg.id */ }
      });

      expect(bookings).toHaveLength(8);
      expect(pkg.floatingSessionsTotal).toBe(2);
    });

    it('should calculate expiry correctly', async () => {
      const pkg = await service.purchaseSmartPackage(/* ... */);

      const expectedExpiry = addWeeks(pkg.lastScheduledSession, 2);
      expect(pkg.gracePeriodEnds).toEqual(expectedExpiry);
    });
  });

  describe('reschedulePackageSession', () => {
    it('should allow reschedule within quota', async () => {
      const result = await service.reschedulePackageSession(
        bookingId,
        newDate,
        newTime,
        'Emergency'
      );

      expect(result.rescheduleCount).toBe(1);
      expect(result.originalScheduledAt).toBeDefined();
    });

    it('should reject reschedule if quota exceeded', async () => {
      // Booking already rescheduled 2 times
      await expect(
        service.reschedulePackageSession(bookingId, newDate, newTime)
      ).rejects.toThrow('No reschedules remaining');
    });

    it('should reject reschedule if less than 24h notice', async () => {
      const tomorrow = addHours(new Date(), 20);
      await expect(
        service.reschedulePackageSession(bookingId, tomorrow)
      ).rejects.toThrow('Minimum 24h notice required');
    });
  });
});
```

#### 4.2 Integration Tests

```typescript
describe('Smart Pack E2E Flow', () => {
  it('should complete full purchase flow', async () => {
    // 1. Check availability
    const availability = await request(app.getHttpServer())
      .get('/packages/smart-pack/check-availability')
      .query({
        teacherId,
        weekday: 'TUESDAY',
        time: '17:00',
      })
      .expect(200);

    expect(availability.body.available).toBe(true);

    // 2. Purchase package
    const purchase = await request(app.getHttpServer())
      .post('/packages/smart-pack/purchase')
      .send({
        studentId,
        teacherId,
        subjectId,
        recurringWeekday: 'TUESDAY',
        recurringTime: '17:00',
        idempotencyKey: uuid(),
      })
      .expect(201);

    const packageId = purchase.body.id;

    // 3. Verify 8 bookings created
    const bookings = await prisma.booking.count({
      where: {
        redemptions: {
          some: { packageId }
        }
      }
    });
    expect(bookings).toBe(8);

    // 4. Book floating session
    await request(app.getHttpServer())
      .post(`/packages/smart-pack/${packageId}/book-floating`)
      .send({
        date: '2025-02-15',
        time: '16:00',
      })
      .expect(201);

    // 5. Verify floating session count updated
    const pkg = await prisma.studentPackage.findUnique({
      where: { id: packageId }
    });
    expect(pkg.floatingSessionsUsed).toBe(1);
  });
});
```

#### 4.3 Manual QA Checklist

**Booking Flow**:
- [ ] Can select recurring pattern (day + time)
- [ ] System validates 8 consecutive weeks availability
- [ ] Calendar preview shows all 8 sessions correctly
- [ ] Payment flow completes successfully
- [ ] 8 bookings appear in "My Sessions"
- [ ] Package shows correct floating session count (2)

**Floating Sessions**:
- [ ] Can book floating session with date picker
- [ ] Floating session count decrements correctly
- [ ] Cannot book more than allocated floating sessions
- [ ] Cannot book floating after package expiry

**Rescheduling**:
- [ ] Can reschedule session with 24h+ notice
- [ ] Reschedule count increments correctly
- [ ] Cannot reschedule more than 2 times per session
- [ ] Cannot reschedule with <24h notice
- [ ] Error messages are clear and in Arabic

**Expiry**:
- [ ] Package expires on correct date (last session + 2 weeks)
- [ ] Unused floating sessions refunded automatically
- [ ] Email notification sent before expiry (7 days)
- [ ] Status changes to EXPIRED correctly

---

### Phase 5: Deployment & Rollout (Days 14-15)

#### 5.1 Database Migration Steps

```bash
# 1. Backup production database
pg_dump -h [host] -U [user] -d sidra_production > backup_pre_smartpack.sql

# 2. Run Prisma migration
npx prisma migrate deploy

# 3. Run data migration script
npm run migrate:legacy-packages

# 4. Verify migration
npm run verify:package-migration
```

#### 5.2 Feature Flag Approach

```typescript
// apps/api/src/common/system-settings/system-settings.service.ts

export interface SystemSettings {
  packagesEnabled: boolean;
  smartPackEnabled: boolean;  // NEW: Feature flag
  legacyPackagesPurchaseDisabled: boolean;  // NEW: Disable old flow
}

// Initial rollout: Enable Smart Pack for new purchases only
await prisma.systemSettings.update({
  where: { id: settingsId },
  data: {
    smartPackEnabled: true,
    legacyPackagesPurchaseDisabled: true,  // Block new flexible packages
  }
});
```

#### 5.3 Gradual Rollout Plan

**Week 1**: Soft launch (20% of users)
- Enable Smart Pack for 20% of users via feature flag
- Monitor error rates, conversion rates
- Collect user feedback

**Week 2**: Expand to 50%
- Address any bugs from Week 1
- Expand to 50% of users

**Week 3**: Full rollout (100%)
- Enable for all users
- Deprecate old flexible package purchase flow
- Keep existing flexible packages active until expiry

**Week 4**: Monitor & optimize
- Track key metrics (conversion, reschedule usage, expiry rates)
- Optimize based on data

---

## Migration Risks & Mitigation

### Risk 1: Existing Packages Disruption
**Impact**: High
**Likelihood**: Medium
**Mitigation**:
- Keep legacy packages fully functional
- Don't force migration of active packages
- Maintain backward compatibility for 90 days

### Risk 2: Teacher Availability Conflicts
**Impact**: High
**Likelihood**: Medium
**Mitigation**:
- Robust availability validation before purchase
- Clear error messages when pattern not available
- Suggest alternative times/days

### Risk 3: Student Confusion
**Impact**: Medium
**Likelihood**: High
**Mitigation**:
- Clear onboarding flow with visual calendar preview
- Comprehensive help documentation
- In-app tooltips and guidance
- Video tutorial in Arabic

### Risk 4: Payment/Escrow Issues
**Impact**: High
**Likelihood**: Low
**Mitigation**:
- Comprehensive transaction tests
- Idempotency keys to prevent double-charging
- Manual reconciliation script for verification

---

## Success Metrics

### Business Metrics
- **Package purchase conversion rate**: Target >15% (current: ~10%)
- **Session velocity**: Time from purchase to first session <2 days (current: ~7 days)
- **Package completion rate**: >80% of sessions consumed (current: ~60%)
- **Teacher satisfaction**: NPS >8/10
- **Student satisfaction**: NPS >7/10

### Technical Metrics
- **API response time**: <500ms for availability check
- **Transaction success rate**: >99.9%
- **Zero double-bookings**: Conflict detection 100% accurate
- **Refund accuracy**: 100% correct calculations

---

## Rollback Plan

If critical issues arise:

**Step 1**: Disable Smart Pack purchases
```typescript
await prisma.systemSettings.update({
  data: { smartPackEnabled: false }
});
```

**Step 2**: Re-enable legacy flexible package flow
```typescript
await prisma.systemSettings.update({
  data: { legacyPackagesPurchaseDisabled: false }
});
```

**Step 3**: Communicate with affected users
- Email all users who purchased Smart Packs
- Offer extension of expiry date OR refund
- Provide support contact

**Step 4**: Debug and fix issues
- Analyze logs and error reports
- Fix bugs in staging environment
- Re-test thoroughly before re-enabling

---

## Timeline Summary

| Phase | Days | Tasks |
|-------|------|-------|
| 1. Database Schema | 1-2 | Add fields, create migration script |
| 2. Backend API | 3-5 | New endpoints, service methods, DTOs |
| 3. Frontend | 6-10 | Components, pages, booking flow |
| 4. Testing | 11-13 | Unit, integration, manual QA |
| 5. Deployment | 14-15 | Migration, feature flags, rollout |

**Total**: 15 days (~3 weeks)

---

## Next Steps (After This Conversation)

1. **Review & Approve Plan** - Get stakeholder sign-off
2. **Create Detailed Tickets** - Break down into Jira/Linear tasks
3. **Set Up Staging Environment** - Mirror production for testing
4. **Begin Phase 1** - Database schema changes
5. **Daily Standups** - Track progress and blockers

---

## Questions for Clarification

Before implementation begins:

1. **Pricing**: Confirm 10% discount is acceptable for all subjects/teachers?
2. **Refund Policy**: Auto-refund unused floating sessions, or require user request?
3. **Grace Period**: 2 weeks after last session - is this flexible or fixed?
4. **Reschedule Limits**: 2 per session with 24h notice - any exceptions for emergencies?
5. **Teacher Opt-in**: Should teachers be able to disable Smart Pack and only offer single sessions?
6. **Minimum Sessions**: Can we offer 5-session Smart Pack (4 recurring + 1 floating) as starter tier later?

