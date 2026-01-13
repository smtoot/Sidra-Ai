# Active Session System Integration

## Goal
Fix the distinct lack of visibility for ongoing sessions by introducing a clear, reliable "Active Session" state across all user roles (Teacher, Student, Parent). The system must treat the Backend as the Single Source of Truth for session states.

## Core Principles
1.  **Backend as Source of Truth**: All status logic (active, joinable) is calculated on the server.
2.  **Unified Logic**: Shared helper functions for time calculations.
3.  **Role Consistency**: A session that is active for a student must be active for the teacher.

## Definitions

### Active Session
*   **Status**: `SCHEDULED`
*   **Time Window**: `startTime <= now <= endTime`
*   **Note**: Does not extend beyond `endTime`.

### Joinable Session
*   **Time Window**: `startTime - 10min <= now <= endTime`
*   **Purpose**: Allows users to enter the waiting room or class slightly early.

## Technical Implementation

### Domain Logic (Shared)
- `isSessionActive(booking, now)`
- `isSessionJoinable(booking, now)`

### API Changes

#### Teacher Service (`getDashboardStats`)
- **Returns**: `activeSession` (Active/Ongoing only), `upcomingSession` (Next future session non-overlapping).
- **Flags**: `isActive`, `isJoinable`, `isLate`, `hasMeetingLink`.
- **UX**: Do not switch to "Upcoming" immediately if session just ended (2-3 min buffer).

#### Student Service (`getDashboardStats`)
- **Returns**: `activeSession` (if Joinable or Active).
- **Same Logic** as Teacher.

#### Parent Service (`getDashboardStats`)
- **Returns**: `activeSessions` (Array, one per child).
- **Sort**: Active first, then soonest ending.

### Frontend Changes

#### `ActiveSessionCard` Component
- **Visuals**: High-visibility, "Live Now" badge (pulsing), Timer (Elapsed or Remaining).
- **Actions**: "Launch Class" (Teacher), "Join Class" (Student/Parent).
- **Validation**:
    - **Teacher**: Warn if meeting link is missing.
    - **Student/Parent**: Disable join if link is missing.

#### Dashboard Updates
- **Teacher**: Show `ActiveSessionCard` at top if active. Ignore `upcomingSession` in this case.
- **Student**: Show `ActiveSessionCard` if joinable/active.
- **Parent**: Show list of `ActiveSessionCard`s for children.
