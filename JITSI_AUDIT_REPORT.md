# Jitsi Video Meeting Implementation Audit Report

**Date:** January 14, 2026
**Platform:** staging.sidra.sd
**Auditor:** Claude Code

---

## Executive Summary

The Jitsi video meeting implementation is **functional and well-structured** with a solid foundation. However, this audit identifies **23 issues** across security, UX, reliability, and feature completeness categories that should be addressed before production deployment.

**Priority Breakdown:**
- 🔴 **Critical (P0):** 3 issues - ✅ **ALL FIXED**
- 🟠 **High (P1):** 7 issues
- 🟡 **Medium (P2):** 8 issues
- 🟢 **Low (P3):** 5 issues

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Critical Issues (P0)](#critical-issues-p0)
3. [High Priority Issues (P1)](#high-priority-issues-p1)
4. [Medium Priority Issues (P2)](#medium-priority-issues-p2)
5. [Low Priority Issues (P3)](#low-priority-issues-p3)
6. [Improvement Recommendations](#improvement-recommendations)
7. [Implementation Roadmap](#implementation-roadmap)

---

## Architecture Overview

### Current Implementation Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                        │
├─────────────────────────────────────────────────────────────────┤
│  /meeting/[bookingId]/page.tsx  ──────► JitsiMeetingRoom.tsx    │
│         │                                      │                 │
│         ▼                                      │                 │
│  useJitsiConfig.ts (fetch config)              │                 │
│         │                                      │                 │
│         ▼                                      ▼                 │
│  /admin/video-settings/page.tsx       @jitsi/react-sdk          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND (NestJS)                          │
├─────────────────────────────────────────────────────────────────┤
│  BookingController                                               │
│    ├── GET  /bookings/:id/jitsi-config                          │
│    └── PATCH /bookings/:id/toggle-jitsi                         │
│         │                                                        │
│         ▼                                                        │
│  JitsiService                                                    │
│    ├── generateJitsiToken() ─────► JWT (HS256)                  │
│    ├── getJitsiConfigForBooking()                               │
│    ├── canJoinMeeting()                                         │
│    └── toggleJitsiForBooking()                                  │
│         │                                                        │
│         ▼                                                        │
│  system_settings.jitsiConfig (JSON)                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     JITSI SERVER (Docker)                        │
├─────────────────────────────────────────────────────────────────┤
│  meet-staging.sidra.sd                                          │
│    ├── JWT Authentication (HS256)                               │
│    ├── Prosody XMPP Server                                      │
│    └── Jitsi Videobridge                                        │
└─────────────────────────────────────────────────────────────────┘
```

### Current Features

| Feature | Status | Notes |
|---------|--------|-------|
| JWT Authentication | ✅ Implemented | HS256 with session-bound expiry (P0-1 fixed) |
| Time-based Access Control | ✅ Implemented | 15 min before (configurable) |
| Role-based Permissions | ✅ Implemented | Teacher=moderator, Student=member |
| Admin Configuration UI | ✅ Implemented | Feature flags + toolbar config |
| External Link Toggle | ✅ Implemented | Teacher can switch per-booking |
| Session Completion | ✅ Implemented | Auto-triggers on meeting end |
| Missing Link Reminders | ✅ Implemented | 20-30 min before session |
| Rate Limiting | ✅ Implemented | Multiple endpoints protected |

---

## Critical Issues (P0) - ✅ ALL FIXED

### P0-1: JWT Token Expiry Too Long (Security Risk) - ✅ FIXED

**Location:** [jitsi.service.ts:112-191](apps/api/src/jitsi/jitsi.service.ts#L112-L191)

**Original Issue:** JWT tokens were generated with a 24-hour expiry by default.

**Fix Applied:**
- Token expiry is now **session-bound**: expires 30 minutes after session end time
- Added `nbf` (not before) claim to prevent token use before issue time
- Minimum 1-hour validity ensures tokens don't expire mid-session

```typescript
// P0-1 SECURITY FIX: Token expires 30 minutes after session end time
const SESSION_BUFFER_MINUTES = 30;
const sessionEndTimestamp = Math.floor(sessionEndTime.getTime() / 1000);
const exp = sessionEndTimestamp + (SESSION_BUFFER_MINUTES * 60);
```

**Status:** ✅ Fixed in [jitsi.service.ts](apps/api/src/jitsi/jitsi.service.ts)

---

### P0-2: No Token Invalidation on Booking Cancellation - ✅ FIXED

**Location:** [jitsi.service.ts](apps/api/src/jitsi/jitsi.service.ts) + [booking.service.ts](apps/api/src/booking/booking.service.ts)

**Original Issue:** No mechanism to invalidate previously issued JWT tokens when bookings are cancelled.

**Fix Applied:**
1. Added `jitsiTokenVersion` field to bookings table (default: 1)
2. Token version is included in room name: `sidra_booking_{id}_v{version}`
3. When booking is cancelled, version increments, changing the room name
4. Old tokens become useless as they point to non-existent rooms
5. Booking metadata included in JWT for audit trail

```typescript
// Room name now includes version - when cancelled, room changes
generateRoomName(bookingId: string, tokenVersion: number = 1): string {
  return `sidra_booking_${cleanId}_v${tokenVersion}`;
}

// On cancellation, increment version
jitsiTokenVersion: currentTokenVersion + 1,
```

**Status:** ✅ Fixed in:
- [jitsi.service.ts](apps/api/src/jitsi/jitsi.service.ts) - Room name generation
- [booking.service.ts](apps/api/src/booking/booking.service.ts) - Version increment on cancel
- [schema.prisma](packages/database/prisma/schema.prisma) - New field added
- Migration: `20260114120000_add_jitsi_token_version`

---

### P0-3: Missing CORS/Origin Validation for Meeting Page - ✅ ALREADY SECURE

**Location:** [main.ts](apps/api/src/main.ts#L45-L72)

**Original Concern:** Potential CORS misconfiguration allowing token extraction.

**Finding:** CORS is **already properly configured** with strict origin validation:

```typescript
// SECURITY: Restrict CORS to allowed origins from environment variable only
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');

app.enableCors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Allow server-to-server
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
});
```

**Status:** ✅ Already secure - No changes needed

---

## High Priority Issues (P1)

### P1-1: No Meeting Duration Tracking/Logging

**Issue:** There's no tracking of:
- Actual meeting start/end times
- Participant join/leave events
- Total meeting duration

**Impact:**
- Cannot verify if teacher/student actually met
- No proof for disputes
- No analytics for platform improvement

**Recommendation:**
Add a `meeting_events` table:
```prisma
model meeting_events {
  id          String   @id @default(uuid())
  bookingId   String
  userId      String
  eventType   String   // 'JOIN', 'LEAVE', 'MUTE', 'SCREEN_SHARE', etc.
  timestamp   DateTime @default(now())
  metadata    Json?

  bookings    bookings @relation(fields: [bookingId], references: [id])
}
```

Capture events via Jitsi webhooks or client-side reporting.

---

### P1-2: Missing Parent/Guardian Access for Child Sessions

**Location:** [jitsi.service.ts:200-209](apps/api/src/jitsi/jitsi.service.ts#L200-L209)

**Issue:** Current authorization check:
```typescript
const isTeacher = ...;
const isBooker = booking.bookedByUserId === userId;
const isStudent = booking.studentUserId === userId;

if (!isTeacher && !isBooker && !isStudent) {
  throw new UnauthorizedException('You do not have access to this booking');
}
```

**Problem:** Only the parent who booked can access. If another guardian (co-parent) needs to monitor:
- They cannot join to observe
- No read-only/observer mode

**Recommendation:**
1. Add optional `allowedObservers` field on bookings
2. Create "Observer" role with limited permissions (video/audio muted by default)
3. Allow parents to invite observers during booking creation

---

### P1-3: No Reconnection Handling

**Location:** [JitsiMeetingRoom.tsx](apps/web/src/components/jitsi/JitsiMeetingRoom.tsx)

**Issue:** If a user loses connection (network drop, browser refresh):
- No automatic reconnection logic
- User must manually navigate back to meeting
- May trigger `onMeetingEnd` falsely

**Current Code:**
```typescript
api.addEventListener('videoConferenceLeft', () => {
  console.log('User left the meeting');
  onMeetingEnd?.();  // ❌ Fires on disconnect too
});
```

**Recommendation:**
1. Distinguish between intentional leave and connection drop
2. Add reconnection prompt with countdown
3. Preserve meeting state in sessionStorage for recovery

---

### P1-4: Teacher Cannot Extend Session

**Issue:** Once a session's `endTime` passes:
- Meeting access is immediately blocked
- Teacher cannot extend if tutoring runs over
- No grace period for wrap-up

**Location:** [jitsi.service.ts:365-369](apps/api/src/jitsi/jitsi.service.ts#L365-L369)

**Recommendation:**
1. Add configurable `sessionOverrunMinutes` to system settings
2. Allow teacher to request extension (up to 15-30 min)
3. Alert student/parent of extension

---

### P1-5: No "End Meeting for All" Confirmation

**Location:** [page.tsx:57-77](apps/web/src/app/meeting/[bookingId]/page.tsx#L57-L77)

**Issue:** When teacher ends meeting:
- No confirmation dialog
- Student is immediately disconnected
- Session is auto-completed

**Current Code:**
```typescript
const handleMeetingEnded = async () => {
  if (config?.jitsiConfig?.userInfo?.role === 'teacher') {
    try {
      await bookingApi.completeSession(bookingId);  // ❌ No confirmation
```

**Recommendation:**
Add a confirmation modal: "End session for all participants? This will mark the lesson as complete."

---

### P1-6: Missing Error Boundaries and Fallbacks

**Location:** [JitsiMeetingRoom.tsx](apps/web/src/components/jitsi/JitsiMeetingRoom.tsx)

**Issue:** If Jitsi SDK fails to load (CDN down, network issues):
- Only basic error message shown
- No retry mechanism
- No fallback to external link

**Recommendation:**
1. Add React Error Boundary wrapper
2. Implement retry with exponential backoff
3. Offer fallback: "Jitsi unavailable. Teacher: please provide Google Meet/Zoom link"

---

### P1-7: No Meeting Join Notification

**Issue:** When a participant joins the meeting:
- Other party receives no notification
- Teacher doesn't know student is waiting if multitasking
- Student doesn't know if teacher is present

**Recommendation:**
1. Add browser notification permission request
2. Send push notification when first participant joins
3. Show "Waiting for [role]..." banner in meeting room

---

## Medium Priority Issues (P2)

### P2-1: Missing Meeting Link Reminder Logic for Jitsi

**Location:** [escrow-scheduler.service.ts:273-331](apps/api/src/booking/escrow-scheduler.service.ts#L273-L331)

**Issue:** The `checkMissingMeetingLinks` cron job only checks for missing `meetingLink`:
```typescript
OR: [{ meetingLink: null }, { meetingLink: '' }],
```

But doesn't consider Jitsi-enabled bookings. If `jitsiEnabled=true` and `useExternalMeetingLink=false`, no reminder is needed.

**Current Behavior:** Teachers may get false "missing meeting link" alerts for Jitsi sessions.

**Recommendation:**
Update query:
```typescript
where: {
  status: 'SCHEDULED',
  startTime: { gte: twentyMinutesFromNow, lte: thirtyMinutesFromNow },
  // Only alert if using external links OR jitsi is disabled
  OR: [
    { useExternalMeetingLink: true, meetingLink: null },
    { useExternalMeetingLink: true, meetingLink: '' },
    { jitsiEnabled: false, meetingLink: null },
  ],
},
```

---

### P2-2: No Mobile Responsiveness in Meeting UI

**Location:** [JitsiMeetingRoom.tsx:101](apps/web/src/components/jitsi/JitsiMeetingRoom.tsx#L101)

**Issue:** Meeting room uses fixed viewport sizing:
```typescript
<div ref={containerRef} className="h-screen w-screen">
```

While Jitsi SDK handles mobile internally, the surrounding UI (loading states, error states) may not be mobile-optimized.

**Recommendation:**
1. Test on various mobile devices
2. Add touch-friendly controls
3. Consider mobile-specific toolbar configuration

---

### P2-3: Inconsistent External Link Property Name

**Location:** Multiple files

**Issue:** Frontend uses `externalLink` but backend returns `externalMeetingLink`:

**Backend (jitsi.service.ts:215):**
```typescript
return {
  externalMeetingLink: booking.meetingLink || undefined,
```

**Frontend (page.tsx:157-161):**
```typescript
{config.externalLink  // ❌ Wrong property name
  ? 'This meeting uses an external link.'
```

**Impact:** External meeting links may not display correctly.

**Recommendation:** Align property names across frontend and backend.

---

### P2-4: No Waiting Room / Lobby Feature

**Issue:** Students can join before teacher:
- Awkward if student enters empty room
- No control over when participants can enter
- Privacy concerns if previous session overruns

**Recommendation:**
1. Enable Jitsi lobby via config: `prejoinConfig: { enabled: true }`
2. Consider teacher-activated "Open Room" button
3. Add "Teacher will let you in shortly" waiting screen

---

### P2-5: Recording Not Integrated with Platform

**Location:** Admin settings allow enabling recording, but:
- No storage integration (recordings go to Jitsi server only)
- No automatic upload to Sidra platform
- Parents cannot review recordings

**Recommendation:**
1. Configure Jitsi dropbox/S3 integration
2. Link recordings to booking records
3. Add "View Recording" option in booking history

---

### P2-6: No Bandwidth/Quality Adaptation UI

**Issue:** Users with poor connections have no visibility into:
- Current connection quality
- Ability to manually reduce quality
- Warning when connection degrades

**Recommendation:**
1. Add connection quality indicator
2. Allow manual quality override
3. Auto-detect and suggest lower quality for poor connections

---

### P2-7: Admin Settings Don't Include All Jitsi Options

**Location:** [video-settings/page.tsx](apps/web/src/app/admin/video-settings/page.tsx)

**Missing configurations:**
- `prejoinPageEnabled` toggle
- `requireDisplayName` enforcement
- `maxParticipants` limit (for group sessions later)
- `startSilent` option
- Recording auto-start option
- Transcription settings

**Recommendation:** Add additional admin toggles for key Jitsi features.

---

### P2-8: No Analytics/Metrics Collection

**Issue:** No tracking of:
- Meeting success/failure rates
- Average meeting duration
- Technical issues frequency
- Feature usage (chat, screen share, etc.)

**Recommendation:**
1. Integrate analytics (Mixpanel, Amplitude, or custom)
2. Track key events: join, leave, errors, feature usage
3. Create admin dashboard for meeting statistics

---

## Low Priority Issues (P3)

### P3-1: Hardcoded Arabic Strings

**Location:** Multiple files ([page.tsx:64](apps/web/src/app/meeting/[bookingId]/page.tsx#L64), [escrow-scheduler.service.ts:305](apps/api/src/booking/escrow-scheduler.service.ts#L305))

**Issue:** UI strings are hardcoded in Arabic:
```typescript
toast.success('تم إنهاء الحصة وتسجيلها بانتظار التأكيد');
```

**Recommendation:** Use i18n library for proper localization support.

---

### P3-2: Console.log Statements in Production Code

**Location:** [JitsiMeetingRoom.tsx](apps/web/src/components/jitsi/JitsiMeetingRoom.tsx), [jitsi.service.ts](apps/api/src/jitsi/jitsi.service.ts)

**Issue:** Debug logs remain in code:
```typescript
console.log('Jitsi API Ready', api);
console.log('User joined the meeting');
```

**Recommendation:** Replace with proper logging service or remove for production.

---

### P3-3: No Keyboard Shortcuts Documentation

**Issue:** Jitsi has built-in keyboard shortcuts, but:
- Users aren't informed about them
- No onboarding/tutorial
- Accessibility concerns

**Recommendation:** Add help tooltip or first-time tutorial.

---

### P3-4: Missing Test Coverage

**Issue:** No unit/integration tests found for:
- `JitsiService`
- `useJitsiConfig` hook
- Meeting page component

**Recommendation:** Add comprehensive test suite:
- JWT generation tests
- Authorization logic tests
- Frontend component tests

---

### P3-5: Environment Variable Documentation Incomplete

**Location:** `.env.example` files

**Issue:** Jitsi-related variables documented only in `STAGING_DEPLOYMENT_GUIDE.md`, not in example files.

**Recommendation:** Add to `.env.example`:
```bash
# Jitsi Video Meeting Configuration
JITSI_ENABLED=false
JITSI_APP_ID=your_app_id
JITSI_APP_SECRET=your_secret_here
JITSI_DOMAIN=meet.example.com
JITSI_XMPP_DOMAIN=meet.jitsi
```

---

## Improvement Recommendations

### Feature Enhancements

| Feature | Description | Effort |
|---------|-------------|--------|
| Breakout Rooms | For group sessions with small group activities | High |
| Whiteboard Integration | Built-in drawing/writing tools | Medium |
| File Sharing | Share PDFs/images during session | Medium |
| Session Notes | Collaborative notes visible to both parties | Low |
| Quick Reschedule | "Reschedule" button accessible from meeting room | Low |

### Technical Improvements

| Improvement | Description | Effort |
|-------------|-------------|--------|
| WebSocket Connection Status | Real-time connection monitoring | Medium |
| Offline Detection | Handle device going offline gracefully | Low |
| Pre-meeting Device Check | Camera/mic test before joining | Medium |
| Meeting Chat History | Save chat to booking record | Low |
| Audio-only Mode | Reduce bandwidth for poor connections | Low |

---

## Implementation Roadmap

### Phase 1: Critical Security Fixes (Week 1)

1. **P0-1:** Reduce JWT expiry to session-bound duration
2. **P0-2:** Implement token invalidation mechanism
3. **P0-3:** Audit and tighten CORS configuration

### Phase 2: Reliability Improvements (Week 2-3)

4. **P1-1:** Add meeting event logging table and tracking
5. **P1-3:** Implement reconnection handling
6. **P1-6:** Add error boundaries and retry logic

### Phase 3: UX Enhancements (Week 3-4)

7. **P1-5:** Add session end confirmation for teachers
8. **P1-7:** Implement join notifications
9. **P2-1:** Fix meeting link reminder logic
10. **P2-3:** Align property names

### Phase 4: Feature Completeness (Week 4-5)

11. **P1-2:** Add observer mode for parents
12. **P1-4:** Implement session extension
13. **P2-4:** Add waiting room feature
14. **P2-7:** Expand admin settings

### Phase 5: Polish & Analytics (Week 5-6)

15. **P2-8:** Implement analytics tracking
16. **P3-1:** Set up i18n
17. **P3-4:** Add test coverage
18. Remaining P3 items

---

## Appendix: Quick Reference

### Key Files

| File | Purpose |
|------|---------|
| `apps/api/src/jitsi/jitsi.service.ts` | JWT generation, meeting config |
| `apps/api/src/booking/booking.controller.ts` | API endpoints |
| `apps/web/src/app/meeting/[bookingId]/page.tsx` | Meeting entry point |
| `apps/web/src/components/jitsi/JitsiMeetingRoom.tsx` | Jitsi SDK wrapper |
| `apps/web/src/hooks/useJitsiConfig.ts` | Config fetch hook |
| `apps/web/src/app/admin/video-settings/page.tsx` | Admin settings UI |
| `apps/api/src/booking/escrow-scheduler.service.ts` | Reminders & alerts |

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/bookings/:id/jitsi-config` | GET | Fetch meeting configuration |
| `/bookings/:id/toggle-jitsi` | PATCH | Switch Jitsi/external |
| `/bookings/:id/complete-session` | PATCH | Mark session complete |
| `/admin/settings` | PATCH | Update Jitsi config |

### Database Fields (bookings table)

| Field | Type | Purpose |
|-------|------|---------|
| `jitsiRoomId` | String? | Unique room identifier |
| `jitsiEnabled` | Boolean | Feature flag per booking |
| `useExternalMeetingLink` | Boolean | Toggle meeting method |
| `meetingLink` | String? | External URL if applicable |

---

*End of Audit Report*
