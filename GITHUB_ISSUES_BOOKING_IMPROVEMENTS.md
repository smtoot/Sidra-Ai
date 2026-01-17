# GitHub Issues for Booking System Improvements

This file contains all GitHub issues for the Booking System Improvement project. Each issue is formatted for easy creation in GitHub.

**How to use:**
1. Copy each issue section
2. Create a new GitHub issue
3. Paste the content
4. Add appropriate labels and assign to milestone
5. Or use GitHub CLI: `gh issue create --title "..." --body "..."`

---

## Milestones

Create these milestones in GitHub:
- `Phase 1: Critical Fixes` (Due: Week 1)
- `Phase 2: Security & Validation` (Due: Week 2-3)
- `Phase 3: Code Quality & Consistency` (Due: Week 4-5)
- `Phase 4: Testing & Documentation` (Due: Week 6-7)
- `Phase 5: Refactoring & Architecture` (Due: Week 8-10)
- `Phase 6: Performance & Optimization` (Ongoing)

---

## Labels

Create these labels:
- `priority:critical` (red) - P0 issues
- `priority:high` (orange) - P1 issues
- `priority:medium` (yellow) - P2 issues
- `priority:low` (green) - P3 issues
- `type:bug` - Bug fixes
- `type:security` - Security improvements
- `type:refactor` - Code refactoring
- `type:test` - Testing related
- `type:docs` - Documentation
- `type:performance` - Performance improvements
- `phase:1` through `phase:6` - Phase labels

---

# Phase 1: Critical Fixes (Week 1)

## Issue #1: Fix Incomplete Import Statement

**Labels:** `priority:critical`, `type:bug`, `phase:1`  
**Milestone:** Phase 1: Critical Fixes  
**Estimated Time:** 15 minutes

### Description

The `SystemSettingsService` import statement on line 31 of `booking.service.ts` is incomplete, causing compilation errors.

### Steps to Fix

1. Open `apps/api/src/booking/booking.service.ts`
2. Locate line 31
3. Verify the import statement is complete:
   ```typescript
   import { SystemSettingsService } from '../admin/system-settings.service';
   ```
4. If incomplete, fix it
5. Run `npm run build` to verify compilation
6. Commit with message: `fix(booking): complete SystemSettingsService import`

### Acceptance Criteria

- [ ] Code compiles without errors
- [ ] No TypeScript errors
- [ ] Application starts successfully

### Testing

- Run build: `npm run build`
- Start application: `npm run start:dev`
- Verify no startup errors

---

## Issue #2: Remove Debug Code from Production

**Labels:** `priority:critical`, `type:bug`, `phase:1`  
**Milestone:** Phase 1: Critical Fixes  
**Estimated Time:** 10 minutes

### Description

Debug logging code for a specific booking ID (BK-2601-0002) is present in production code at lines 1308-1313 of `booking.service.ts`. This should be removed.

### Steps to Fix

1. Open `apps/api/src/booking/booking.service.ts`
2. Locate lines 1308-1313 (debug logging block)
3. Remove the entire debug block:
   ```typescript
   // Remove this:
   // DEBUG LOGGING
   if (booking.readableId === 'BK-2601-0002') {
     console.log(
       `[DEBUG] Transformed Booking BK-2601-0002: jitsiEnabled=${transformed.jitsiEnabled}, DB_Value=${booking.jitsiEnabled}`,
     );
   }
   ```
4. Run tests to ensure no functionality broken
5. Commit with message: `fix(booking): remove debug code from transformBooking`

### Acceptance Criteria

- [ ] Debug code removed
- [ ] No console.log statements for specific booking IDs
- [ ] Functionality unchanged

### Testing

- Run unit tests (if any)
- Manual test: Create and retrieve a booking
- Verify no debug output in logs

---

## Issue #3: Fix PII Exposure in Notifications

**Labels:** `priority:critical`, `type:security`, `phase:1`  
**Milestone:** Phase 1: Critical Fixes  
**Estimated Time:** 4 hours

### Description

Phone numbers are being used as display names in notifications, violating Engineering Rule #12: "NEVER expose PII (Email, Phone) to other users."

### Affected Files

- `apps/api/src/booking/booking.service.ts`
- `apps/api/src/booking/escrow-scheduler.service.ts`

### Steps to Fix

1. **Create helper function for safe display names:**
   ```typescript
   // Add to booking.service.ts
   private getSafeDisplayName(user: any, fallback: string): string {
     if (!user) return fallback;
     const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
     return name || user.displayName || fallback;
   }
   ```

2. **Fix all instances where phone numbers are used as names:**
   - Line 222: `booking.teacher_profiles.users.phoneNumber` → Use `getSafeDisplayName()`
   - Line 1354: `booking.teacher_profiles.users.phoneNumber` → Use `getSafeDisplayName()`
   - Line 1364: `booking.users_bookings_bookedByUserIdTousers.phoneNumber` → Use `getSafeDisplayName()`
   - Line 1624: `booking.teacher_profiles.users.phoneNumber` → Use `getSafeDisplayName()`
   - Line 553: `booking.teacher_profiles.users.phoneNumber` → Use `getSafeDisplayName()`

