## Teacher Availability & Calendar Module Audit

**Audit Date:** 2026-01-14

### 1. Scope and Objectives

- **Scope**: Teacher weekly availability, exceptions (time off), and how these are exposed to:
  - Teacher UI (`/teacher/availability`, profile hub availability section)
  - Marketplace availability (calendar and time slots)
  - Booking creation (single sessions and recurring / packages)
- **Goal**: Ensure the system is **reliable**, **timezone-safe**, and **easy to manage** for teachers and students, and to provide a clear technical reference for future work.

---

### 2. Current Architecture (High-Level)

#### 2.1 Data Model (Prisma)

- **`availability`**
  - Fields: `id`, `teacherId`, `dayOfWeek` (`DayOfWeek` enum), `startTime` (`HH:mm`), `endTime` (`HH:mm`), `isRecurring` (Boolean, default `true`).
  - Represents **weekly recurring working windows** per teacher and weekday.
  - Stored as **time strings without timezone**; the effective timezone comes from the teacher profile.

- **`availability_exceptions`**
  - Fields: `id`, `teacherId`, `startDate` (`DateTime`), `endDate` (`DateTime`), `type` (`ExceptionType`, `ALL_DAY` / `PARTIAL_DAY`), `startTime?`, `endTime?`, `reason?`, timestamps.
  - Represents **time off / overrides**, with either:
    - `ALL_DAY`: block entire days in a date range.
    - `PARTIAL_DAY`: block specific time ranges on specific dates.

- **`teacher_profiles`**
  - Holds `timezone` (IANA string) used to interpret `availability.startTime` / `endTime` and exceptions.

#### 2.2 Backend Modules

- **Teacher Availability APIs (`TeacherController`, `TeacherService`)**
  - `POST /teacher/me/availability` → `TeacherService.setAvailability`
  - `POST /teacher/me/availability/bulk` → `TeacherService.replaceAvailability`
  - `DELETE /teacher/me/availability/:id` → `TeacherService.removeAvailability`
  - `GET /teacher/me/exceptions` → `TeacherService.getExceptions`
  - `POST /teacher/me/exceptions` → `TeacherService.addException`
  - `DELETE /teacher/me/exceptions/:id` → `TeacherService.removeException`
  - `TeacherService.isSlotAvailable(teacherId, startTime)`:
    - Used by `BookingService.createRequest` to validate a requested **start time** against weekly rules and exceptions.

- **Marketplace Availability APIs (`MarketplaceController`, `MarketplaceService`)**
  - `GET /marketplace/teachers/:teacherId/available-slots`
    - `MarketplaceService.getAvailableSlots(teacherId, dateStr, userTimezone?)`
    - Generates concrete slots from weekly availability + exceptions + bookings, **UTC-first**.
  - `GET /marketplace/teachers/:teacherId/availability-calendar`
    - `MarketplaceService.getAvailabilityCalendar(idOrSlug, month)`
    - Marks **available** vs **fully booked** dates for the month.
  - `GET /marketplace/teachers/:teacherId/next-available`
    - Next available slot summary, built on top of the same availability model.

- **Booking Creation (`BookingService`)**
  - `BookingService.createRequest(user, dto: CreateBookingDto)`:
    - Verifies teacher teaches subject, vacation mode, role, etc.
    - Calls `TeacherService.isSlotAvailable(teacherId, startTime)` to validate **availability**.
    - Separately checks for **booking conflicts** on the same teacher.

- **Timezone Utilities (`timezone.util.ts`)**
  - `buildUtcWindowForUserDate(dateStr, userTimezone)`
  - `getTeacherDatesInUtcWindow(utcWindow, teacherTimezone)`
  - `parseTimeInTimezoneToUTC`, `formatInTimezone`, `expandToHalfHourSlots`
  - Core of the **UTC-first** approach used by `MarketplaceService.getAvailableSlots`.

#### 2.3 Frontend (Teacher UI)

