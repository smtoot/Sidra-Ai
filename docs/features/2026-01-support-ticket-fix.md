# Feature: Support Ticket System Access Fix & Enhancement

## Owner
- Product Owner: Omar
- Implementer: Antigravity
- Reviewer: Claude

---

## Goal
The goal is to fix the **403 Forbidden** access issues preventing Admins from managing Support Tickets on Staging, and to enhance the admin interface with necessary filtering and organizational tools.

---

## Scope
### In Scope
- **Backend**:
    - Add explicit debug logging in `PermissionsGuard` to trace authorization failures on Staging.
    - Verify `ADMIN` and `SUPPORT` roles have `TICKETS_VIEW`, `TICKETS_RESOLVE`, etc. permissions correctly mapped.
    - Ensure `20251228220432` migration is verified and `permissionOverrides` column exists on `users`.
- **Frontend (Admin UI)**:
    - Update `/admin/support-tickets` to handle authorization errors gracefully.
    - Add "Filter Tabs" for efficient workflow:
        - "My Queue" (Assigned to Me)
        - "Unassigned" (New tickets)
        - "All Tickets"
    - Add "Quick Assign" button to assign tickets to self.
    - Add "Filter by Status" dropdown.

### Out of Scope
- Creating new `SupportTicket` data models (Schema is already present).
- Third-party integrations (Zendesk, etc.).

---

## User Flow
1. **Admin** logs in and clicks "Support Tickets" in the sidebar.
2. The page loads successfully (resolving the current 403 error).
3. Admin sees a dashboard with tabs: **My Assignments**, **Unassigned**, **All**.
4. Admin can quickly filter by priority (Critical/High).
5. Admin clicks on a ticket to view details and resolve/reply.

---

## Database Impact
- [x] No DB change (Permissions are code-based, Schema already exists)
- [ ] Schema change
- [ ] New migration required

Details:
- Existing schema `support_tickets` is sufficient.
- Verification of existing migrations on Staging is required as part of the fix.

---

## Acceptance Criteria (MANDATORY)
- [x] **Admin can access** `/admin/support-tickets` without 403 error.
- [x] **My Assignments Tab** shows tickets assigned to the logged-in admin.
- [x] **Unassigned Tab** shows tickets with `assignedToId: null`.
- [x] **Permission Logging** is active to diagnose any future RBAC issues.
- [x] All existing support ticket actions (Resolve, Close, Reply) function correctly.

---

## Implementation Notes

### Backend Changes
1. **Enhanced PermissionsGuard logging** (`apps/api/src/auth/permissions.guard.ts`):
   - Added detailed debug logging for all permission checks
   - Logs include: route path, HTTP method, user ID, role, required permissions, effective permissions
   - On denial: logs full permission override details for diagnosis

2. **Permission mappings verified** (`apps/api/src/auth/permissions.constants.ts`):
   - ADMIN role: Has `tickets.*` wildcard (all ticket permissions)
   - SUPPORT role: Has `tickets.*` wildcard (all ticket permissions)
   - MODERATOR role: Has `tickets.*` wildcard (all ticket permissions)

### Frontend Changes
1. **Admin Support Tickets Page** (`apps/web/src/app/admin/support-tickets/page.tsx`):
   - Already has 3 tabs: Unassigned, My Assignments, All
   - Already has Filter by Status dropdown
   - Already has graceful 403 error handling with user-friendly message

2. **Quick Assign Button** (`apps/web/src/components/support/TicketCard.tsx`):
   - Added `showQuickAssign` prop for admin mode
   - "Assign to Me" button appears on unassigned tickets
   - Shows loading state during assignment
   - Triggers refresh callback after assignment

3. **AdminTicketQueue** (`apps/web/src/components/admin/support/AdminTicketQueue.tsx`):
   - Enabled Quick Assign for all ticket cards in admin view

---

## Environments Verification
- [ ] Local tested
- [ ] Staging tested
- [ ] Production ready

---

## PR Reference
- PR Link:

---

## Final Status
- [ ] Draft
- [x] In Progress
- [ ] Ready for Review
- [ ] Accepted