3. **Fix in escrow-scheduler.service.ts:**
   - Line 222: `booking.teacher_profiles.users.phoneNumber` → Use helper

4. **Audit all notification calls:**
   - Search for `phoneNumber` in notification messages
   - Replace with proper display names
   - Ensure no email addresses in user-facing messages

5. **Test all notification scenarios:**
   - Booking approval notifications
   - Payment notifications
   - Completion notifications
   - Cancellation notifications

### Acceptance Criteria

- [ ] No phone numbers used as display names
- [ ] No email addresses in user-facing notifications
- [ ] All notifications use proper display names or fallbacks
- [ ] Engineering rule #12 compliance verified

### Testing

- Create test bookings and verify notification content
- Check logs for PII exposure
- Manual review of notification messages

### Files to Review

```bash
grep -r "phoneNumber" apps/api/src/booking/
grep -r "email" apps/api/src/booking/ | grep -i notification
```

---

## Issue #4: Add Timezone Validation

**Labels:** `priority:high`, `type:security`, `phase:1`  
**Milestone:** Phase 1: Critical Fixes  
**Estimated Time:** 3 hours

### Description

Timezone field accepts any string without IANA timezone validation. Invalid timezones like "Invalid/Timezone" are accepted, causing potential issues in timezone conversions.

### Steps to Fix

1. **Create timezone validation utility:**
   ```typescript
   // apps/api/src/common/utils/timezone.util.ts
   import { IANAZone } from 'luxon';
   
   export function isValidTimezone(timezone: string): boolean {
     try {
       // Use luxon's IANAZone to validate
       IANAZone.create(timezone);
       return true;
     } catch {
       return false;
     }
   }
   ```

2. **Add validation to CreateBookingDto:**
   ```typescript
   // packages/shared/src/booking/booking.dto.ts
   import { IsOptional, IsString, Matches } from 'class-validator';
   
   @IsString()
   @IsOptional()
   @Matches(/^[A-Za-z_]+\/[A-Za-z_]+$/, {
     message: 'Timezone must be a valid IANA timezone (e.g., America/New_York)'
   })
   timezone?: string;
   ```

3. **Add server-side validation:**
   ```typescript
   // apps/api/src/booking/booking.service.ts
   import { isValidTimezone } from '../common/utils/timezone.util';
   
   // In createRequest method, before using timezone:
   if (dto.timezone && !isValidTimezone(dto.timezone)) {
     throw new BadRequestException(
       'Invalid timezone. Must be a valid IANA timezone (e.g., Asia/Riyadh, America/New_York)'
     );
   }
   ```

4. **Update error messages to be consistent (Arabic):**
   ```typescript
   throw new BadRequestException(
     'المنطقة الزمنية غير صحيحة. يجب أن تكون منطقة زمنية IANA صالحة (مثل: Asia/Riyadh)'
   );
   ```

5. **Add unit tests:**
   ```typescript
   describe('Timezone Validation', () => {
     it('should accept valid IANA timezones', () => {
       expect(isValidTimezone('Asia/Riyadh')).toBe(true);
       expect(isValidTimezone('America/New_York')).toBe(true);
     });
     
     it('should reject invalid timezones', () => {
       expect(isValidTimezone('Invalid/Timezone')).toBe(false);
       expect(isValidTimezone('UTC+3')).toBe(false);
     });
   });
   ```

### Acceptance Criteria

- [ ] Invalid timezones are rejected
- [ ] Valid IANA timezones are accepted
- [ ] Error messages are user-friendly
- [ ] Unit tests pass

### Testing

- Test with valid timezones: `Asia/Riyadh`, `America/New_York`, `Europe/London`
- Test with invalid timezones: `Invalid/Timezone`, `UTC+3`, `GMT+5`
- Test with empty/null timezone (should default to UTC)
- Integration test: Create booking with invalid timezone

---

# Phase 2: Security & Validation (Week 2-3)

## Issue #5: Remove Price Field from CreateBookingDto

**Labels:** `priority:high`, `type:security`, `phase:2`  
**Milestone:** Phase 2: Security & Validation  
**Estimated Time:** 1 hour

### Description

While the server correctly ignores client-provided price and calculates it server-side, the DTO still accepts `price` as optional. This creates confusion and potential client-side validation issues.

### Steps to Fix

1. **Update CreateBookingDto:**
   ```typescript
   // packages/shared/src/booking/booking.dto.ts
   // Remove or comment out the price field:
   // @Type(() => Number)
   // @IsNumber()
   // @IsOptional()
   // @Min(0)
   // price?: number;
   
   // Add JSDoc comment explaining why:
   /**
    * Note: Price is calculated server-side based on teacher's rate and duration.
    * Client-provided price is ignored for security reasons.
    */
   ```

2. **Update frontend types (if needed):**
   - Remove `price` from `CreateBookingRequest` interface
   - Update API calls to not send price

3. **Add migration note:**
   - Document that price field removal is intentional
   - Ensure backward compatibility (field ignored if sent)

### Acceptance Criteria

- [ ] Price field removed from DTO
- [ ] Documentation explains why
- [ ] Server still works if old clients send price (ignored)
- [ ] Frontend updated (if applicable)

### Testing