- **`/teacher/availability` page**
  - Components:
    - `TeacherAvailabilityPage`:
      - Loads teacher profile + `availability` and `availability_exceptions`.
      - Detects browser timezone and shows mismatch warning vs profile timezone, with a one-click update.
      - Delegates schedule editing to `AvailabilityGrid`.
      - Delegates exceptions management to `ExceptionsPanel` and `ExceptionFormModal`.
    - `AvailabilityGrid`:
      - 7×48 grid of 30-minute slots (00:00–23:30).
      - Supports click-and-drag painting, rectangle selection, copy/paste day, presets (morning/afternoon/evening/full).
      - Internally builds a 7×48 boolean matrix, then converts contiguous `true` ranges per day into `AvailabilitySlot` ranges (`dayOfWeek`, `startTime`, `endTime`, `isRecurring=true`) on save.
      - Calls `teacherApi.setBulkAvailability(slots)`, which invokes `TeacherService.replaceAvailability`.
    - `ExceptionFormModal`:
      - Creates `ALL_DAY` or `PARTIAL_DAY` exceptions across a single day or date range.
      - For `PARTIAL_DAY`, supports **multiple time ranges** per day via `timeSlots` array.
      - The page then issues multiple `POST /teacher/me/exceptions` calls (one per time slot) when partial.

#### 2.4 Frontend (Student/Parent Booking UI)

- **Booking Step 3 – Schedule (`Step3Schedule`)**
  - For single sessions:
    - Fetches monthly **availability calendar** via `marketplaceApi.getAvailabilityCalendar`.
    - For a selected date, calls `GET /marketplace/teachers/:teacherId/available-slots?date=YYYY-MM-DD&userTimezone=...`.
    - Renders slots returned from the API (`SlotWithTimezone` with `startTimeUtc`, label, and user-date).
  - For new package purchases:
    - Uses `WeeklyAvailabilityGrid` (booking-side) to select recurring weekly patterns, based on the public teacher profile’s `availability` array.
    - Recurring patterns are checked through package APIs which rely on marketplace availability logic.

---

### 3. Detailed Flow: From Teacher Availability to Bookable Slots

#### 3.1 Teacher Sets Weekly Availability

1. Teacher navigates to `/teacher/availability`.
2. `TeacherAvailabilityPage` loads:
   - `teacherApi.getProfile()` → includes `availability` (raw weekly rules).
   - `teacherApi.getExceptions()` → list of `availability_exceptions`.
3. Grid initialization:
   - Each slot in `availability` is mapped into half-hour indices and marks `gridState[dayIndex][slotIndex] = true` for all slots between `startTime` and `endTime`.
4. Teacher paints changes on the grid.
5. On save:
   - `AvailabilityGrid` compresses contiguous `true` cells into `AvailabilitySlot` ranges per day.
   - Calls `onSave(slots)` → `teacherApi.setBulkAvailability(slots)` → `TeacherService.replaceAvailability`:
     - Deletes **all** existing availability rows for the teacher.
     - Inserts all new slots in bulk **without per-slot validation** (no overlap, min/max duration checks).

#### 3.2 Teacher Sets Exceptions (Time Off)

1. Teacher opens `ExceptionFormModal` from the exceptions section.
2. Chooses:
   - Single day vs date range.
   - `ALL_DAY` vs `PARTIAL_DAY`.
   - Optional `reason`.
3. For `ALL_DAY`:
   - Frontend sends a single `POST /teacher/me/exceptions` with `startDate`, `endDate`, type=`ALL_DAY`.
4. For `PARTIAL_DAY`:
   - Frontend sends one `POST /teacher/me/exceptions` **per time slot**, all sharing the same `startDate`/`endDate`.
5. Backend (`TeacherService.addException`):
   - Validates date order, not in the past, max duration 1 year.
   - For `PARTIAL_DAY`, validates each time pair (format + end > start).
   - Creates one `availability_exceptions` row per call.

#### 3.3 Student Views Calendar & Slots (Marketplace)

##### 3.3.1 Monthly Availability Calendar

- Endpoint: `GET /marketplace/teachers/:teacherId/availability-calendar?month=YYYY-MM`
- Service: `MarketplaceService.getAvailabilityCalendar(idOrSlug, month)`:
  - Load teacher profile by ID or slug, include `availability`.
  - Load all bookings for that month (relevant statuses).
  - For each day in the month:
    - Check if teacher has any weekly availability on that weekday.
    - Derive if any slots remain free, considering bookings.
    - Mark date as:
      - **available**: some free slot exists (per current logic).
      - **fullyBooked**: teacher has weekly availability but no free slot remains.
  - **Note**: current implementation does **not** use `availability_exceptions` for this calendar; exceptions are only applied later in the daily slot generation.

