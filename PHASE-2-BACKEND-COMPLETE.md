# Phase 2 Complete: Smart Pack Backend Implementation

## Summary

Phase 2 successfully implements the complete backend infrastructure for the **Smart Pack** system - a fully configurable, semi-structured package booking system where:

- **Admin** can create and manage any package tier configuration
- **Teachers** can enable/disable packages and specific tiers
- **Students** can purchase packages with auto-scheduled recurring sessions + flexible floating sessions
- **Auto-refund** system for unused floating sessions on expiry

---

## What Was Implemented

### 1. DTOs (Data Transfer Objects) ✅

Created comprehensive validation DTOs in `/packages/shared/src/package/`:

#### Student Operations
- **`PurchaseSmartPackDto`**: Purchase a Smart Pack with recurring pattern
  - `studentId`, `teacherId`, `subjectId`, `tierId`
  - `recurringWeekday` (MONDAY, TUESDAY, etc.)
  - `recurringTime` (HH:MM format)
  - `idempotencyKey` (prevents duplicate purchases)

- **`CheckRecurringAvailabilityDto`**: Check teacher availability for N consecutive weeks
  - Returns conflicts, suggested dates, first/last session, package end date

- **`BookFloatingSessionDto`**: Book one of the floating sessions
  - `date`, `time`, optional `notes`

- **`RescheduleSessionDto`**: Reschedule a package session
  - `newDate`, `newTime`, optional `reason`
  - Enforces reschedule limit per session

#### Admin Operations
- **`CreatePackageTierDto`**: Full tier configuration
  - `sessionCount`, `discountPercent`
  - `recurringRatio`, `floatingRatio` (must sum to 1.0)
  - `rescheduleLimit`, `durationWeeks`, `gracePeriodDays`
  - Bilingual names (`nameAr`, `nameEn`)
  - Marketing fields (`isFeatured`, `badge`, `displayOrder`)

- **`UpdatePackageTierDto`**: Partial update of tier configuration
  - All fields optional for flexible updates

#### Teacher Operations
- **`UpdateTeacherDemoSettingsDto`**: Master toggle for packages
  - `demoEnabled`, `packagesEnabled`

- **`UpdateTeacherTierSettingDto`**: Per-tier control
  - `isEnabled` (enable/disable specific tier)

### 2. Backend Service Methods ✅

Updated `/apps/api/src/package/package.service.ts` with 8 new methods:

#### Admin Methods
- **`createTier()`**: Create new package tier with full configuration
  - Validates `recurringRatio + floatingRatio = 1.0`
  - Supports all Smart Pack fields

- **`updateTier()`**: Update existing tier
  - Partial updates supported
  - Ratio validation

#### Smart Pack Purchase
- **`purchaseSmartPackage()`**: Complete purchase flow
  1. Validates packages globally enabled
  2. Checks teacher has packages enabled
  3. Checks teacher has this tier enabled
  4. Idempotency check
  5. Validates recurring availability (N consecutive weeks)
  6. Calculates session counts (recurring vs floating)
  7. Calculates prices with discount
  8. Deducts from student wallet
  9. Creates StudentPackage record
  10. **Auto-schedules all recurring sessions**
  11. Returns package with tier details

- **`checkRecurringAvailability()`**: Check availability for recurring pattern
  - Generates N consecutive weeks of target weekday
  - Checks for booking conflicts
  - Returns available dates, conflicts, package timeline

#### Student Session Management
- **`bookFloatingSession()`**: Book floating session
  - Verifies package active and not expired
  - Checks floating sessions available
  - Validates teacher availability
  - Creates booking with `FLOATING` type
  - Atomically increments `floatingSessionsUsed`

- **`reschedulePackageSession()`**: Reschedule with quota
  - Verifies reschedule limit not exceeded
  - Checks teacher availability at new time
  - Updates booking date/time
  - Increments `rescheduleCount`