- Create booking without price field
- Verify price calculated correctly
- Test with old client sending price (should be ignored)

---

## Issue #6: Add Rate Limiting to Missing Endpoints

**Labels:** `priority:high`, `type:security`, `phase:2`  
**Milestone:** Phase 2: Security & Validation  
**Estimated Time:** 2 hours

### Description

Some endpoints lack rate limiting, which could be used for enumeration attacks or abuse:
- `getBookingById` - No rate limit
- `getCancellationEstimate` - No rate limit
- `getMeetingEvents` - No rate limit

### Steps to Fix

1. **Add rate limits to missing endpoints:**
   ```typescript
   // apps/api/src/booking/booking.controller.ts
   
   @Get(':id')
   @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
   getBookingById(@Request() req: any, @Param('id') id: string) {
     return this.bookingService.getBookingById(
       req.user.userId,
       req.user.role,
       id,
     );
   }
   
   @Get(':id/cancel-estimate')
   @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
   getCancellationEstimate(@Request() req: any, @Param('id') id: string) {
     return this.bookingService.getCancellationEstimate(
       req.user.userId,
       req.user.role,
       id,
     );
   }
   
   @Get(':id/meeting-events')
   @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
   @UseGuards(RolesGuard)
   @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT)
   getMeetingEvents(@Param('id') id: string) {
     return this.bookingService.getMeetingEvents(id);
   }
   ```

2. **Test rate limiting:**
   - Make requests exceeding limits
   - Verify 429 status code returned
   - Verify rate limit headers present

### Acceptance Criteria

- [ ] All endpoints have appropriate rate limits
- [ ] Rate limiting works correctly
- [ ] Error messages are clear

### Testing

- Load test endpoints to verify rate limiting
- Check rate limit headers in responses

---

## Issue #7: Expand Meeting Link Validation

**Labels:** `priority:medium`, `type:bug`, `phase:2`  
**Milestone:** Phase 2: Security & Validation  
**Estimated Time:** 2 hours

### Description

Meeting link validation only allows specific domains (Google Meet, Zoom, Teams), but teachers may use other platforms like Jitsi or custom domains.

### Steps to Fix

1. **Update meeting link validation:**
   ```typescript
   // apps/api/src/booking/booking.service.ts
   // In updateMeetingLink method:
   
   // Validate meeting link URL
   if (dto.meetingLink) {
     try {
       const url = new URL(dto.meetingLink);
       
       // Must be HTTPS
       if (url.protocol !== 'https:') {
         throw new BadRequestException(
           'Meeting link must use HTTPS protocol'
         );
       }
       
       // Optional: Check against whitelist OR allow all HTTPS
       const allowedDomains = [
         'meet.google.com',
         'zoom.us',
         'teams.microsoft.com',
         'teams.live.com',
         'jitsi.riot.im', // Add Jitsi
         // Add more as needed
       ];
       
       // Option 1: Whitelist approach (current)
       const isValid = allowedDomains.some((domain) =>
         url.hostname.includes(domain),
       );
       
       // Option 2: Allow all HTTPS (more flexible)
       // const isValid = url.protocol === 'https:';
       
       if (!isValid) {
         throw new BadRequestException(
           'Meeting link must be from an approved platform. Contact support to add new platforms.'
         );
       }
     } catch (error) {
       if (error instanceof BadRequestException) throw error;
       throw new BadRequestException('Invalid meeting link URL format');
     }
   }
   ```

2. **Add admin override capability (optional):**
   - Allow admins to bypass validation
   - Add flag in system settings

### Acceptance Criteria

- [ ] HTTPS URLs are validated
- [ ] Whitelist expanded or all HTTPS allowed
- [ ] Clear error messages
- [ ] Admin override available (if implemented)

### Testing

- Test with valid URLs from whitelist
- Test with invalid URLs
- Test with HTTP (should fail)
- Test with non-whitelisted HTTPS (should fail or pass based on approach)

---

## Issue #8: Add Comprehensive Input Validation

**Labels:** `priority:high`, `type:security`, `phase:2`  
**Milestone:** Phase 2: Security & Validation  
**Estimated Time:** 2 days

### Description

Several methods lack comprehensive input validation, which could lead to invalid data or security issues.

### Methods to Validate

1. **completeSession:**
   ```typescript
   // Validate dto fields
   if (dto?.topicsCovered && dto.topicsCovered.length > 2000) {
     throw new BadRequestException('Topics covered must be less than 2000 characters');
   }
   
   if (dto?.studentPerformanceRating && (dto.studentPerformanceRating < 1 || dto.studentPerformanceRating > 5)) {
     throw new BadRequestException('Performance rating must be between 1 and 5');
   }
   ```

2. **reschedulePackageSession:**
   ```typescript
   // Validate new times are reasonable
   const maxFutureDate = new Date();
   maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 1);
   
   if (newStartTime > maxFutureDate) {
     throw new BadRequestException('Cannot reschedule more than 1 year in advance');
   }
   
   // Validate duration matches original
   const originalDuration = booking.endTime.getTime() - booking.startTime.getTime();
   const newDuration = newEndTime.getTime() - newStartTime.getTime();
   const tolerance = 60000; // 1 minute
   
   if (Math.abs(originalDuration - newDuration) > tolerance) {
     throw new BadRequestException('Rescheduled session must have the same duration');
   }
   ```