##### 3.3.2 Daily Available Slots

- Endpoint: `GET /marketplace/teachers/:teacherId/available-slots?date=YYYY-MM-DD&userTimezone=...`
- Service: `MarketplaceService.getAvailableSlots(teacherId, dateStr, userTimezone)`:
  1. **Resolve timezones**
     - Get teacher’s timezone (`teacher_profiles.timezone`, fallback `'UTC'`).
     - Determine effective user timezone (query param or teacher’s timezone).
  2. **Build UTC window for the user’s selected day**
     - `buildUtcWindowForUserDate(dateStr, effectiveUserTimezone)` → `{ start, end }` in UTC that correspond to the user’s chosen local date.
  3. **Determine teacher-local dates overlapping this UTC window**
     - `getTeacherDatesInUtcWindow(utcWindow, teacherTimezone)` → list of `YYYY-MM-DD` dates in teacher’s timezone whose local time overlaps the user’s day.
  4. **Generate candidate slots from weekly rules**
     - For each teacher-local date:
       - Find the day-of-week value.
       - Load all `availability` rows for that `teacherId` and `dayOfWeek`.
       - For each availability window:
         - Expand into 30-minute slots via `expandToHourlySlots(startTime, endTime)`.
         - Convert each slot (`teacherDate + timeStr` in teacher timezone) to UTC using `parseTimeInTimezoneToUTC`.
         - Keep only those where this UTC time lies inside the user UTC window.
  5. **Filter out exceptions**
     - `filterExceptions(slots, teacherId, utcWindow, teacherTimezone)`:
       - Loads all `availability_exceptions` for teacher that overlap the UTC window.
       - For each slot:
         - `ALL_DAY`: if slot’s `startTimeUtc` lies between `startDate` and `endDate`, drop the slot.
         - `PARTIAL_DAY`: convert exception’s `startTime` / `endTime` on the exception date to UTC and drop slots inside that range.
       - **Important**: currently uses **only the `startDate`’s date** when building partial-day UTC window; multi-day partial exceptions are only correctly respected on the first day.
  6. **Filter out bookings**
     - `filterBookings(slots, teacherId, utcWindow)`:
       - Loads bookings in `[utcWindow.start, utcWindow.end]` for relevant statuses.
       - Drops any slot where `slotTime` falls within `[booking.startTime, booking.endTime)`.
  7. **Remove past slots and sort**
     - Filter out any slot with `startTimeUtc <= now`.
     - Sort by time and return `slots[]` plus metadata (`teacherTimezone`, `userTimezone`).

#### 3.4 Booking Creation Validation

- In `BookingService.createRequest`:
  - Validates not in the past, role checks, teacher-subject match, vacation mode, self-booking, etc.
  - **Availability check**:
    - Calls `TeacherService.isSlotAvailable(teacherId, startTime)`:
      - Converts `startTime` into teacher’s local day/time string via `formatInTimezone`.
      - Confirms there is a weekly `availability` row whose `dayOfWeek` matches and `startTime <= time < endTime`.
      - Checks for `ALL_DAY` / `PARTIAL_DAY` exceptions blocking that specific instant.
      - Returns `true` or `false`.
  - **Conflict with existing bookings**:
    - Ensures no booking exists with:
      - `teacherId` same,
      - `startTime <= dto.startTime < endTime`,
      - status in `['SCHEDULED', 'PENDING_TEACHER_APPROVAL', 'WAITING_FOR_PAYMENT']`.
  - **Limitations**:
    - Does **not** ensure the **full session duration** fits inside the teacher’s availability window or is not overlapping a partial exception; it only validates the **start instant**.

---

### 4. Identified Issues and Risks

#### 4.1 Duration vs Availability Window (Major Reliability Risk)

