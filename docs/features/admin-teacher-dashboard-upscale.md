# Admin Teacher Dashboard Upscale

## 1. Overview
The current "Teachers" page in the Admin Dashboard is barely functional for new users. It displays "Undefined" statuses and "No Name" for users who have registered but not yet completed their profile. It also lacks critical information like contact details and location, making it hard for admins to follow up with potential teachers.

This feature aims to upgrade the dashboard to be a fully functional workspace for managing the teacher pipeline.

## 2. Problem Statement
- **"Broken" UI**: New signups appear as "Undefined" with no name, looking like a bug.
- **Missing Data**: No phone number or location shown, requiring admins to click into details (which might also be empty).
- **No Search**: Cannot find a specific teacher among a list.
- **No Filter**: Cannot separate "Pending" applications from "Active" teachers.

## 3. Implementation Details

### 3.1 Status Mapping
We will map the internal data state to user-friendly UI badges.

| Internal State | Display Badge | Color | Meaning |
| :--- | :--- | :--- | :--- |
| `teacherProfile` is NULL | **New Account** | Gray | User registered, no profile started. |
| `status` = `DRAFT` | **Draft** | Gray/Neutral | Profile created, not submitted. |
| `status` = `SUBMITTED` | **Under Review** | Yellow | Application waiting for admin. |
| `status` = `CHANGES_REQUESTED` | **Changes Req** | Orange | Admin requested fixes. |
| `status` = `INTERVIEW_*` | **Interview** | Purple | Interview phase. |
| `status` = `APPROVED` | **Active** | Green | Teacher is live. |
| `status` = `REJECTED` | **Rejected** | Red | Application denied. |

### 3.2 New Table Columns
1.  **Teacher**: Display Name (or Email if missing), Email (subtext).
2.  **Contact**:
    -   WhatsApp Number (if available).
    -   Link to open WhatsApp Web.
3.  **Location**:
    -   City, Country (e.g., "Riyadh, SA").
4.  **Status**: Color-coded badge (as defined above).
5.  **Joined**: Registration Date (`createdAt`).
6.  **Actions**: "View Details" button.

### 3.3 Search & Filtering
- **Search Bar**: Search by Name or Email.
- **Filter Tabs**:
    -   **All**: Show everyone.
    -   **Pending**: `SUBMITTED` status.
    -   **Active**: `APPROVED` status.
    -   **New/Draft**: `NULL` or `DRAFT`.

## 4. Technical Constraints
- **No Database Changes**: We will use existing fields (`users.email`, `teacher_profiles.whatsappNumber`, etc.).
- **Frontend Only**: All logic will be implemented in `apps/web/src/app/admin/teachers/page.tsx`.

## 5. Mobile Responsiveness
- On mobile, hide "Location" and "Joined" columns to save space.
- Keep "Teacher", "Status", and "Actions".
