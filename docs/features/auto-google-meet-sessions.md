# Feature Specification: Auto-Generated Google Meet Sessions

**Status:** Postponed to Phase 2
**Author:** Backend Lead
**Created:** 2026-01-10
**Last Updated:** 2026-01-10

---

> **Decision (2026-01-10):** This feature has been **postponed to Phase 2**.
>
> **Reason:** Requires Google Workspace subscription + operational overhead not justified pre-launch. Teachers will continue to manually add meeting links for MVP.
>
> **Revisit Trigger:** After launch, if manual meeting link errors exceed 5% of sessions or teacher feedback strongly requests automation.

---

## Executive Summary

Automatically generate Google Meet video conferencing links for every confirmed tutoring session, eliminating manual meeting link management and reducing missed sessions due to broken/missing links.

**Critical Note:** The core design proposes platform-owned meetings where teachers are participants, not hosts. This has implications for teacher control that are addressed in this spec.

---

## Table of Contents

1. [Feature Specification](#1-feature-specification)
2. [Technical Architecture](#2-technical-architecture)
3. [Data Model](#3-data-model)
4. [Permission & Role Analysis](#4-permission--role-analysis)
5. [UX & Product Decisions](#5-ux--product-decisions)
6. [Risk Analysis](#6-risk-analysis)
7. [Improvements & Alternatives](#7-improvements--alternatives)
8. [Final Opinion](#8-final-opinion)
9. [Implementation Checklist](#9-implementation-checklist)

---

## 1. Feature Specification

### Feature Goal

Automatically generate Google Meet video conferencing links for every confirmed tutoring session, eliminating manual meeting link management and reducing missed sessions due to broken/missing links.

### Business Context

**Current Problem:**
- Teachers manually add meeting links
- This causes errors, missed sessions, and inconsistent UX

**Goal:**
- Automatically generate a Google Meet link for every confirmed session
- Teachers should NOT manually add meeting URLs
- Simple, reliable, and MVP-friendly

### User Stories

#### Teacher
- As a teacher, I want a meeting link automatically created when a session is booked, so I don't have to manually create and share links
- As a teacher, I want to join my session with one click from my dashboard
- As a teacher, I want full teaching capabilities (screen share, whiteboard, mute students) during sessions
- As a teacher, I want to know immediately if there's a technical issue with the meeting link

#### Student
- As a student, I want to receive a meeting link automatically after booking confirmation
- As a student, I want to join my session with one click
- As a student, I want the meeting link to be available in my session details and email notifications

#### Admin
- As an admin, I want visibility into meeting creation success/failure rates
- As an admin, I want to manually regenerate a meeting link if creation fails
- As an admin, I want audit logs of all meeting-related events

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | System generates Google Meet link upon session confirmation (payment success) | P0 |
| FR-2 | Meeting link stored in session record and displayed in dashboard | P0 |
| FR-3 | Meeting link included in confirmation emails to both parties | P0 |
| FR-4 | Failed meeting creation triggers retry mechanism (max 3 attempts) | P0 |
| FR-5 | Admin can manually trigger link regeneration | P1 |
| FR-6 | Meeting links become active 10 minutes before session start | P1 |
| FR-7 | Calendar invites sent to teacher and student email addresses | P2 |

### Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1 | Meeting link generation latency | < 5 seconds |
| NFR-2 | Meeting creation success rate | > 99.5% |
| NFR-3 | System availability for join actions | 99.9% |
| NFR-4 | Support concurrent meeting creations | 100/minute |

### Out of Scope (Phase 1)

- Recording sessions
- In-app video (embedded Meet)
- Breakout rooms
- Custom virtual backgrounds
- Meeting analytics/duration tracking
- Zoom integration
- Teacher OAuth for personal calendar sync

---

## 2. Technical Architecture

### Core Design Decision

- The platform creates Google Calendar events using Google Calendar API
- Google Meet links are auto-generated using `conferenceData.createRequest`
- A single platform-owned Google account (Service Account with Workspace) is used
- The platform account is the **Meeting Organizer**
- Teachers and students join as participants (not hosts)

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BOOKING FLOW                                 │
└─────────────────────────────────────────────────────────────────────┘

Student Books Session
        │
        ▼
┌───────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│ Payment       │────▶│ Booking          │────▶│ MeetingService      │
│ Confirmed     │     │ Confirmed Event  │     │ .createMeetingLink()│
└───────────────┘     └──────────────────┘     └─────────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────────┐
                                               │ Google Calendar API │
                                               │ (Service Account)   │
                                               └─────────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────────┐
                                               │ Store meetingUrl    │
                                               │ in Session record   │
                                               └─────────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────────┐
                                               │ Send Notifications  │
                                               │ (Email + Dashboard) │
                                               └─────────────────────┘
```

### Backend Service Structure

```typescript
// apps/api/src/meeting/meeting.service.ts

@Injectable()
export class MeetingService {
  constructor(
    private readonly googleCalendarClient: GoogleCalendarClient,
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly retryService: RetryService,
  ) {}

  async createSessionMeeting(sessionId: string): Promise<MeetingResult> {
    // 1. Fetch session with teacher + student details
    // 2. Create Google Calendar event with conferenceData
    // 3. Store meeting URL and event ID
    // 4. Trigger notifications
    // 5. Handle failures with retry queue
  }

  async cancelSessionMeeting(sessionId: string): Promise<void> {
    // Delete calendar event, update session record
  }

  async regenerateMeetingLink(sessionId: string): Promise<MeetingResult> {
    // Admin action: cancel existing, create new
  }
}
```

### Google Calendar API Integration

```typescript
// apps/api/src/meeting/google-calendar.client.ts

interface CreateMeetingParams {
  sessionId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  teacherEmail: string;
  studentEmail: string;
  description?: string;
}

async createCalendarEventWithMeet(params: CreateMeetingParams): Promise<CalendarEvent> {
  const event = {
    summary: `Sidra Session: ${params.title}`,
    description: params.description,
    start: {
      dateTime: params.startTime.toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: params.endTime.toISOString(),
      timeZone: 'UTC',
    },
    attendees: [
      { email: params.teacherEmail },
      { email: params.studentEmail },
    ],
    conferenceData: {
      createRequest: {
        requestId: params.sessionId, // Idempotency key
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
    // CRITICAL: This setting matters for permissions
    guestsCanModify: false,
    guestsCanInviteOthers: false,
    guestsCanSeeOtherGuests: true,
  };

  return await calendar.events.insert({
    calendarId: 'primary', // Service account's calendar
    resource: event,
    conferenceDataVersion: 1,
    sendUpdates: 'all', // Send calendar invites
  });
}
```

### Authentication Approach

**Recommended: Google Workspace Service Account with Domain-Wide Delegation**

```typescript
// Configuration
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
  scopes: ['https://www.googleapis.com/auth/calendar'],
  // If using domain-wide delegation:
  // subject: 'meetings@sidra.com' // Impersonate this user
});
```

**Why Service Account over OAuth:**

| Factor | Service Account | Per-Teacher OAuth |
|--------|-----------------|-------------------|
| Onboarding friction | None | High (each teacher must authorize) |
| Token management | Single credential | Refresh tokens per teacher |
| Reliability | Consistent | Dependent on teacher's Google account |
| Meeting ownership | Platform owns | Teacher owns |
| Operational complexity | Low | High |

**Critical Requirement:** The service account must be part of a **Google Workspace organization** to create Google Meet links. A standalone service account CANNOT create Meet conferences.

### Error Handling & Retry Strategy

```typescript
// apps/api/src/meeting/meeting-retry.processor.ts

@Processor('meeting-creation')
export class MeetingRetryProcessor {
  @Process()
  async handleMeetingCreation(job: Job<MeetingCreationJob>) {
    const { sessionId, attempt } = job.data;

    try {
      await this.meetingService.createSessionMeeting(sessionId);
    } catch (error) {
      if (attempt < 3 && this.isRetryableError(error)) {
        // Exponential backoff: 30s, 2min, 8min
        throw error; // BullMQ will retry
      }

      // Max retries exceeded - alert admin
      await this.alertService.notifyMeetingCreationFailed(sessionId, error);
      await this.sessionService.markMeetingCreationFailed(sessionId);
    }
  }

  private isRetryableError(error: any): boolean {
    // Retry on rate limits, temporary failures
    return [429, 500, 503].includes(error.code);
  }
}
```

---

## 3. Data Model

### Schema Changes

```prisma
// packages/database/prisma/schema.prisma

model Session {
  id                    String         @id @default(cuid())
  // ... existing fields ...

  // New meeting fields
  meetingUrl            String?
  meetingEventId        String?        // Google Calendar event ID
  meetingStatus         MeetingStatus  @default(PENDING)
  meetingCreatedAt      DateTime?
  meetingError          String?        // Last error message if failed
  meetingRetryCount     Int            @default(0)

  // Audit
  meetingLastAttemptAt  DateTime?
}

enum MeetingStatus {
  PENDING           // Session confirmed, meeting not yet created
  CREATING          // API call in progress
  ACTIVE            // Meeting link ready
  FAILED            // Creation failed after retries
  CANCELLED         // Session cancelled, meeting deleted
}
```

### Session Meeting Lifecycle

```
PENDING ──────────────────────────────────────────┐
    │                                              │
    ▼                                              │
CREATING ─────┬──────────────────────────────────▶ FAILED
    │         │ (after 3 retries)                  │
    │         │                                    │
    ▼         │                                    │
ACTIVE ◀──────┘                                    │
    │         ▲                                    │
    │         │ (admin regenerate)                 │
    │         │                                    │
    ▼         └────────────────────────────────────┘
CANCELLED (on session cancellation)
```

---

## 4. Permission & Role Analysis

### Proposed Roles

- **Platform (Sidra):** Meeting Organizer
- **Teacher:** Participant
- **Student:** Participant
- **Admin:** Does not join meetings, manages sessions from dashboard

### Critical Issue: The Proposed Model Has a Flaw

**The proposal states teachers are "participants" but expects them to have host-like capabilities. This is problematic.**

### Google Meet Permission Reality

| Capability | Meeting Organizer | Participant |
|------------|-------------------|-------------|
| Start meeting before others | ✅ | ❌ (must wait for organizer) |
| End meeting for all | ✅ | ❌ |
| Mute all participants | ✅ | ❌ |
| Remove participants | ✅ | ❌ |
| Control who can share screen | ✅ | ❌ |
| Screen share | ✅ | ✅ (if allowed) |
| Speak | ✅ | ✅ |
| Use chat | ✅ | ✅ |
| Enable/disable recording | ✅ | ❌ |

### The Problem

**If the platform's service account is the organizer and never "joins" the meeting:**

1. **Teachers cannot start the meeting** - They must wait for the organizer to join first (in some Meet configurations)
2. **Teachers have limited moderation** - Cannot mute disruptive students, cannot remove bad actors
3. **Teachers feel like guests in their own classroom** - Bad UX for professionals

### Google Meet "Quick Access" Setting

Google Workspace has a setting called **"Quick Access"** that allows participants to join without the organizer present. **This is essential for your use case.**

However, even with Quick Access:
- Teachers still lack host controls
- If a student is disruptive, the teacher cannot remove them

### Mitigation Strategies

**Option A: Accept Limited Teacher Control (Simplest MVP)**
- Enable Quick Access so anyone can join
- Accept that teachers have participant-level controls
- Document limitations clearly to teachers
- Works for 90% of 1-on-1 tutoring cases (disruptive students rare)

**Option B: Make Teachers Co-Hosts via Workspace Settings**
- Configure Workspace to auto-promote certain attendees to co-hosts
- Requires custom Workspace admin configuration
- More complex setup

**Option C: Use Teacher OAuth for Meeting Ownership (More Complex)**
- Teacher connects their Google account once
- Platform creates events on teacher's calendar
- Teacher is the organizer, has full control
- Higher onboarding friction

### Recommendation for MVP

**Go with Option A** but with explicit acknowledgment:

```typescript
// Event creation with maximum guest permissions
const event = {
  // ...
  conferenceData: {
    createRequest: {
      requestId: sessionId,
      conferenceSolutionKey: { type: 'hangoutsMeet' },
    },
  },
  // Allow guests maximum control within participant limits
  guestsCanModify: false,
  guestsCanInviteOthers: false,
};
```

Ensure your Google Workspace admin configures:
- ✅ Quick Access enabled (participants can join without host)
- ✅ Screen sharing allowed for all participants
- ✅ Chat enabled

---

## 5. UX & Product Decisions

### When Meeting Link Becomes Visible

| Timing | Visible To | Display |
|--------|------------|---------|
| Immediately after booking confirmation | Teacher & Student | In dashboard session card |
| In confirmation email | Teacher & Student | Clickable link |
| 24 hours before session | Teacher & Student | Reminder email with link |
| 10 minutes before session | Teacher & Student | "Join Now" button becomes prominent |

### Join Action Presentation

**Dashboard Session Card:**

```
┌─────────────────────────────────────────────────────┐
│  📚 Math Tutoring - Algebra Basics                  │
│  👨‍🏫 John Smith (Teacher)                           │
│  📅 Jan 15, 2026 • 3:00 PM - 4:00 PM               │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  🟢 Meeting Ready                            │   │
│  │                                              │   │
│  │  [ 🎥 Join Session ]    [ 📋 Copy Link ]    │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**States:**

| State | Display | Action |
|-------|---------|--------|
| Meeting creating | "Setting up meeting..." | Disabled button |
| Meeting ready (>10min before) | "Meeting Ready" | "Join Session" button |
| Meeting ready (<10min before) | "Starting Soon!" | Prominent "Join Now" button |
| Meeting failed | "⚠️ Meeting setup failed" | "Contact Support" link + admin alert |
| Session cancelled | "Cancelled" | No join button |

### Handling Cancellations & Failures

**Session Cancellation Flow:**
```
Session Cancelled
       │
       ▼
┌──────────────────┐
│ Delete Calendar  │
│ Event via API    │
└──────────────────┘
       │
       ▼
┌──────────────────┐
│ Update Session   │
│ meetingStatus =  │
│ CANCELLED        │
└──────────────────┘
       │
       ▼
┌──────────────────┐
│ Send Cancel      │
│ Notifications    │
└──────────────────┘
```

**Meeting Creation Failure Handling:**

1. Automatic retry (3 attempts with exponential backoff)
2. If all retries fail:
   - Mark session with `meetingStatus: FAILED`
   - Alert admin via Slack/email
   - Show user: "We're setting up your meeting. If it's not ready 1 hour before your session, please contact support."
3. Admin can manually regenerate via dashboard

---

## 6. Risk Analysis

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Google API rate limiting | Medium | High | Implement rate limiting, queue-based creation |
| Service account credentials leaked | Low | Critical | Use secret management (Vault/KMS), rotate keys |
| Google API changes/deprecation | Low | High | Abstract Google client, monitor deprecation notices |
| Meeting creation fails silently | Medium | High | Robust error handling, admin alerts, retry mechanism |
| Service account loses Workspace access | Low | Critical | Monitoring, backup account, admin alerts |

### Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Google Workspace subscription lapses | Low | Critical | Payment monitoring, admin alerts |
| Service account email marked as spam | Low | Medium | Proper SPF/DKIM, monitor deliverability |
| Calendar event quota exceeded | Low | Medium | Monitor usage, request quota increase proactively |
| Timezone handling bugs | Medium | Medium | Always store/compute in UTC, test extensively |

### Privacy & Trust Concerns

| Concern | Analysis | Mitigation |
|---------|----------|------------|
| Platform can theoretically join any meeting | True - service account is organizer | Clear privacy policy, audit logs, never join |
| Teacher emails exposed to platform | Already known to platform | Standard data handling |
| Meeting data stored by Google | Yes, under Google's policies | Disclose in ToS, standard for Meet usage |
| Teachers feel lack of control | Valid concern | Document limitations, gather feedback for Phase 2 |

### Scalability Considerations

| Metric | Current Capacity | Scaling Strategy |
|--------|------------------|------------------|
| Calendar API quota | 1M queries/day (default) | Sufficient for MVP; request increase if needed |
| Concurrent event creation | ~10/second | Queue-based processing handles bursts |
| Storage (meeting URLs) | Negligible | Standard DB scaling |

---

## 7. Improvements & Alternatives

### Should Teachers Be Hosts?

**Arguments for Platform-Owned (Current Proposal):**
- ✅ Zero onboarding friction for teachers
- ✅ Consistent, predictable meeting creation
- ✅ Platform controls the experience
- ✅ No dependency on teacher's Google account status

**Arguments for Teacher-Owned (Alternative):**
- ✅ Teachers have full host controls
- ✅ Teachers can manage their own recordings
- ✅ More professional feel for teachers
- ❌ Requires OAuth flow for each teacher
- ❌ Token refresh failures cause session failures
- ❌ Teachers with non-Google email need workaround

**Recommendation:** Start with platform-owned for MVP. The 1-on-1 tutoring context means host controls are rarely needed. Track feedback and implement teacher OAuth in Phase 2 if teachers request more control.

### Alternative Video Platforms

| Platform | Pros | Cons |
|----------|------|------|
| **Google Meet** | Free with Workspace, familiar, reliable | Limited host delegation |
| **Zoom** | Better host controls, SDK available | Cost per host, more complex integration |
| **Daily.co** | Full API control, embedded option | Cost, less user familiarity |
| **Whereby** | Simple embed, good UX | Cost, less feature-rich |
| **Jitsi** | Free, self-hostable | Reliability concerns, less polished |

**Recommendation:** Google Meet is correct for MVP given:
- Cost efficiency (included with Workspace)
- User familiarity (most people know Meet)
- Adequate for 1-on-1 sessions
- Low integration complexity

Consider Zoom or Daily.co for Phase 2 if you need:
- Breakout rooms for group sessions
- Native recording with platform storage
- Embedded video experience

### MVP Plan Adjustments

**Recommended changes before production:**

1. **Add meeting status visibility in admin dashboard**
   - Critical for operations team to monitor failures

2. **Implement manual regeneration endpoint immediately**
   - Don't wait for failure to build this

3. **Add basic monitoring/alerting from day 1**
   - Alert on: >5% failure rate, any session without meeting link 2hr before start

4. **Create clear teacher documentation**
   - Explain what they can/cannot do as participants
   - Set expectations before first session

---

## 8. Final Opinion

### Is This a Solid MVP Plan?

**Yes, with caveats.** The core approach is sound:

✅ Platform-owned meetings eliminate onboarding friction
✅ Service account approach is reliable and manageable
✅ Google Meet is appropriate for 1-on-1 tutoring MVP
✅ The architecture is straightforward to implement

**However, the proposal glosses over a real limitation:**

⚠️ Teachers will NOT have host controls. The spec says teachers should "conduct the class without technical friction" but doesn't acknowledge they'll have limited moderation abilities. This needs to be:
1. Explicitly accepted as a tradeoff
2. Communicated clearly to teachers during onboarding
3. Monitored via feedback for Phase 2 prioritization

### What I Would Change Before Production

1. **Validate Google Workspace Quick Access settings** - Ensure participants can join without organizer present. Test this thoroughly.

2. **Add explicit meeting creation timeout handling** - What happens if Google API is slow? Don't block the booking confirmation flow.

3. **Implement idempotent meeting creation** - Use sessionId as requestId to prevent duplicate meetings on retries.

4. **Create runbook for common failures** - Document how ops team handles: failed meetings, duplicate links, teacher complaints.

5. **Add meeting status to existing session queries** - Don't require separate API calls to check if meeting is ready.

### Phase 2 Recommendations

| Priority | Feature | Rationale |
|----------|---------|-----------|
| P1 | Teacher OAuth option | For teachers who want host control |
| P1 | Meeting duration tracking | Analytics, billing verification |
| P2 | Embedded Meet experience | Better UX, keep users in platform |
| P2 | Session recording | High teacher demand expected |
| P3 | Zoom integration | For power users, group sessions |
| P3 | Breakout rooms | For group tutoring expansion |

### Bottom Line

**Ship it.** This design will work for 95% of 1-on-1 tutoring sessions. The limitations (teacher as participant) are acceptable for MVP if properly communicated. The architecture is clean, the failure modes are handleable, and the user experience will be dramatically better than manual link sharing.

**The one thing I'd push back on:** Don't promise teachers "full host capabilities" in marketing or onboarding. Be honest that they're joining as participants. Most won't care for 1-on-1 sessions, and honesty prevents support tickets later.

---

## 9. Implementation Checklist

### Pre-Development
- [ ] Provision Google Workspace service account
- [ ] Enable Calendar API in Google Cloud Console
- [ ] Configure domain-wide delegation (if needed)
- [ ] Verify Quick Access settings in Workspace Admin
- [ ] Test meeting creation manually with service account

### Backend Development
- [ ] Create MeetingService with Google Calendar client
- [ ] Add meeting fields to Session schema
- [ ] Implement meeting creation on booking confirmation
- [ ] Implement retry mechanism with BullMQ
- [ ] Add cancellation flow
- [ ] Create admin regeneration endpoint
- [ ] Add meeting status to session API responses

### Frontend Development
- [ ] Add meeting status display to session cards
- [ ] Implement "Join Session" button with state handling
- [ ] Add "Copy Link" functionality
- [ ] Show appropriate loading/error states
- [ ] Admin dashboard: meeting status column, regenerate action

### Notifications
- [ ] Include meeting link in booking confirmation email
- [ ] Add meeting link to session reminder emails
- [ ] Alert admin on meeting creation failures

### Testing
- [ ] Unit tests for MeetingService
- [ ] Integration tests with Google Calendar API (use test calendar)
- [ ] E2E test: booking → meeting created → link accessible
- [ ] Test failure scenarios and retry behavior
- [ ] Test cancellation flow

### Monitoring
- [ ] Log all meeting creation attempts
- [ ] Alert on failure rate > 5%
- [ ] Dashboard for meeting creation success/failure metrics

---

*This specification is ready for engineering handoff. Questions or clarifications should be directed to the Product and Backend leads.*
