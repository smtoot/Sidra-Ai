# Smart Pack Multi-Slot Recurring Implementation

## Overview

This document outlines the implementation plan for replacing the single-pattern recurring booking system (1 day/week) with a multi-slot weekly scheduling system (1-4 slots/week) for Smart Pack packages.

**Created:** January 2026
**Status:** Planning Complete
**Priority:** High

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution Overview](#solution-overview)
3. [Current vs New Architecture](#current-vs-new-architecture)
4. [Files Affected](#files-affected)
5. [Data Model Changes](#data-model-changes)
6. [API Changes](#api-changes)
7. [Frontend Component Changes](#frontend-component-changes)
8. [Implementation Phases](#implementation-phases)
9. [Testing Plan](#testing-plan)
10. [Rollback Plan](#rollback-plan)
11. [Success Metrics](#success-metrics)

---

## Problem Statement

### Current UX Issues

| Issue | Impact | Severity |
|-------|--------|----------|
| **Blind Selection** | User picks day + time without seeing availability first, clicks "Check", often fails | Critical |
| **Single Day Only** | Can only book same day each week (e.g., only Tuesdays) - no flexibility for 2-3x/week | Critical |
| **Generic Time Slots** | Shows fixed 9am-8pm hourly slots, not teacher's actual available times | High |
| **No Visual Calendar** | Dropdown selectors instead of visual weekly grid showing availability | High |
| **All-or-Nothing** | If ANY of the N weeks has a conflict, entire pattern fails | High |
| **No Alternatives Suggested** | When unavailable, doesn't show nearby available times | Medium |

### Current User Flow (Frustrating)

```
1. User selects "Tuesday" from dropdown
2. User selects "5:00 PM" from dropdown
3. User clicks "تحقق من التوفر" (Check Availability)
4. API checks all N weeks for conflicts
5. ❌ "Teacher not available on Tuesday" or "Conflict on week 3"
6. User starts over with different day/time (trial & error)
```

### Business Impact

- Parents often need 2-3 sessions per week for their children
- Current system forces 8-12 weeks to complete a package (1x/week)
- High abandonment rate during package booking
- Support tickets about "can't find available slots"

---

## Solution Overview

### New Multi-Slot Weekly Grid

Replace dropdown selectors with a visual weekly availability grid where users can:

1. **See availability BEFORE selecting** - Grid shows only available slots
2. **Select multiple slots per week** - Click to toggle 1-4 weekly slots
3. **Real-time conflict checking** - Instant feedback as slots are selected
4. **Faster package completion** - 2x/week = 4 weeks instead of 8 weeks

### Visual Design

```
┌─────────────────────────────────────────────────────────────────┐
│  📦 Smart Pack: 10 Sessions                                     │
│  ├── 8 Recurring (schedule now)                                │
│  └── 2 Floating (book anytime before expiry)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📅 Select Weekly Schedule for 8 Recurring Sessions            │
│                                                                 │
│  ┌───────┬───────┬───────┬───────┬───────┬───────┬───────┐     │
│  │       │  Sun  │  Mon  │  Tue  │  Wed  │  Thu  │  Sat  │     │
│  ├───────┼───────┼───────┼───────┼───────┼───────┼───────┤     │
│  │ 09:00 │       │   ○   │   ○   │       │   ○   │       │     │
│  │ 10:00 │       │   ○   │   ○   │       │   ○   │       │     │
│  │ 14:00 │   ○   │   ○   │   ○   │   ○   │   ○   │       │     │
│  │ 15:00 │   ○   │   ○   │   ○   │   ○   │   ○   │       │     │
│  │ 16:00 │   ○   │   ●   │   ○   │   ○   │   ○   │   ○   │     │
│  │ 17:00 │   ○   │   ○   │   ○   │   ●   │   ○   │   ○   │     │
│  │ 18:00 │   ○   │   ○   │   ○   │   ○   │   ○   │       │     │
│  └───────┴───────┴───────┴───────┴───────┴───────┴───────┘     │
│                                                                 │
│  ○ = Available    ● = Selected    Empty = Not available        │
│                                                                 │
│  Selected: Monday 4PM + Wednesday 5PM (2x/week)                │
│  8 recurring ÷ 2/week = 4 weeks                                │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  📋 Summary                                                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Recurring Sessions (8):           Jan 5 → Jan 29       │    │
│  │  • Every Monday 4:00 PM          (4 sessions)          │    │
│  │  • Every Wednesday 5:00 PM       (4 sessions)          │    │
│  │                                                        │    │
│  │ Floating Sessions (2):                                 │    │
│  │  • Book anytime before Mar 29 (expiry)                │    │
│  │  • Use for makeup, extra practice, or schedule later  │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  💰 Total: 1,200 SDG (save 15%)                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Current vs New Architecture

### Scheduling Logic Comparison

#### Current Logic (Single Pattern)

```
Tier: 10 sessions = 8 recurring + 2 floating
Pattern: Tuesday 5PM

Week 1: Tue 5PM (session 1)
Week 2: Tue 5PM (session 2)
Week 3: Tue 5PM (session 3)
Week 4: Tue 5PM (session 4)
Week 5: Tue 5PM (session 5)
Week 6: Tue 5PM (session 6)
Week 7: Tue 5PM (session 7)
Week 8: Tue 5PM (session 8)

Total: 8 weeks to complete recurring sessions
```

#### New Logic (Multi-Pattern)

```
Tier: 10 sessions = 8 recurring + 2 floating
Patterns: [Tuesday 5PM, Thursday 4PM]

Week 1: Tue 5PM (session 1), Thu 4PM (session 2)
Week 2: Tue 5PM (session 3), Thu 4PM (session 4)
Week 3: Tue 5PM (session 5), Thu 4PM (session 6)
Week 4: Tue 5PM (session 7), Thu 4PM (session 8)

Total: 4 weeks to complete recurring sessions (2x faster!)
```

### Key Behavior Preserved

| Feature | Current | New |
|---------|---------|-----|
| Recurring/Floating ratio | 80%/20% from tier | Same |
| Floating sessions | Book anytime before expiry | Same |
| Grace period | tier.gracePeriodDays after last session | Same |
| Reschedule limit | Per-session limit from tier | Same |
| Escrow per-session | Release on completion | Same |
| Auto-scheduling | At purchase time | Same |

---

## Files Affected

### Database Layer

| File | Change Type | Description |
|------|-------------|-------------|
| `packages/database/prisma/schema.prisma` | Modify | Add `recurringPatterns Json?` field to StudentPackage |

### Backend - DTOs (Shared Package)

| File | Change Type | Description |
|------|-------------|-------------|
| `packages/shared/src/package/purchase-smart-pack.dto.ts` | Modify | Replace single weekday/time with `recurringPatterns[]` array |
| `packages/shared/src/package/check-recurring-availability.dto.ts` | Modify | Accept array of patterns for multi-slot validation |
| `packages/shared/src/package/index.ts` | Modify | Export new types |

### Backend - Services

| File | Change Type | Description |
|------|-------------|-------------|
| `apps/api/src/package/package.service.ts` | Modify | Update `purchaseSmartPackage()` and `checkRecurringAvailability()` |
| `apps/api/src/package/package.controller.ts` | Modify | Add new endpoint for weekly availability grid |
| `apps/api/src/marketplace/marketplace.service.ts` | Modify | Update frontend-facing availability check |
| `apps/api/src/marketplace/marketplace.controller.ts` | Modify | Add new endpoint for teacher weekly availability |

### Frontend - Booking Components

| File | Change Type | Description |
|------|-------------|-------------|
| `apps/web/src/components/booking/RecurringPatternSelector.tsx` | Replace | New `WeeklyAvailabilityGrid.tsx` component |
| `apps/web/src/components/booking/WeeklyAvailabilityGrid.tsx` | Create | New visual grid component |
| `apps/web/src/components/booking/steps/Step3Schedule.tsx` | Modify | Integrate new grid, handle multi-slot state |
| `apps/web/src/components/booking/steps/Step5Review.tsx` | Modify | Display multiple patterns in summary |
| `apps/web/src/components/booking/useBookingFlow.ts` | Modify | Add `recurringPatterns[]` to state |
| `apps/web/src/components/booking/types.ts` | Modify | Add `RecurringPattern` type |

### Frontend - API Layer

| File | Change Type | Description |
|------|-------------|-------------|
| `apps/web/src/lib/api/package.ts` | Modify | Update API calls for new DTO shape |
| `apps/web/src/lib/api/marketplace.ts` | Modify | Add weekly availability API call |

### Tests

| File | Change Type | Description |
|------|-------------|-------------|
| `apps/api/src/package/package.service.spec.ts` | Modify | Update tests for multi-pattern |
| `apps/api/test/package.integration.spec.ts` | Modify | Add integration tests for multi-slot |

---

## Data Model Changes

### Current Schema (Single Pattern)

```prisma
model StudentPackage {
  // ... other fields ...

  // Smart Pack specific fields
  isSmartPack           Boolean @default(true)
  recurringWeekday      String?   // "TUESDAY"
  recurringTime         String?   // "17:00"
  recurringSessionCount Int?
  floatingSessionCount  Int?
  floatingSessionsUsed  Int     @default(0)
  rescheduleLimit       Int     @default(2)

  // Expiry tracking
  firstScheduledSession DateTime?
  lastScheduledSession  DateTime?
  gracePeriodEnds       DateTime?
}
```

### New Schema (Multi-Pattern)

```prisma
model StudentPackage {
  // ... other fields ...

  // Smart Pack specific fields
  isSmartPack           Boolean @default(true)

  // DEPRECATED - keep for backward compatibility with existing packages
  recurringWeekday      String?   // "TUESDAY" - DO NOT USE FOR NEW PACKAGES
  recurringTime         String?   // "17:00" - DO NOT USE FOR NEW PACKAGES

  // NEW - array of patterns for multi-slot scheduling
  recurringPatterns     Json?     // [{ weekday: "TUESDAY", time: "17:00" }, { weekday: "THURSDAY", time: "16:00" }]

  recurringSessionCount Int?
  floatingSessionCount  Int?
  floatingSessionsUsed  Int     @default(0)
  rescheduleLimit       Int     @default(2)

  // Expiry tracking
  firstScheduledSession DateTime?
  lastScheduledSession  DateTime?
  gracePeriodEnds       DateTime?
}
```

### RecurringPattern Type Definition

```typescript
/**
 * Represents a single weekly recurring slot
 */
interface RecurringPattern {
  weekday: 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
  time: string; // "17:00" format (24-hour)
}

/**
 * Example usage:
 *
 * Single slot (equivalent to old behavior):
 * recurringPatterns: [{ weekday: "TUESDAY", time: "17:00" }]
 *
 * Multi-slot (new capability):
 * recurringPatterns: [
 *   { weekday: "TUESDAY", time: "17:00" },
 *   { weekday: "THURSDAY", time: "16:00" }
 * ]
 */
```

### Backward Compatibility

| Scenario | Handling |
|----------|----------|
| Existing packages with `recurringWeekday`/`recurringTime` | Continue to work - service reads legacy fields if `recurringPatterns` is null |
| New packages | Always use `recurringPatterns` array |
| API response | Always return `recurringPatterns` (convert legacy to array format) |
| Migration | No data migration required - new field is additive |

---

## API Changes

### DTOs

#### Current PurchaseSmartPackDto

```typescript
// packages/shared/src/package/purchase-smart-pack.dto.ts

export class PurchaseSmartPackDto {
  @IsUUID()
  studentId!: string;

  @IsUUID()
  teacherId!: string;

  @IsUUID()
  subjectId!: string;

  @IsUUID()
  tierId!: string;

  @IsEnum(Weekday)
  recurringWeekday!: Weekday;  // Single weekday

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  recurringTime!: string;       // Single time

  @IsString()
  idempotencyKey!: string;
}
```

#### New PurchaseSmartPackDto

```typescript
// packages/shared/src/package/purchase-smart-pack.dto.ts

export class RecurringPatternDto {
  @IsEnum(Weekday)
  weekday!: Weekday;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Time must be in HH:mm format (e.g., 17:00)'
  })
  time!: string;
}

export class PurchaseSmartPackDto {
  @IsUUID()
  studentId!: string;

  @IsUUID()
  teacherId!: string;

  @IsUUID()
  subjectId!: string;

  @IsUUID()
  tierId!: string;

  @ValidateNested({ each: true })
  @Type(() => RecurringPatternDto)
  @ArrayMinSize(1, { message: 'At least one recurring pattern is required' })
  @ArrayMaxSize(4, { message: 'Maximum 4 recurring patterns allowed' })
  recurringPatterns!: RecurringPatternDto[];

  @IsString()
  idempotencyKey!: string;
}
```

#### Current CheckRecurringAvailabilityDto

```typescript
// packages/shared/src/package/check-recurring-availability.dto.ts

export class CheckRecurringAvailabilityDto {
  @IsUUID()
  teacherId!: string;

  @IsEnum(Weekday)
  weekday!: Weekday;  // Single weekday

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  time!: string;       // Single time

  @IsInt()
  @Min(1)
  sessionCount!: number;

  @IsInt()
  @Min(60)
  duration?: number;
}
```

#### New CheckRecurringAvailabilityDto

```typescript
// packages/shared/src/package/check-recurring-availability.dto.ts

export class CheckMultiSlotAvailabilityDto {
  @IsUUID()
  teacherId!: string;

  @ValidateNested({ each: true })
  @Type(() => RecurringPatternDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(4)
  patterns!: RecurringPatternDto[];

  @IsInt()
  @Min(1)
  recurringSessionCount!: number; // Number of recurring sessions to schedule

  @IsInt()
  @Min(30)
  duration?: number; // Session duration in minutes (default: 60)
}

export interface MultiSlotAvailabilityResponse {
  available: boolean;
  patterns: Array<{
    weekday: Weekday;
    time: string;
    availableWeeks: number;
    conflicts: Array<{ date: string; reason: string }>;
  }>;
  scheduledSessions: Array<{
    date: string;
    weekday: Weekday;
    time: string;
    sessionNumber: number;
  }>;
  totalWeeksNeeded: number;
  firstSession: string;
  lastSession: string;
  packageEndDate: string;
  message: string;
}
```

### New Endpoints

#### GET /marketplace/teachers/:teacherId/weekly-availability

Returns the teacher's weekly availability grid for the booking UI.

**Request:**
```
GET /marketplace/teachers/:teacherId/weekly-availability?subjectId=xxx
```

**Response:**
```json
{
  "teacherId": "uuid",
  "timezone": "Africa/Khartoum",
  "availability": [
    {
      "weekday": "SUNDAY",
      "slots": [
        { "time": "09:00", "available": true },
        { "time": "10:00", "available": true },
        { "time": "11:00", "available": false, "reason": "booked" }
      ]
    },
    {
      "weekday": "MONDAY",
      "slots": [
        { "time": "14:00", "available": true },
        { "time": "15:00", "available": true },
        { "time": "16:00", "available": true }
      ]
    }
  ]
}
```

#### POST /packages/check-multi-slot-availability

Validates multiple patterns for a Smart Pack purchase.

**Request:**
```json
{
  "teacherId": "uuid",
  "patterns": [
    { "weekday": "TUESDAY", "time": "17:00" },
    { "weekday": "THURSDAY", "time": "16:00" }
  ],
  "recurringSessionCount": 8,
  "duration": 60
}
```

**Response:**
```json
{
  "available": true,
  "patterns": [
    {
      "weekday": "TUESDAY",
      "time": "17:00",
      "availableWeeks": 4,
      "conflicts": []
    },
    {
      "weekday": "THURSDAY",
      "time": "16:00",
      "availableWeeks": 4,
      "conflicts": []
    }
  ],
  "scheduledSessions": [
    { "date": "2026-01-07", "weekday": "TUESDAY", "time": "17:00", "sessionNumber": 1 },
    { "date": "2026-01-09", "weekday": "THURSDAY", "time": "16:00", "sessionNumber": 2 },
    { "date": "2026-01-14", "weekday": "TUESDAY", "time": "17:00", "sessionNumber": 3 },
    { "date": "2026-01-16", "weekday": "THURSDAY", "time": "16:00", "sessionNumber": 4 },
    { "date": "2026-01-21", "weekday": "TUESDAY", "time": "17:00", "sessionNumber": 5 },
    { "date": "2026-01-23", "weekday": "THURSDAY", "time": "16:00", "sessionNumber": 6 },
    { "date": "2026-01-28", "weekday": "TUESDAY", "time": "17:00", "sessionNumber": 7 },
    { "date": "2026-01-30", "weekday": "THURSDAY", "time": "16:00", "sessionNumber": 8 }
  ],
  "totalWeeksNeeded": 4,
  "firstSession": "2026-01-07T17:00:00Z",
  "lastSession": "2026-01-30T16:00:00Z",
  "packageEndDate": "2026-02-13T16:00:00Z",
  "message": "All 8 sessions can be scheduled across 4 weeks"
}
```

---

## Frontend Component Changes

### New Component: WeeklyAvailabilityGrid

```typescript
// apps/web/src/components/booking/WeeklyAvailabilityGrid.tsx

interface WeeklyAvailabilityGridProps {
  teacherId: string;
  subjectId: string;
  recurringSessionCount: number; // e.g., 8 for a 10-session pack
  floatingSessionCount: number;  // e.g., 2 for a 10-session pack
  onPatternsChange: (patterns: RecurringPattern[], scheduledSessions: ScheduledSession[]) => void;
  selectedPatterns: RecurringPattern[];
}

/**
 * Features:
 * 1. Fetches teacher's weekly availability on mount
 * 2. Displays clickable grid of available slots
 * 3. Allows selecting 1-4 slots per week
 * 4. Real-time validation as slots are selected
 * 5. Shows preview of scheduled sessions
 * 6. Displays floating session info
 */
```

### State Changes in useBookingFlow

```typescript
// apps/web/src/components/booking/useBookingFlow.ts

interface BookingFlowState {
  // ... existing fields ...

  // OLD - will be removed
  // recurringWeekday: string;
  // recurringTime: string;
  // suggestedDates: Date[];

  // NEW - multi-slot support
  recurringPatterns: RecurringPattern[];
  scheduledSessions: ScheduledSession[];
  validationResult: MultiSlotAvailabilityResponse | null;
}

interface RecurringPattern {
  weekday: Weekday;
  time: string;
}

interface ScheduledSession {
  date: string;
  weekday: Weekday;
  time: string;
  sessionNumber: number;
}
```

### Step3Schedule Updates

```typescript
// apps/web/src/components/booking/steps/Step3Schedule.tsx

// For new package purchase, render WeeklyAvailabilityGrid instead of RecurringPatternSelector
if (isNewPackagePurchase) {
  return (
    <WeeklyAvailabilityGrid
      teacherId={teacherId}
      subjectId={subjectId}
      recurringSessionCount={bookingOption.sessionCount * 0.8} // From tier ratio
      floatingSessionCount={bookingOption.sessionCount * 0.2}
      selectedPatterns={recurringPatterns}
      onPatternsChange={(patterns, sessions) => {
        setRecurringPatterns(patterns);
        setScheduledSessions(sessions);
      }}
    />
  );
}
```

### Step5Review Updates

```typescript
// apps/web/src/components/booking/steps/Step5Review.tsx

// Display multiple patterns
{recurringPatterns.length > 0 && (
  <div className="space-y-2">
    <h4>الحصص المجدولة ({scheduledSessions.length} حصة)</h4>

    {/* Weekly Pattern Summary */}
    <div className="bg-blue-50 p-3 rounded-lg">
      <p className="font-semibold">النمط الأسبوعي:</p>
      {recurringPatterns.map((pattern, idx) => (
        <p key={idx}>• كل {getWeekdayName(pattern.weekday)} الساعة {pattern.time}</p>
      ))}
    </div>

    {/* Session List */}
    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
      {scheduledSessions.map((session, idx) => (
        <div key={idx} className="bg-white border rounded px-3 py-2 text-sm">
          <span className="font-semibold">الحصة {session.sessionNumber}:</span>{' '}
          {formatDate(session.date)}
        </div>
      ))}
    </div>

    {/* Floating Sessions Info */}
    <div className="bg-amber-50 p-3 rounded-lg">
      <p className="font-semibold">الحصص المرنة ({floatingSessionCount} حصة)</p>
      <p className="text-sm">يمكنك حجزها في أي وقت قبل انتهاء الباقة</p>
    </div>
  </div>
)}
```

---

## Implementation Phases

### Phase 1: Planning & Analysis ✅

**Status:** Complete

**Deliverables:**
- [x] Audit current Smart Pack implementation
- [x] Document all affected files
- [x] Create technical specification
- [x] Define data model changes
- [x] Define API changes
- [x] Create this implementation document

---

### Phase 2: Database Schema Changes

**Status:** Pending

**Tasks:**

1. **Add new field to schema.prisma**
   ```prisma
   // In StudentPackage model, add:
   recurringPatterns Json? // [{ weekday: "TUESDAY", time: "17:00" }, ...]
   ```

2. **Create migration**
   ```bash
   cd packages/database
   npx prisma migrate dev --name add-recurring-patterns-multi-slot
   ```

3. **Rebuild shared types**
   ```bash
   cd packages/shared
   npm run build
   ```

4. **Verify migration**
   - Check migration file is correct
   - Verify no data loss for existing packages

**Estimated Effort:** 1 hour

**Risk:** Low - additive field, no breaking changes

---

### Phase 3: Backend API Changes

**Status:** Pending

**Tasks:**

1. **Update DTOs** (`packages/shared/src/package/`)
   - Add `RecurringPatternDto` class
   - Update `PurchaseSmartPackDto` with patterns array
   - Add `CheckMultiSlotAvailabilityDto`
   - Add response interfaces

2. **Add new endpoint** (`apps/api/src/marketplace/`)
   - `GET /teachers/:teacherId/weekly-availability`
   - Returns teacher's weekly availability grid

3. **Update PackageService** (`apps/api/src/package/package.service.ts`)
   - Update `checkRecurringAvailability()` → `checkMultiSlotAvailability()`
   - Update `purchaseSmartPackage()` to handle patterns array
   - Add backward compatibility for legacy single-pattern

4. **Update booking creation logic**
   - Distribute sessions across patterns in chronological order
   - Handle uneven distribution (e.g., 8 sessions across 2 patterns = 4+4)

5. **Rebuild and test**
   ```bash
   cd apps/api
   npm run build
   npm run test
   ```

**Estimated Effort:** 4-6 hours

**Risk:** Medium - core business logic changes

**Backward Compatibility:**
```typescript
// In purchaseSmartPackage():
if (!data.recurringPatterns && data.recurringWeekday && data.recurringTime) {
  // Legacy single-pattern format - convert to array
  data.recurringPatterns = [{
    weekday: data.recurringWeekday,
    time: data.recurringTime
  }];
}
```

---

### Phase 4: Frontend Components

**Status:** Pending

**Tasks:**

1. **Create WeeklyAvailabilityGrid component**
   - Fetch teacher weekly availability
   - Render clickable grid
   - Handle slot selection (max 4)
   - Real-time validation
   - Show scheduled sessions preview

2. **Update types.ts**
   - Add `RecurringPattern` interface
   - Add `ScheduledSession` interface
   - Update `BookingTypeOption` if needed

3. **Update useBookingFlow.ts**
   - Replace `recurringWeekday`/`recurringTime`/`suggestedDates`
   - Add `recurringPatterns` and `scheduledSessions`
   - Update validation logic

4. **Update Step3Schedule.tsx**
   - Import and use new `WeeklyAvailabilityGrid`
   - Remove old `RecurringPatternSelector` usage

5. **Update Step5Review.tsx**
   - Display multiple patterns
   - Show all scheduled sessions
   - Display floating sessions info

6. **Update package.ts API client**
   - Add `getTeacherWeeklyAvailability()`
   - Update `purchaseSmartPack()` signature
   - Add `checkMultiSlotAvailability()`

7. **Delete old component**
   - Remove or deprecate `RecurringPatternSelector.tsx`

**Estimated Effort:** 8-12 hours

**Risk:** Medium - significant UI changes

---

### Phase 5: Local Testing

**Status:** Pending

**Test Cases:**

#### 5.1 Single-Slot Selection (Backward Compatibility)
- [ ] Select one slot per week
- [ ] Verify 8 sessions scheduled across 8 weeks
- [ ] Verify floating sessions info displayed
- [ ] Complete purchase flow
- [ ] Verify bookings created correctly

#### 5.2 Multi-Slot Selection (New Feature)
- [ ] Select 2 slots per week
- [ ] Verify 8 sessions scheduled across 4 weeks
- [ ] Select 3 slots per week
- [ ] Verify 8 sessions scheduled across ~3 weeks
- [ ] Select 4 slots per week (maximum)
- [ ] Verify 8 sessions scheduled across 2 weeks

#### 5.3 Conflict Detection
- [ ] Select slot that has conflict on week 3
- [ ] Verify conflict is shown in UI
- [ ] Verify alternative slots highlighted
- [ ] Verify partial availability handled

#### 5.4 Edge Cases
- [ ] Select same time on different days
- [ ] Unselect a slot after selecting
- [ ] Change tier after selecting slots
- [ ] Network error during availability check

#### 5.5 Package Purchase Flow
- [ ] Complete purchase with 2 slots/week
- [ ] Verify correct number of bookings created
- [ ] Verify `recurringPatterns` stored in DB
- [ ] Verify escrow amount correct
- [ ] Verify notifications sent

#### 5.6 Floating Session Booking
- [ ] Purchase package with multi-slot
- [ ] Book a floating session
- [ ] Verify floating count updates correctly

**Testing Commands:**
```bash
# Start local development
cd apps/api && npm run start:dev
cd apps/web && npm run dev

# Run unit tests
cd apps/api && npm run test

# Run integration tests
cd apps/api && npm run test:e2e
```

---

### Phase 6: Staging Deployment & Testing

**Status:** Pending

**Deployment Steps:**

1. **Deploy database migration**
   ```bash
   # On staging server
   npx prisma migrate deploy
   ```

2. **Deploy API changes**
   ```bash
   # Build and deploy API
   npm run build
   # Restart API service
   ```

3. **Deploy frontend changes**
   ```bash
   # Build and deploy web
   npm run build
   # Deploy to staging URL
   ```

4. **Staging QA Checklist:**
   - [ ] New package purchase with 1 slot/week
   - [ ] New package purchase with 2 slots/week
   - [ ] New package purchase with 3 slots/week
   - [ ] Existing package still works (backward compat)
   - [ ] Floating session booking works
   - [ ] Reschedule session works
   - [ ] Package expiry works
   - [ ] Notifications sent correctly
   - [ ] Mobile responsive UI

5. **Performance Testing:**
   - [ ] Availability grid loads < 2s
   - [ ] No N+1 queries in logs
   - [ ] Memory usage stable

---

### Phase 7: Production Deployment

**Status:** Pending

**Pre-Deployment Checklist:**
- [ ] Staging QA passed
- [ ] Database backup taken
- [ ] Rollback plan reviewed
- [ ] Team notified of deployment window

**Deployment Steps:**

1. **Take database backup**
   ```bash
   pg_dump production_db > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Run database migration**
   ```bash
   npx prisma migrate deploy
   ```

3. **Deploy API**
   ```bash
   # Deploy with zero-downtime strategy
   ```

4. **Deploy frontend**
   ```bash
   # Deploy new frontend build
   ```

5. **Verify deployment**
   - [ ] Health check passes
   - [ ] Test purchase flow
   - [ ] Monitor error rates
   - [ ] Monitor performance metrics

6. **Post-deployment monitoring (24 hours)**
   - [ ] Error rate normal
   - [ ] Package purchases successful
   - [ ] No customer complaints
   - [ ] Performance metrics stable

---

## Testing Plan

### Unit Tests

```typescript
// apps/api/src/package/package.service.spec.ts

describe('PackageService - Multi-Slot', () => {
  describe('checkMultiSlotAvailability', () => {
    it('should validate single pattern', async () => { });
    it('should validate multiple patterns', async () => { });
    it('should detect conflicts', async () => { });
    it('should calculate correct week distribution', async () => { });
  });

  describe('purchaseSmartPackage', () => {
    it('should create package with single pattern', async () => { });
    it('should create package with multiple patterns', async () => { });
    it('should create correct number of bookings', async () => { });
    it('should distribute sessions chronologically', async () => { });
    it('should handle backward compatibility', async () => { });
  });
});
```

### Integration Tests

```typescript
// apps/api/test/package.integration.spec.ts

describe('Smart Pack Multi-Slot Integration', () => {
  it('should complete full purchase flow with 2 patterns', async () => { });
  it('should handle concurrent purchases', async () => { });
  it('should maintain idempotency', async () => { });
});
```

### E2E Tests

```typescript
// apps/web/e2e/booking-flow.spec.ts

describe('Booking Flow - Package Purchase', () => {
  it('should select multiple slots from grid', async () => { });
  it('should show correct session preview', async () => { });
  it('should complete purchase successfully', async () => { });
});
```

---

## Rollback Plan

### Scenario 1: Database Migration Issue

```bash
# Rollback migration
npx prisma migrate resolve --rolled-back add-recurring-patterns-multi-slot

# Restore from backup if needed
psql production_db < backup_file.sql
```

### Scenario 2: API Issues

```bash
# Revert to previous API version
git checkout previous-tag
npm run build
# Restart API service
```

### Scenario 3: Frontend Issues

```bash
# Revert to previous frontend build
# Deploy previous version from CI/CD artifacts
```

### Backward Compatibility

The implementation maintains backward compatibility:
- Old packages with `recurringWeekday`/`recurringTime` continue to work
- API accepts both old and new DTO format
- UI defaults to single-slot if multi-slot fails

---

## Success Metrics

### User Experience

| Metric | Before | Target | Measurement |
|--------|--------|--------|-------------|
| Package booking completion rate | TBD | +20% | Analytics |
| Time to complete booking | TBD | -50% | Analytics |
| Support tickets about booking | TBD | -30% | Support system |

### Technical

| Metric | Target | Measurement |
|--------|--------|-------------|
| API response time | < 500ms | Monitoring |
| Error rate | < 0.1% | Monitoring |
| Test coverage | > 80% | CI/CD |

### Business

| Metric | Target | Measurement |
|--------|--------|-------------|
| Multi-slot adoption | > 50% of new packages | Database |
| Package purchases | +15% | Analytics |
| Average sessions per package | Stable | Database |

---

## Appendix

### A. Weekday Constants

```typescript
export enum Weekday {
  SUNDAY = 'SUNDAY',
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
}

export const WEEKDAY_NAMES_AR: Record<Weekday, string> = {
  SUNDAY: 'الأحد',
  MONDAY: 'الاثنين',
  TUESDAY: 'الثلاثاء',
  WEDNESDAY: 'الأربعاء',
  THURSDAY: 'الخميس',
  FRIDAY: 'الجمعة',
  SATURDAY: 'السبت',
};
```

### B. Session Distribution Algorithm

```typescript
/**
 * Distributes N sessions across M patterns chronologically
 *
 * Example: 8 sessions, 2 patterns (Tue 5PM, Thu 4PM)
 *
 * Week 1: Tue (1), Thu (2)
 * Week 2: Tue (3), Thu (4)
 * Week 3: Tue (5), Thu (6)
 * Week 4: Tue (7), Thu (8)
 */
function distributeSessionsChronologically(
  patterns: RecurringPattern[],
  totalSessions: number,
  startDate: Date
): ScheduledSession[] {
  const sessions: ScheduledSession[] = [];
  const sortedPatterns = sortPatternsByWeekday(patterns, startDate);

  let sessionNumber = 1;
  let weekOffset = 0;

  while (sessionNumber <= totalSessions) {
    for (const pattern of sortedPatterns) {
      if (sessionNumber > totalSessions) break;

      const sessionDate = calculateSessionDate(pattern, startDate, weekOffset);
      sessions.push({
        date: sessionDate.toISOString(),
        weekday: pattern.weekday,
        time: pattern.time,
        sessionNumber: sessionNumber++,
      });
    }
    weekOffset++;
  }

  return sessions;
}
```

### C. Related Documentation

- [DEVELOPER-WORKFLOW.md](./DEVELOPER-WORKFLOW.md) - Development workflow
- [API Documentation](../apps/api/README.md) - API reference
- [Prisma Schema](../packages/database/prisma/schema.prisma) - Database schema

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-01-01 | Claude | Initial document creation |