3. **raiseDispute:**
   ```typescript
   // Validate evidence array
   if (dto.evidence && dto.evidence.length > 10) {
     throw new BadRequestException('Maximum 10 evidence items allowed');
   }
   
   if (dto.description && dto.description.length > 5000) {
     throw new BadRequestException('Description must be less than 5000 characters');
   }
   ```

4. **updateMeetingLink:**
   - Already has validation, but ensure it's comprehensive

### Acceptance Criteria

- [ ] All public methods have input validation
- [ ] Validation errors are clear and helpful
- [ ] Edge cases handled (null, undefined, empty strings)

### Testing

- Unit tests for each validation
- Integration tests with invalid inputs
- Test boundary conditions

---

## Issue #9: Add Database Constraints for Data Integrity

**Labels:** `priority:high`, `type:security`, `phase:2`  
**Milestone:** Phase 2: Security & Validation  
**Estimated Time:** 1 day

### Description

Missing database-level constraints could allow invalid data to be stored. Need to add check constraints and indexes.

### Steps to Fix

1. **Create migration for check constraints:**
   ```sql
   -- Add check constraints
   ALTER TABLE bookings
   ADD CONSTRAINT bookings_endtime_after_starttime 
     CHECK (endTime > startTime);
   
   ALTER TABLE bookings
   ADD CONSTRAINT bookings_price_non_negative 
     CHECK (price >= 0);
   
   ALTER TABLE bookings
   ADD CONSTRAINT bookings_refund_percent_valid 
     CHECK (refundPercent IS NULL OR (refundPercent >= 0 AND refundPercent <= 100));
   
   ALTER TABLE bookings
   ADD CONSTRAINT bookings_commission_rate_valid 
     CHECK (commissionRate >= 0 AND commissionRate <= 1);
   ```

2. **Test constraints:**
   - Try to insert invalid data
   - Verify constraints prevent invalid data
   - Update existing data if needed

3. **Add indexes (if missing):**
   ```sql
   -- Composite indexes for common queries
   CREATE INDEX IF NOT EXISTS bookings_booked_by_status_created 
     ON bookings(bookedByUserId, status, createdAt);
   
   CREATE INDEX IF NOT EXISTS bookings_teacher_status_starttime 
     ON bookings(teacherId, status, startTime);
   
   CREATE INDEX IF NOT EXISTS bookings_dispute_window_closes 
     ON bookings(disputeWindowClosesAt) 
     WHERE status = 'PENDING_CONFIRMATION';
   
   CREATE INDEX IF NOT EXISTS bookings_payment_deadline 
     ON bookings(paymentDeadline) 
     WHERE status = 'WAITING_FOR_PAYMENT';
   ```

### Acceptance Criteria

- [ ] All constraints added
- [ ] Constraints prevent invalid data
- [ ] Indexes improve query performance
- [ ] Migration tested on staging

### Testing

- Test constraint violations
- Verify query performance improvements
- Load test with new indexes

---

# Phase 3: Code Quality & Consistency (Week 4-5)

## Issue #10: Standardize Error Messages

**Labels:** `priority:medium`, `type:refactor`, `phase:3`  
**Milestone:** Phase 3: Code Quality & Consistency  
**Estimated Time:** 1 day

### Description

Error messages mix Arabic and English inconsistently. Need to standardize on one language (Arabic for user-facing) and create constants for maintainability.

### Steps to Fix

1. **Create error message constants file:**
   ```typescript
   // apps/api/src/booking/booking-error-messages.ts
   
   export const BookingErrorMessages = {
     // Arabic messages (standardize on Arabic for user-facing)
     CANNOT_BOOK_PAST: 'لا يمكن حجز جلسات في الماضي',
     TEACHER_ON_VACATION: 'المعلم في إجازة حالياً',
     SLOT_ALREADY_BOOKED: 'لقد تم حجز هذا الموعد للتو. يرجى اختيار وقت آخر.',
     INSUFFICIENT_BALANCE: 'رصيد ولي الأمر غير كافٍ',
     SESSION_TOO_LONG: 'مدة الجلسة لا يمكن أن تتجاوز 8 ساعات',
     INVALID_TIMEZONE: 'المنطقة الزمنية غير صحيحة',
     
     // English for internal/logging
     BOOKING_NOT_FOUND: 'Booking not found',
     UNAUTHORIZED: 'Not authorized to perform this action',
     // ... more
   } as const;
   ```

2. **Replace all error messages:**
   - Search and replace throughout booking.service.ts
   - Use constants instead of inline strings
   - Ensure consistency

3. **Add i18n support (optional, future):**
   - Structure for future internationalization
   - Keep Arabic as default

### Acceptance Criteria

- [ ] All error messages use constants
- [ ] Messages are consistent (all Arabic for users)
- [ ] Easy to update messages in one place

### Testing

- Verify all error scenarios return correct messages
- Test error message consistency

---

## Issue #11: Extract Magic Numbers to Constants

**Labels:** `priority:medium`, `type:refactor`, `phase:3`  
**Milestone:** Phase 3: Code Quality & Consistency  
**Estimated Time:** 4 hours

