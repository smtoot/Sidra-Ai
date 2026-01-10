# Feature Specification: Add Session to Calendar

**Status:** Draft
**Author:** Antigravity (AI Assistant)
**Created:** 2026-01-10
**Last Updated:** 2026-01-10

---

## Executive Summary

Implement an "Add to Calendar" feature on the Booking Details page for confirmed sessions. This allows Students, Parents, and Teachers to easily export session details to their personal calendars (Google, Outlook, Yahoo, Apple), reducing the likelihood of missed sessions (no-shows) and improving user experience.

---

## Table of Contents

1. [Feature Specification](#1-feature-specification)
2. [Technical Architecture](#2-technical-architecture)
3. [UX & Product Decisions](#3-ux--product-decisions)
4. [Implementation Checklist](#4-implementation-checklist)

---

## 1. Feature Specification

### Feature Goal

Provide a seamless way for users to add scheduled sessions to their preferred external calendar application, ensuring they receive their own native reminders and have easy access to the meeting link.

### User Stories

#### Student / Parent
- As a student or parent, I want to add my confirmed tutoring session to my Google Calendar (or Outlook/Apple Calendar) with one click.
- I want the calendar event to automatically include the meeting link and subject name so I don't have to copy-paste them.

#### Teacher
- As a teacher, I want to add sessions to my personal calendar to avoid conflicts and ensure I'm on time.

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Display "Add to Calendar" option for all sessions with `SCHEDULED` status. | P0 |
| FR-2 | Support Google Calendar (Web Link). | P0 |
| FR-3 | Support Outlook Calendar (Web Link). | P0 |
| FR-4 | Support ICS file download (Apple Calendar, Desktop Outlook). | P0 |
| FR-5 | Support Yahoo Calendar (Web Link). | P2 |
| FR-6 | Calendar event must default to the correct Start and End time of the session (UTC converted to user local). | P0 |
| FR-7 | Calendar event title must be descriptive (e.g., "Sidra: Math with [Teacher Name]"). | P0 |
| FR-8 | Calendar event description must include the Join Link and any important notes. | P0 |
| FR-9 | Calendar event location must be set to the Meeting URL. | P1 |

---

## 2. Technical Architecture

### Component Design

This is a **Frontend-only** feature. No backend database changes are required. Start and End times are already available in the `Booking` object.

#### New Component: `AddToCalendar.tsx`

A reusable React component that takes event details as props and renders a dropdown menu.

```typescript
interface AddToCalendarProps {
  title: string;
  description: string;
  location: string;
  startTime: Date;
  endTime: Date;
}
```

#### URL Generation Logic

We will implement utility functions to construct the URLs for each provider:

- **Google Calendar:** `https://calendar.google.com/calendar/render?action=TEMPLATE&text={title}&dates={start}/{end}&details={description}&location={location}`
  - Note: Dates must be in UTC format `YYYYMMDDTHHmmssZ`.

- **Outlook Web:** `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&startdt={start}&enddt={end}&subject={title}&body={description}&location={location}`

- **Yahoo:** `https://calendar.yahoo.com/?v=60&view=d&type=20&title={title}&st={start}&et={end}&desc={description}&in_loc={location}`

- **ICS (Apple/Desktop):** Generate a Blob with MIME type `text/calendar;charset=utf-8` containing standard VCALENDAR data and trigger a download.

---

## 3. UX & Product Decisions

### Placement
The "Add to Calendar" button should be located on the **Booking Details View**, specifically within the "Scheduled/Confirmed" status card.

- **Primary Action:** "Join Session" (if within 10-15 mins) or "Waiting for session"
- **Secondary Action:** "Add to Calendar"

### UI Pattern
Use a **Dropdown Menu** to save space and offer multiple providers cleanly.

**Label:** "Add to Calendar" or an Icon (Calendar with +).
**Options:**
- Google Calendar
- Outlook.com
- Apple Calendar (ICS)
- Yahoo Calendar

### Event Content Strategy

- **Title:** `Sidra Session: {Subject Name}` (Keep it short)
- **Description:**
  ```text
  Join Link: {meetingLink}
  
  Teacher: {Teacher Name}
  Student: {Student Name}
  
  Notes: {booking.bookingNotes}
  ```
- **Location:** `{meetingLink}`

---

## 4. Implementation Checklist

### Development
- [ ] Create generic `AddToCalendar` component in `apps/web/src/components/booking/AddToCalendar.tsx`.
- [ ] Implement query string builders for Google, Outlook, and Yahoo.
- [ ] Implement `.ics` file generation and download logic.
- [ ] Integrate `AddToCalendar` into `BookingDetailsView.tsx` for `SCHEDULED` bookings.
- [ ] Ensure times are correctly converted to the required ISO/UTC formats for links.

### Verification
- [ ] Verify Google Calendar link opens correctly with all fields populated.
- [ ] Verify Outlook link opens correctly.
- [ ] Verify ICS file imports correctly into Apple Calendar (macOS/iOS).
- [ ] Verify UI responsiveness on mobile (dropdown positioning).