#### Teacher Settings
- **`updateTeacherDemoSettings()`**: Update master package toggle
  - Upsert operation (creates if doesn't exist)

- **`updateTeacherTierSetting()`**: Per-tier enable/disable
  - Upsert operation
  - Verifies tier exists

- **`getTeacherTierSettings()`**: Get all tiers with teacher's settings
  - Returns all active tiers
  - Maps teacher's enable/disable status
  - Defaults to enabled if no record

#### Expiry & Refunds
- **`expireSmartPacks()`**: Cron-safe expiry handler
  - Finds packages past grace period
  - Calculates unused floating sessions
  - Auto-refunds to student wallet
  - Creates refund transaction record
  - Marks package as EXPIRED
  - Idempotent (skips already processed)

### 3. API Endpoints ✅

#### Admin Endpoints (`/apps/api/src/admin/admin.controller.ts`)

```
GET    /admin/package-tiers          - Get active tiers
GET    /admin/package-tiers/all      - Get all tiers (including inactive)
GET    /admin/package-tiers/:id      - Get specific tier
POST   /admin/package-tiers          - Create new tier
PATCH  /admin/package-tiers/:id      - Update tier
DELETE /admin/package-tiers/:id      - Soft delete tier
GET    /admin/package-stats          - Get package statistics
```

**All endpoints require**: `@Roles(UserRole.ADMIN)`

#### Teacher Endpoints (`/apps/api/src/teacher/teacher.controller.ts`)

```
GET    /teacher/me/package-tiers        - Get available tiers with enable/disable status
PATCH  /teacher/me/package-settings     - Update master package toggle
PATCH  /teacher/me/package-tiers/:id    - Enable/disable specific tier
```

**All endpoints require**: `@Roles(UserRole.TEACHER)` + `@RequiresApproval()`

**Rate limits**: 10 updates per minute

#### Student Endpoints (`/apps/api/src/package/package.controller.ts`)

```
POST   /packages/smart-pack/purchase              - Purchase Smart Pack
POST   /packages/smart-pack/check-availability    - Check recurring availability
POST   /packages/smart-pack/:id/book-floating     - Book floating session
PATCH  /packages/smart-pack/bookings/:id/reschedule - Reschedule session
GET    /packages/my                                - Get my packages
GET    /packages/:id                               - Get package details
```

**All endpoints require**: `@Roles(UserRole.STUDENT)`

### 4. Module Dependencies ✅

Updated `/apps/api/src/teacher/teacher.module.ts`:
- Added `PackageModule` import
- Enables `PackageService` injection in `TeacherController`

---

## Key Implementation Details

### Auto-Scheduling Logic

When a student purchases a Smart Pack:

1. **Calculate session split**:
   ```typescript
   recurringCount = Math.round(sessionCount * recurringRatio)
   floatingCount = sessionCount - recurringCount
   ```

2. **Check availability**: Validate teacher is free for N consecutive weeks

3. **Auto-schedule recurring sessions**:
   - For each of the N weeks, create a `Booking` with:
     - `status: 'SCHEDULED'`
     - `packageSessionType: 'AUTO_SCHEDULED'`
     - `maxReschedules: tier.rescheduleLimit`
   - Create `PackageRedemption` linking booking to package

4. **Track usage**: Set `package.sessionsUsed = recurringCount`

5. **Set expiry**: `gracePeriodEnds = lastScheduledSession + gracePeriodDays`

### Expiry & Refund Logic

Daily cron job calls `expireSmartPacks()`:

```typescript
unusedFloating = floatingSessionCount - floatingSessionsUsed
refundAmount = discountedPrice * unusedFloating
```

- Refunds to student wallet
- Creates `Transaction` record with type `REFUND`
- Marks package as `EXPIRED`
- Idempotent (prevents double refunds)

### Security Features

✅ **Idempotency**: All purchase/payment operations use idempotency keys
✅ **SERIALIZABLE Isolation**: Package purchases use strictest isolation level
✅ **Atomic Operations**: Session booking + wallet updates in single transaction
✅ **Rate Limiting**: All endpoints have throttle protection
✅ **Role Guards**: Strict role-based access control
✅ **Validation**: Class-validator on all DTOs

---

## Database Changes from Phase 1

Already applied in previous migration:

- Enhanced `PackageTier` with Smart Pack config fields
- New `TeacherPackageTierSetting` for per-tier teacher control
- Updated `StudentPackage` with recurring pattern tracking
- Updated `Booking` with reschedule limits and session types
- New enum: `PackageSessionType` (AUTO_SCHEDULED, FLOATING)

---

## Testing the API

### 1. Admin Creates Tier

```bash
POST /admin/package-tiers
{
  "sessionCount": 8,
  "discountPercent": 12,
  "recurringRatio": 0.75,
  "floatingRatio": 0.25,
  "rescheduleLimit": 2,
  "durationWeeks": 6,
  "gracePeriodDays": 14,
  "nameAr": "الباقة التجريبية",
  "nameEn": "Trial Pack",
  "isFeatured": true,
  "displayOrder": 1
}
```

Result: 8 sessions = 6 recurring + 2 floating

### 2. Teacher Enables Packages

```bash
PATCH /teacher/me/package-settings
{
  "packagesEnabled": true
}
```

### 3. Student Checks Availability

```bash
POST /packages/smart-pack/check-availability
{
  "teacherId": "teacher-uuid",
  "weekday": "TUESDAY",
  "time": "17:00",
  "sessionCount": 6
}
```

Response:
```json
{
  "available": true,
  "conflicts": [],
  "suggestedDates": [
    "2025-01-07T17:00:00Z",
    "2025-01-14T17:00:00Z",
    "2025-01-21T17:00:00Z",
    "2025-01-28T17:00:00Z",
    "2025-02-04T17:00:00Z",
    "2025-02-11T17:00:00Z"
  ],
  "firstSession": "2025-01-07T17:00:00Z",
  "lastSession": "2025-02-11T17:00:00Z",
  "packageEndDate": "2025-02-25T17:00:00Z"
}
```

### 4. Student Purchases Smart Pack

```bash
POST /packages/smart-pack/purchase
{
  "teacherId": "teacher-uuid",
  "subjectId": "subject-uuid",
  "tierId": "tier-uuid",
  "recurringWeekday": "TUESDAY",
  "recurringTime": "17:00",
  "idempotencyKey": "unique-key-123"
}
```

Result:
- Student wallet debited
- 6 recurring sessions auto-scheduled
- 2 floating sessions available
- Package expires 14 days after last scheduled session

### 5. Student Books Floating Session

```bash
POST /packages/smart-pack/{packageId}/book-floating
{
  "date": "2025-02-15",
  "time": "14:00",
  "notes": "Extra practice session"
}
```

### 6. Student Reschedules Session

```bash
PATCH /packages/smart-pack/bookings/{bookingId}/reschedule
{
  "newDate": "2025-01-08",
  "newTime": "18:00",
  "reason": "Conflict with another class"
}
```

---

## Next Steps (Phase 3: Frontend)

### Admin UI
- [ ] Package tier management dashboard
- [ ] Create/edit tier forms with validation
- [ ] Tier list with enable/disable toggles
- [ ] Package statistics overview

### Teacher UI
- [ ] Package settings page
  - [ ] Master toggle for packages
  - [ ] Per-tier enable/disable checkboxes
  - [ ] Preview of available tiers
- [ ] Package revenue dashboard

### Student UI
- [ ] Smart Pack purchase flow
  - [ ] Tier selection cards
  - [ ] Recurring pattern selector (weekday + time)
  - [ ] Availability checker
  - [ ] Purchase confirmation
- [ ] My Packages page
  - [ ] Active packages list
  - [ ] Sessions timeline (recurring vs floating)
  - [ ] Floating session booking modal
  - [ ] Reschedule modal with quota display
- [ ] Package details page
  - [ ] Usage statistics
  - [ ] Scheduled sessions
  - [ ] Floating sessions remaining
  - [ ] Expiry countdown

---

## Files Modified in Phase 2

### DTOs Created
- `/packages/shared/src/package/purchase-smart-pack.dto.ts`
- `/packages/shared/src/package/check-recurring-availability.dto.ts`
- `/packages/shared/src/package/book-floating-session.dto.ts`
- `/packages/shared/src/package/reschedule-session.dto.ts`
- `/packages/shared/src/package/admin-package-tier.dto.ts`
- `/packages/shared/src/package/teacher-tier-settings.dto.ts`
- `/packages/shared/src/package/index.ts`
- `/packages/shared/index.ts` (updated exports)

### Backend Services Updated
- `/apps/api/src/package/package.service.ts` (added 8 methods)

### Controllers Updated
- `/apps/api/src/admin/admin.controller.ts` (updated tier endpoints)
- `/apps/api/src/teacher/teacher.controller.ts` (added 3 endpoints)
- `/apps/api/src/package/package.controller.ts` (added 4 endpoints)

### Modules Updated
- `/apps/api/src/teacher/teacher.module.ts` (added PackageModule import)

---

## Architecture Highlights

### Separation of Concerns
- **DTOs**: Validation layer (shared package)
- **Service**: Business logic (transaction management, calculations)
- **Controllers**: Route handling, authentication, authorization

### Scalability
- **Configurable tiers**: No hardcoded package types
- **Teacher control**: Granular opt-in/opt-out
- **Dynamic pricing**: Calculated from tier config at purchase time
- **Immutable snapshots**: Package stores pricing at purchase (tier changes don't affect existing packages)

### Data Integrity
- **Atomic transactions**: All financial operations use DB transactions
- **SERIALIZABLE isolation**: Prevents race conditions
- **Idempotency**: Prevents duplicate charges
- **Validation**: DTOs validate all input

### User Experience
- **Auto-scheduling**: Students don't manually book recurring sessions
- **Flexibility**: Floating sessions for makeup/extra classes
- **Fairness**: Limited reschedules prevent abuse
- **Trust**: Auto-refunds build confidence

---

## Summary

✅ **Phase 1**: Database schema complete
✅ **Phase 2**: Backend API complete

**Ready for Phase 3**: Frontend implementation

The Smart Pack system is now fully operational from the backend. All API endpoints are ready for frontend integration.