### Description

Multiple hardcoded values (magic numbers) throughout the codebase should be extracted to constants for maintainability and configurability.

### Steps to Fix

1. **Create constants file:**
   ```typescript
   // apps/api/src/booking/booking.constants.ts
   
   export const BookingConstants = {
     // Session limits
     MAX_SESSION_HOURS: 8,
     MIN_SESSION_MINUTES: 15,
     
     // Commission
     DEFAULT_COMMISSION_RATE: 0.18,
     
     // Reminder intervals (hours)
     REMINDER_INTERVALS: [6, 12, 24],
     
     // Grace periods
     AUTO_COMPLETE_GRACE_PERIOD_HOURS: 2,
     PAYMENT_GRACE_PERIOD_MINUTES: 15,
     
     // Dispute window
     DEFAULT_DISPUTE_WINDOW_HOURS: 48,
     
     // Reschedule limits
     STUDENT_RESCHEDULE_WINDOW_HOURS: 6,
     STUDENT_MAX_RESCHEDULES: 2,
     TEACHER_RESCHEDULE_REQUEST_WINDOW_HOURS: 12,
     TEACHER_MAX_RESCHEDULE_REQUESTS: 1,
     STUDENT_RESPONSE_TIMEOUT_HOURS: 24,
   } as const;
   ```

2. **Replace all magic numbers:**
   - Line 227: `MAX_SESSION_HOURS`
   - Line 259: `DEFAULT_COMMISSION_RATE`
   - Line 167 (escrow-scheduler): `REMINDER_INTERVALS`
   - Line 2415: `AUTO_COMPLETE_GRACE_PERIOD_HOURS`
   - All other hardcoded values

3. **Move to system settings (where appropriate):**
   - Some constants should be configurable
   - Use system settings service for configurable values

### Acceptance Criteria

- [ ] All magic numbers extracted
- [ ] Constants are well-documented
- [ ] Configurable values use system settings

### Testing

- Verify behavior unchanged
- Test with different constant values

---

## Issue #12: Implement Consistent Status Transition Validation

**Labels:** `priority:high`, `type:refactor`, `phase:3`  
**Milestone:** Phase 3: Code Quality & Consistency  
**Estimated Time:** 2 days

### Description

Status transition validation is implemented in some places but not consistently enforced everywhere. Need to create a centralized validator and use it in all state-changing methods.

### Steps to Fix

1. **Create status transition validator service:**
   ```typescript
   // apps/api/src/booking/booking-status-validator.service.ts
   
   @Injectable()
   export class BookingStatusValidatorService {
     validateTransition(
       currentStatus: BookingStatus,
       newStatus: BookingStatus,
       context?: any
     ): void {
       if (!isValidStatusTransition(currentStatus, newStatus)) {
         const allowed = getAllowedTransitions(currentStatus);
         throw new BadRequestException(
           `Cannot transition from ${currentStatus} to ${newStatus}. ` +
           `Allowed transitions: ${allowed.join(', ') || 'none'}`
         );
       }
     }
   }
   ```

2. **Add validation to all state-changing methods:**
   - `approveRequest` - Validate PENDING_TEACHER_APPROVAL → SCHEDULED/WAITING_FOR_PAYMENT
   - `rejectRequest` - Validate PENDING_TEACHER_APPROVAL → REJECTED_BY_TEACHER
   - `cancelBooking` - Validate current status allows cancellation
   - `payForBooking` - Validate WAITING_FOR_PAYMENT → SCHEDULED
   - `completeSession` - Already has validation, ensure consistent
   - `confirmSessionEarly` - Already has validation, ensure consistent

3. **Add unit tests for all transitions:**
   - Test valid transitions
   - Test invalid transitions
   - Test edge cases

### Acceptance Criteria

- [ ] All state changes validate transitions
- [ ] Consistent error messages
- [ ] Unit tests cover all transitions

### Testing

- Unit tests for validator
- Integration tests for each state change
- Test invalid transitions are rejected

---

## Issue #13: Handle Edge Cases

**Labels:** `priority:high`, `type:bug`, `phase:3`  
**Milestone:** Phase 3: Code Quality & Consistency  
**Estimated Time:** 2 days

### Description

Several edge cases are not properly handled, which could lead to unexpected behavior or errors.

### Edge Cases to Handle

1. **Negative Duration:**
   ```typescript
   // Already handled in createRequest, but verify
   if (durationHours <= 0) {
     throw new BadRequestException('End time must be after start time');
   }
   ```

2. **Zero Price Sessions:**
   ```typescript
   // Only allow zero price for demos
   if (calculatedPrice === 0 && !isValidDemo) {
     throw new BadRequestException('Regular sessions cannot have zero price');
   }
   ```

3. **Past Session Completion:**
   ```typescript
   // In completeSession, add max grace period
   const MAX_COMPLETION_GRACE_HOURS = 168; // 7 days
   const hoursSinceEnd = (now.getTime() - sessionEndTime.getTime()) / (1000 * 60 * 60);
   
   if (hoursSinceEnd > MAX_COMPLETION_GRACE_HOURS) {
     throw new BadRequestException(
       'Cannot complete session more than 7 days after end time'
     );
   }
   ```