- **Problem**:
  - `TeacherService.isSlotAvailable` only checks whether the **start time** falls inside a weekly availability slot and outside exceptions.
  - `BookingService.createRequest` does not validate that `dto.endTime` remains within the same availability window and not inside a partial exception.
- **Impact**:
  - A booking can start near the end of a teacher’s availability window and extend **beyond** it (e.g., availability 10:00–11:00; booking 10:45–11:45).
  - Similarly, it can cross into a blocked period created by a partial-day exception, as long as the start instant is outside the exception.
- **Risk Level**: High – broken expectations for teachers, potential double-booking vs personal schedule, difficult to debug.

#### 4.2 Bulk Availability Writes Bypass Validation

- `TeacherService.setAvailability` includes:
  - Time format checks (`HH:mm`), end after start, min duration (15 min), max duration (12 hours).
  - Overlap detection with existing slots on the same day.
- `TeacherService.replaceAvailability`:
  - Deletes all availability for the teacher and recreates **all** slots via `createMany`.
  - **No validation**:
    - No overlap checks.
    - No min/max duration enforcement.
    - No time format validation (relies on DTO).
  - Frontend `AvailabilityGrid` normally generates valid, non-overlapping ranges, but:
    - Any future frontend bug or new client could send overlapping or extremely long ranges.
    - Using `endTime = '23:59'` to mean “end-of-day” could create off-by-one and time math ambiguity.
- **Risk Level**: Medium–High – data integrity issues and surprising calendar behaviour, especially if other tools/scripts write availability.

#### 4.3 Exceptions Handling Gaps (Especially Multi-Day PARTIAL_DAY)

- In `MarketplaceService.filterExceptions`:
  - For `ALL_DAY`, logic is correct: block slots within `[startDate, endDate]`.
  - For `PARTIAL_DAY`:
    - Uses `exception.startDate`’s date (`format(exception.startDate, 'yyyy-MM-dd')`) to build a local date for `startTime`/`endTime`.
    - Converts those to UTC using `parseTimeInTimezoneToUTC`.
    - Only compares slots against this **single-day** time range.
  - If an exception has:
    - `startDate = 2025-01-01`
    - `endDate = 2025-01-03`
    - type `PARTIAL_DAY` and times 10:00–12:00
    - The current logic will only reliably block 10:00–12:00 **on the first day**; subsequent days may not be correctly blocked.
- `getAvailabilityCalendar`:
  - Ignores `availability_exceptions` entirely when marking `availableDates` vs `fullyBookedDates`.
  - Dates may be shown as “available” on the calendar but end up with **zero slots** when fetching `available-slots` due to exceptions.
- **Risk Level**: Medium – confusing UX (calendar says available, but no times), and partial-time blocks spanning multiple days may be enforced inconsistently.

#### 4.4 Timezone Change and DST (Structural Risk)

- Availability is modeled as `HH:mm` strings per weekday with an associated profile timezone.
- When a teacher:
  - Changes timezone (e.g., moves from Africa/Khartoum to Europe/Berlin), or
  - Experiences a DST shift in a region that uses daylight saving,
  - Stored availability slots **do not change**, but their actual UTC mapping changes.
- System behaviour:
  - `getAvailableSlots` converts rule times to UTC on-the-fly using the **current** timezone.
  - `isSlotAvailable` also uses the current timezone.
- **Missing pieces**:
  - No migration or re-materialization step for availability when timezone changes.
  - Existing bookings retain their UTC times, but teacher’s view of “what 10:00 means” shifts.
- **Risk Level**: Medium – especially if platform expands to DST-using regions; currently somewhat mitigated by defaulting to `Africa/Khartoum` and manual timezone update warnings.

#### 4.5 Rigid Granularity and Lack of Teacher-Level Controls

- All generation uses **30-minute increments**, baked into:
  - `expandToHourlySlots` (despite the name, it’s 30-min slots).
  - Frontend `AvailabilityGrid`'s boolean grid.
- Missing concepts:
  - Per-teacher slot interval (15/30/60 mins).
  - Per-teacher or per-subject **prep/cleanup buffer** around sessions.
  - Per-teacher **minimum notice window** (only partially handled via 48h checks in some recurring logic).
- **Risk Level**: Low–Medium – limits flexibility and UX, but not immediately breaking.

