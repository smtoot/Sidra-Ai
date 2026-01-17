# Notification Audit & Improvement Plan

**Date:** 2026-01-16  
**Scope:** In-app notifications + email outbox + admin configuration + real-time delivery (teacher “new request” visibility)

## Current System (What Exists Today)

- **Backend (API)**
  - In-app notifications persisted in DB: `packages/database/prisma/schema.prisma` (`notifications` + `NotificationType/Status` enums).
  - Core service: `apps/api/src/notification/notification.service.ts` (creates in-app notifications + optionally enqueues emails).
  - API endpoints: `apps/api/src/notification/notification.controller.ts` (`/notifications`, `/notifications/unread-count`, mark read).
  - Email delivery is **async**: `apps/api/src/notification/email-outbox.worker.ts` (cron worker with retries, sends via Resend).
  - Admin email previews: `apps/api/src/admin/admin.controller.ts` (templates + preview).

- **Frontend (Web)**
  - Notification API client: `apps/web/src/lib/api/notification.ts`.
  - React Query hooks (polling): `apps/web/src/hooks/useNotifications.ts`.
  - UI: `apps/web/src/components/notification/NotificationBell.tsx` (badge + dropdown list).
  - Toast infra: Sonner (already present in layout).

## Findings (Gaps / Risks)

1. **No attention signal when a new notification arrives**
   - The app could have an unread badge, but there was no toast/sound/title change to draw attention.
   - This matches the reported issue: teachers can miss new booking requests unless they “notice” something manually.

2. **Real-time delivery is polling-only**
   - No WebSocket/SSE infrastructure found in API (`@WebSocketGateway` etc.).
   - Polling is good as a fallback but not true real-time (and can feel like “needs refresh”).

3. **Type drift between DB/API and Web**
   - Prisma enum includes types like `DISPUTE_RAISED`, `URGENT`, `ADMIN_ALERT`, `SESSION_REMINDER`, `ACCOUNT_UPDATE`.
   - Web `NotificationType` did not include these (easy source of UI edge cases over time).

4. **Missing notification on an admin action**
   - Withdrawal `PAID` flow in `apps/api/src/admin/admin.service.ts` had a TODO for notifying the teacher.

5. **Admin “notification configuration” is currently missing**
   - `system_settings` has no notification toggles, templates mapping, “quiet hours”, etc.
   - Admin can preview email templates, but cannot:
     - configure per-event channels (in-app/email),
     - test-send notifications,
     - monitor email outbox health from UI,
     - manage template/event mapping.

## Immediate Fixes Applied (This PR)

- **In-app attention signal**: added `apps/web/src/components/notification/NotificationListener.tsx` to toast when unread count increases, and update the browser title.
- **More responsive polling**: reduced polling interval from 60s → 15s in `apps/web/src/hooks/useNotifications.ts`.
- **Type consistency**: aligned Web `NotificationType` with Prisma enum in `apps/web/src/lib/api/notification.ts`.
- **Missing admin notification**: added teacher notification for withdrawal payout completion in `apps/api/src/admin/admin.service.ts`.

## Improvement Plan (Solid Next Steps)

### Phase 1 — UX Completeness (1–2 days)
- Ensure notification UI is always visible/accessible (including collapsed sidebar / mobile variants).
- Add “new request” visibility on teacher dashboard beyond notifications:
  - Add a **pending requests badge** (requires API endpoint for pending count or reuse notification metadata).
- Optional: opt-in sound + desktop notification (browser Notifications API) with user permission.

### Phase 2 — True Real-Time (2–5 days)
- Add WebSocket-based push for notifications (works with JWT auth in headers/query; SSE is harder with current localStorage token approach).
  - API: WebSocket gateway + per-user “room” (userId) + emit `notification:new` on `createInAppNotification`.
  - Web: connect once, update React Query caches + show toast instantly.
- Keep polling as a fallback (network issues, WS blocked).
- If you run multiple API instances: add Redis pub/sub adapter for WS fan-out.

### Phase 3 — Admin Configuration & Monitoring (3–7 days)
- Extend `system_settings` with `notificationConfig` JSON (or a dedicated table) for:
  - per-event enable/disable,
  - channel routing (in-app vs email),
  - template mapping + localized message/title defaults,
  - quiet hours / throttling rules.
- Add admin dashboards:
  - Email outbox: queue depth, failures, retries, “replay” button.
  - Notification events: last 24h volume by type, top failure reasons.
  - “Send test notification/email” tool.

### Phase 4 — Reliability & Compliance (ongoing)
- Add structured logging + metrics for notification creation and email sending (success/fail + latency).
- Add automated checks to prevent PII leakage in notification payloads (especially user-visible messages).
- Add dedupeKey conventions and linting (to avoid collisions across event types).