4. **Concurrent Cancellation:**
   ```typescript
   // Already handled with transactions, but add explicit check
   // Use conditional update with status check
   const updateResult = await tx.bookings.updateMany({
     where: {
       id: bookingId,
       status: booking.status, // Only update if status unchanged
     },
     data: { status: newStatus }
   });
   
   if (updateResult.count === 0) {
     throw new ConflictException('Booking status changed by another operation');
   }
   ```

5. **Package Depletion During Booking:**
   ```typescript
   // In approveRequest, check package status
   if (booking.package_redemptions) {
     const pkg = await tx.student_packages.findUnique({
       where: { id: booking.package_redemptions.packageId }
     });
     
     if (pkg.status !== 'ACTIVE' || pkg.sessionsUsed >= pkg.sessionCount) {
       throw new BadRequestException('Package is depleted or inactive');
     }
   }
   ```

### Acceptance Criteria

- [ ] All edge cases handled
- [ ] Clear error messages
- [ ] Unit tests for each edge case

### Testing

- Test each edge case scenario
- Verify error messages are helpful
- Test concurrent operations

---

# Phase 4: Testing & Documentation (Week 6-7)

## Issue #14: Create Test Infrastructure

**Labels:** `priority:high`, `type:test`, `phase:4`  
**Milestone:** Phase 4: Testing & Documentation  
**Estimated Time:** 1 day

### Description

Set up comprehensive test infrastructure for unit and integration tests.

### Steps to Fix

1. **Set up test structure:**
   ```
   apps/api/src/booking/
   ├── __tests__/
   │   ├── booking.service.spec.ts
   │   ├── booking-creation.service.spec.ts
   │   ├── booking-payment.service.spec.ts
   │   ├── booking-cancellation.service.spec.ts
   │   └── fixtures/
   │       ├── booking.fixtures.ts
   │       └── user.fixtures.ts
   ```

2. **Create test utilities:**
   ```typescript
   // __tests__/test-utils.ts
   export function createMockBooking(overrides?: Partial<Booking>): Booking {
     return {
       id: 'test-booking-id',
       status: 'PENDING_TEACHER_APPROVAL',
       price: 100,
       // ... defaults
       ...overrides,
     };
   }
   ```

3. **Set up test database:**
   - Use test database for integration tests
   - Seed data utilities
   - Cleanup utilities

### Acceptance Criteria

- [ ] Test infrastructure in place
- [ ] Can run tests in CI/CD
- [ ] Test utilities available

---

## Issue #15: Write Unit Tests for Critical Paths

**Labels:** `priority:high`, `type:test`, `phase:4`  
**Milestone:** Phase 4: Testing & Documentation  
**Estimated Time:** 3 days

### Description

Write comprehensive unit tests for all critical booking paths to achieve 80%+ code coverage.

### Test Coverage Goals

- Critical paths: 90%+ coverage
- All state transitions: 100% coverage
- Edge cases: All covered
- Error scenarios: All covered

### Tests to Write

1. **Booking Creation:**
   - Valid booking creation
   - Invalid timezone
   - Past date validation
   - Slot conflict detection
   - Demo eligibility
   - Package redemption

2. **Booking Approval:**
   - Sufficient balance
   - Insufficient balance
   - Package purchase
   - Status transitions

3. **Payment:**
   - Successful payment
   - Insufficient balance
   - Package purchase
   - Idempotency

4. **Completion:**
   - Early completion
   - Auto-release
   - Dispute window
   - Package vs single session

5. **Cancellation:**
   - Parent cancellation
   - Teacher cancellation
   - Refund calculation
   - Policy application

6. **Rescheduling:**
   - Student reschedule
   - Teacher reschedule request
   - Approval/decline
   - Duration validation

### Acceptance Criteria

- [ ] 80%+ code coverage
- [ ] All critical paths tested
- [ ] Tests run in CI/CD
- [ ] Tests are fast (< 30 seconds)

---

## Issue #16: Write Integration Tests

**Labels:** `priority:high`, `type:test`, `phase:4`  
**Milestone:** Phase 4: Testing & Documentation  
**Estimated Time:** 2 days

### Description

Write end-to-end integration tests for complete booking flows.

### Integration Test Scenarios

1. **Complete Booking Lifecycle:**
   - Create → Approve → Pay → Complete → Confirm
   - Create → Approve → Insufficient Balance → Pay → Complete
   - Create → Reject

2. **Package Booking Flow:**
   - Create with package → Approve → Complete
   - Package depletion handling

3. **Cancellation Flow:**
   - Parent cancels before payment
   - Parent cancels after payment
   - Teacher cancels
   - Refund processing

4. **Reschedule Flow:**
   - Student reschedules
   - Teacher requests reschedule → Student approves
   - Teacher requests reschedule → Student declines

5. **Dispute Flow:**
   - Raise dispute
   - Admin resolution

### Acceptance Criteria

- [ ] All major flows tested end-to-end
- [ ] Tests use real database
- [ ] Tests are isolated (cleanup)

---

## Issue #17: Add Comprehensive Documentation