#### 4.6 Multiple Partial Exceptions on Same Date

- Frontend can create **multiple** `PARTIAL_DAY` exceptions for the same date via multiple submitted `timeSlots`.
- Backend does not:
  - Normalize or merge overlapping partial exceptions.
  - Reject overlapping partial exceptions.
- Filtering logic will still block correctly (any matching exception blocks a slot), but:
  - Data becomes noisy and harder to reason about.
  - Future “exception editing” UX is more complex.
- **Risk Level**: Low–Medium – correctness is mostly intact, but data hygiene suffers.

#### 4.7 Performance and Race Conditions

- Availability is computed on demand from rules + exceptions + bookings:
  - For each `available-slots` request, the system re-derives all candidate slots, then subtracts exceptions and bookings.
  - `BookingService.createRequest` independently checks:
    - `isSlotAvailable` and
    - bookings overlap
    - outside the context of the marketplace `available-slots` check.
- Missing atomicity:
  - No **single** authoritative “free slot” record that is locked when booking is created.
  - Under heavy concurrency, there is a theoretical race where two requests pass validation based on old data and both create bookings (though current checks mitigate most obvious conflicts).
- **Risk Level**: Medium – acceptable for low volume, but fragile at scale.

---

### 5. Recommended Improvements

This section separates **quick, contained fixes** from a **longer-term redesign** suitable for scale.

#### 5.1 Quick Wins (Recommended Next Work)

1. **Validate Booking Duration Against Availability & Exceptions**
   - Add a new helper, e.g. `TeacherService.isRangeAvailable(teacherId, startTime: Date, endTime: Date): Promise<boolean>`, that:
     - Converts both `startTime` and `endTime` to teacher-local date/time.
     - Ensures the entire range lies within at least one availability block on that day.
     - Ensures no `availability_exceptions` (ALL_DAY or PARTIAL_DAY) cover any part of `[startTime, endTime)`.
   - Update `BookingService.createRequest` to use this helper instead of `isSlotAvailable` (or in addition) and reject bookings that overflow availability.

2. **Add Validation to `replaceAvailability` (Bulk API)**
   - For each incoming slot:
     - Validate `startTime` / `endTime` format (`HH:mm`), end > start, min duration (15 min), max duration (12 h).
   - Validate across slots (per day):
     - Detect and reject overlapping or duplicate ranges.
   - Optionally, normalize:
     - If `endTime === '23:59'`, convert to `'24:00'` conceptually, but clamp to last half-hour slot in generation to avoid off-by-one confusion.

3. **Fix Multi-Day Partial Exceptions**
   - In `filterExceptions`, for each `PARTIAL_DAY` exception spanning multiple days:
     - Iterate across each date from `startDate` to `endDate` (teacher-local).
     - For each date, build `startTime` / `endTime` UTC range using `parseTimeInTimezoneToUTC` and block slots within it.
   - Alternatively, constrain UI to single-day partial exceptions and enforce that in backend; for multi-day all-day blocks, require `ALL_DAY`.

4. **Make `getAvailabilityCalendar` Exception-Aware**
   - When computing `availableDates` and `fullyBookedDates`:
     - Consider both weekly availability and `availability_exceptions` for that date.
     - If all potential slots on a weekday are blocked by exceptions → mark as `fullyBooked` (or even “off”).
     - If weekly availability exists but exceptions greatly reduce free slots, still mark as available but rely on `available-slots` for precision.

5. **Timezone Change Guardrail**
   - When teacher updates `timezone`:
     - Show a clear message: “Changing timezone may shift how your availability appears to students. Please review your availability after changing timezone.”
     - Optionally: mark a `needsAvailabilityReview` flag on profile used to show a banner until availability is re-saved.

6. **Data Hygiene for Exceptions**
   - In `addException`, optionally:
     - Reject clearly overlapping partial exceptions for the same teacher/date/time range.
     - Or accept but **merge** them into normalized ranges (requires some extra logic).

#### 5.2 Longer-Term Redesign (Materialized Slots)

For maximum reliability and scalability, move from “rules only” to a **materialized slots** architecture, while keeping the current rule UX.