**Labels:** `priority:medium`, `type:docs`, `phase:4`  
**Milestone:** Phase 4: Testing & Documentation  
**Estimated Time:** 2 days

### Description

Add comprehensive JSDoc comments, API documentation, and business rules documentation.

### Documentation to Create

1. **JSDoc for all public methods:**
   ```typescript
   /**
    * Creates a new booking request.
    * 
    * @param user - The authenticated user making the request
    * @param dto - Booking creation data
    * @returns The created booking with all relations
    * @throws BadRequestException if validation fails
    * @throws ForbiddenException if user lacks permission
    * 
    * @example
    * ```typescript
    * const booking = await bookingService.createRequest(user, {
    *   teacherId: '...',
    *   subjectId: '...',
    *   startTime: '2025-02-01T10:00:00Z',
    *   endTime: '2025-02-01T11:00:00Z',
    * });
    * ```
    */
   async createRequest(user: any, dto: CreateBookingDto) {
     // ...
   }
   ```

2. **State Machine Documentation:**
   - Visual state diagram
   - All valid transitions
   - Invalid transition examples
   - State descriptions

3. **API Documentation:**
   - OpenAPI/Swagger specs
   - Request/response examples
   - Error codes

4. **Business Rules Documentation:**
   - Cancellation policies
   - Reschedule rules
   - Payment rules
   - Dispute rules

### Acceptance Criteria

- [ ] All public methods documented
- [ ] State machine documented
- [ ] API docs generated
- [ ] Business rules documented

---

# Phase 5: Refactoring & Architecture (Week 8-10)

## Issue #18: Create Refactoring Plan

**Labels:** `priority:high`, `type:refactor`, `phase:5`  
**Milestone:** Phase 5: Refactoring & Architecture  
**Estimated Time:** 1 day

### Description

Plan the refactoring of the large booking.service.ts (3430 lines) into smaller, focused services.

### Steps to Fix

1. **Map current methods to new services:**
   - BookingCreationService
   - BookingPaymentService
   - BookingCancellationService
   - BookingRescheduleService
   - BookingCompletionService
   - BookingQueryService

2. **Identify shared dependencies:**
   - PrismaService
   - WalletService
   - NotificationService
   - PackageService
   - etc.

3. **Plan migration strategy:**
   - Extract services one at a time
   - Keep old service as facade initially
   - Gradually migrate controller calls
   - Remove old service when done

### Acceptance Criteria

- [ ] Refactoring plan documented
- [ ] Dependencies identified
- [ ] Migration strategy clear

---

## Issue #19: Extract BookingCreationService

**Labels:** `priority:high`, `type:refactor`, `phase:5`  
**Milestone:** Phase 5: Refactoring & Architecture  
**Estimated Time:** 3 days

### Description

Extract booking creation, approval, and rejection logic into a focused service.

### Methods to Extract

- `createRequest`
- `approveRequest`
- `rejectRequest`
- `validateSlotAvailability`

### Acceptance Criteria

- [ ] Service extracted
- [ ] Tests pass
- [ ] Controller updated
- [ ] No functionality broken

---

## Issue #20: Extract BookingPaymentService

**Labels:** `priority:high`, `type:refactor`, `phase:5`  
**Milestone:** Phase 5: Refactoring & Architecture  
**Estimated Time:** 2 days

### Description

Extract payment, escrow, and fund release logic into a focused service.

### Methods to Extract

- `payForBooking`
- `lockFundsForBooking`
- `releaseFundsOnCompletion`
- `settleCancellation`

### Acceptance Criteria

- [ ] Service extracted
- [ ] Tests pass
- [ ] Controller updated
- [ ] No functionality broken

---

## Issue #21: Extract BookingCancellationService

**Labels:** `priority:high`, `type:refactor`, `phase:5`  
**Milestone:** Phase 5: Refactoring & Architecture  
**Estimated Time:** 2 days

### Description

Extract cancellation logic into a focused service.

### Methods to Extract

- `cancelBooking`
- `getCancellationEstimate`
- `calculateRefund`
- `canUserCancel`

### Acceptance Criteria

- [ ] Service extracted
- [ ] Tests pass
- [ ] Controller updated
- [ ] No functionality broken

---

## Issue #22: Extract BookingRescheduleService

**Labels:** `priority:high`, `type:refactor`, `phase:5`  
**Milestone:** Phase 5: Refactoring & Architecture  
**Estimated Time:** 2 days

### Description

Extract rescheduling logic into a focused service.

### Methods to Extract

- `reschedulePackageSession`
- `requestReschedule`
- `approveRescheduleRequest`
- `declineRescheduleRequest`
- `adminReschedule`

### Acceptance Criteria

- [ ] Service extracted
- [ ] Tests pass
- [ ] Controller updated
- [ ] No functionality broken

---

## Issue #23: Extract BookingCompletionService

**Labels:** `priority:high`, `type:refactor`, `phase:5`  
**Milestone:** Phase 5: Refactoring & Architecture  
**Estimated Time:** 2 days

### Description

Extract session completion and dispute logic into a focused service.

### Methods to Extract

- `completeSession`
- `confirmSessionEarly`
- `markCompleted`
- `raiseDispute`

### Acceptance Criteria

- [ ] Service extracted
- [ ] Tests pass
- [ ] Controller updated
- [ ] No functionality broken

---

## Issue #24: Extract BookingQueryService

**Labels:** `priority:high`, `type:refactor`, `phase:5`  
**Milestone:** Phase 5: Refactoring & Architecture  
**Estimated Time:** 2 days

### Description

Extract all query/read operations into a focused service and optimize queries.

### Methods to Extract

- `getBookingById`
- `getTeacherRequests`
- `getTeacherSessions`
- `getAllTeacherBookings`
- `getParentBookings`
- `getStudentBookings`

### Acceptance Criteria

- [ ] Query service extracted
- [ ] Queries optimized
- [ ] Performance maintained or improved

---

## Issue #25: Remove Old BookingService

**Labels:** `priority:high`, `type:refactor`, `phase:5`  
**Milestone:** Phase 5: Refactoring & Architecture  
**Estimated Time:** 1 day

### Description

Remove the old large booking.service.ts file after all methods have been extracted.

### Steps to Fix

1. Verify all methods moved
2. Remove old service file
3. Update module
4. Update imports
5. Run full test suite

### Acceptance Criteria

- [ ] Old service removed
- [ ] All functionality working
- [ ] Codebase cleaner

---

# Phase 6: Performance & Optimization (Ongoing)

## Issue #26: Optimize Database Queries

**Labels:** `priority:medium`, `type:performance`, `phase:6`  
**Milestone:** Phase 6: Performance & Optimization  
**Estimated Time:** 3 days

### Description

Identify and fix N+1 queries, optimize slow queries, and add missing indexes.

### Steps to Fix

1. **Identify N+1 queries:**
   - Use Prisma query logging
   - Profile queries
   - Identify bottlenecks

2. **Optimize queries:**
   - Use `select` instead of `include` where possible
   - Combine related queries
   - Add missing indexes
   - Use database views for complex queries

3. **Add query monitoring:**
   - Log slow queries
   - Set up alerts
   - Monitor query performance

### Acceptance Criteria

- [ ] No N+1 queries
- [ ] Query performance improved
- [ ] Monitoring in place

---

## Issue #27: Implement Idempotency Keys for Financial Operations

**Labels:** `priority:high`, `type:security`, `phase:6`  
**Milestone:** Phase 6: Performance & Optimization  
**Estimated Time:** 2 days

### Description

Add idempotency keys to all financial operations to prevent duplicate processing.

### Steps to Fix

1. **Add idempotency key to financial operations:**
   ```typescript
   // Create idempotency table
   model idempotency_keys {
     id String @id
     operation String // 'PAYMENT_RELEASE', 'CANCELLATION_SETTLEMENT', etc.
     bookingId String
     key String @unique
     result Json?
     createdAt DateTime
   }
   ```

2. **Implement idempotency check:**
   ```typescript
   async releaseFundsWithIdempotency(
     bookingId: string,
     idempotencyKey: string,
     releaseFn: () => Promise<any>
   ) {
     // Check if already processed
     const existing = await this.prisma.idempotency_keys.findUnique({
       where: { key: idempotencyKey }
     });
     
     if (existing?.result) {
       return existing.result;
     }
     
     // Process and store result
     const result = await releaseFn();
     await this.prisma.idempotency_keys.create({
       data: {
         id: crypto.randomUUID(),
         key: idempotencyKey,
         operation: 'PAYMENT_RELEASE',
         bookingId,
         result,
       }
     });
     
     return result;
   }
   ```

3. **Add to all financial operations:**
   - Payment release
   - Cancellation settlement
   - Package release

### Acceptance Criteria

- [ ] Idempotency keys implemented
- [ ] All financial operations idempotent
- [ ] Tests verify idempotency

---

## Summary

**Total Issues:** 27  
**Estimated Total Time:** 8-10 weeks  
**Team Size:** 2-3 developers

### Issue Breakdown by Phase

- Phase 1: 4 issues (Critical fixes)
- Phase 2: 5 issues (Security & validation)
- Phase 3: 4 issues (Code quality)
- Phase 4: 4 issues (Testing & docs)
- Phase 5: 8 issues (Refactoring)
- Phase 6: 2 issues (Performance)

### Priority Breakdown

- Critical (P0): 3 issues
- High (P1): 15 issues
- Medium (P2): 7 issues
- Low (P3): 2 issues

---

## How to Create Issues in GitHub

### Option 1: Manual Creation
1. Go to your GitHub repository
2. Click "Issues" → "New Issue"
3. Copy the issue content from above
4. Add labels and assign to milestone
5. Create issue

### Option 2: GitHub CLI
```bash
# Install GitHub CLI if not installed
# brew install gh  # macOS
# apt install gh   # Linux

# Authenticate
gh auth login

# Create issue (example)
gh issue create \
  --title "Fix Incomplete Import Statement" \
  --body-file issue-1-body.md \
  --label "priority:critical,type:bug,phase:1" \
  --milestone "Phase 1: Critical Fixes"
```

### Option 3: GitHub API
Use the GitHub API to bulk create issues. See GitHub API documentation for details.

---

**Last Updated:** 2025-01-27  
**Status:** Ready for GitHub import