**Core Idea**: Weekly rules + exceptions are the *configuration*, but the authoritative bookable truth is a `teacher_available_slots` table generated for a rolling horizon.

- **New Table: `teacher_available_slots`**
  - Columns:
    - `id`
    - `teacherId`
    - `startTimeUtc` (`DateTime`, primary key with `teacherId`)
    - `endTimeUtc` (`DateTime`)
    - `source` (`RULE`, `EXCEPTION`, `MANUAL_ADJUSTMENT`, etc.)
    - `createdAt`, `updatedAt`
  - Semantics: each row is a **single free slot** at a specific UTC time.

- **Generation / Maintenance**
  - On any change to:
    - Weekly availability rules.
    - Exceptions.
    - Teacher timezone.
  - Enqueue a job that:
    - Regenerates slots for a configurable horizon (e.g. next 60–90 days).
    - Applies weekly rules per teacher-local day, converts to UTC, and subtracts exceptions and existing bookings to build the base materialized set.
  - Periodic job extends the horizon daily (e.g. always keep next 90 days generated).

- **Read Path (Students)**
  - `available-slots`:
    - Reads from `teacher_available_slots` constrained to the UTC window corresponding to the user’s selected date and timezone.
  - `availability-calendar`:
    - Aggregates from `teacher_available_slots`:
      - Dates with `COUNT(*) > 0` → `availableDates`.
      - Dates with zero slots but teacher has weekly rules → `fullyBookedDates`.

- **Booking Creation**
  - In a single DB transaction:
    - Lock / select the relevant `teacher_available_slots` rows for the requested time.
    - Verify they are still free.
    - Insert booking.
    - Delete or mark consumed the corresponding `teacher_available_slots`.
  - Guarantees:
    - No race conditions between “available” and “booked”.
    - Duration is always checked because slots cover explicit time ranges.

- **Benefits**
  - Stronger consistency under load.
  - Fast read operations (pure index lookups).
  - Clean separation of concerns:
    - Teachers configure weekly rules and exceptions.
    - System owns the materialization and booking concurrency.

---

### 6. Developer Notes and Next Steps

#### 6.1 Suggested Implementation Order

1. **Quick Wins (P0)**
   - Implement `isRangeAvailable` and wire it into `BookingService.createRequest`.
   - Add validation to `replaceAvailability`.
   - Fix `PARTIAL_DAY` exception handling for multi-day ranges, or enforce single-day constraints.
   - Make `getAvailabilityCalendar` exception-aware enough to avoid “green but empty” days.

2. **Hardening & Observability (P1)**
   - Log cases where `getAvailabilityCalendar` shows available dates but `available-slots` returns zero slots for those days.
   - Add tests:
     - Timezone regression tests (teacher vs student in different timezones).
     - Exception-based blocking (all-day and partial-day) across month boundaries.
     - Duration overflow scenarios.

3. **Materialized Slots (P2)**
   - Design and migrate the `teacher_available_slots` table.
   - Build a one-off generator and nightly job.
   - Gradually switch:
     - First: `availability-calendar` and `available-slots` to read from materialized data.
     - Then: booking to lock on materialized slots.

#### 6.2 Testing Checklist for Changes

- **Unit / Integration**
  - Booking cannot:
    - Start in a free slot and end after availability end.
    - Start before a partial exception and overlap into it.
  - Bulk availability rejects overlapping or malformed ranges.
  - Exceptions:
    - Single-day partial and all-day exceptions.
    - Multi-day ranges block as expected.
  - Availability calendar + available slots are consistent (no “available but empty” days).

- **Manual QA Scenarios**
  - Teacher in timezone A, student in timezone B, including crossings over midnight.
  - Teacher with vacation/exceptions that remove all availability for a week.
  - Teacher changes timezone; verify warning and behaviour.

---

### 7. Summary

- The current system has a strong **UTC-first** foundation and a good conceptual model (weekly rules + exceptions).
- However, there are **critical correctness gaps** (duration vs availability, exceptions consistency, unchecked bulk writes) and **structural limits** (no materialized slots, limited teacher controls).
- This document should serve as the reference for:
  - Implementing immediate reliability fixes.
  - Designing and rolling out a more robust, materialized-slot architecture that scales with usage and complexity.

