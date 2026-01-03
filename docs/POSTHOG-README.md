# PostHog Analytics Integration

This document explains how to use PostHog analytics in the Sidra platform.

## Setup

### Environment Variables

**Frontend** (`apps/web/.env.local`):
```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_your_project_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
# Set to 'true' ONLY in staging for autocapture debugging
NEXT_PUBLIC_POSTHOG_AUTOCAPTURE=false
```

**Backend** (`apps/api/.env`):
```bash
POSTHOG_API_KEY=phc_your_project_key
POSTHOG_HOST=https://app.posthog.com
```

> **Note**: If environment variables are not set, PostHog is automatically disabled.

---

## Tracking Events

### Frontend (React)

```typescript
import { trackEvent } from '@/lib/analytics';
import { BOOKING_EVENTS } from '@sidra/shared';

// Track a simple event
trackEvent(BOOKING_EVENTS.STARTED);

// Track with properties (type-safe)
trackEvent(STUDENT_EVENTS.SEARCH_PERFORMED, {
  curriculum: 'IGCSE',
  subject: 'Math',
  filters_used_count: 3,
});
```

### Backend (NestJS)

```typescript
import { PostHogService } from '../common/posthog/posthog.service';
import { PAYMENT_EVENTS } from '@sidra/shared';

@Injectable()
export class PaymentService {
  constructor(private posthog: PostHogService) {}

  async processPayment(userId: string) {
    // ... payment logic ...
    
    this.posthog.capture(userId, PAYMENT_EVENTS.SUCCEEDED);
  }
}
```

---

## Adding a New Event

1. **Add to shared package** (`packages/shared/src/analytics-events.ts`):
   ```typescript
   export const YOUR_EVENTS = {
     NEW_EVENT: 'your_new_event',
   } as const;
   ```

2. **Add to ALLOWED_EVENTS**:
   ```typescript
   export const ALLOWED_EVENTS: Set<string> = new Set([
     ...Object.values(YOUR_EVENTS),
     // ... other events
   ]);
   ```

3. **Add property types** (if event has properties):
   ```typescript
   export interface EventProperties {
     your_new_event: { some_property: string };
   }
   ```

4. **Rebuild shared package**:
   ```bash
   cd packages/shared && npm run build
   ```

---

## Feature Flags

### Usage in React

```typescript
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

function MyComponent() {
  const isNewFeatureEnabled = useFeatureFlag('new-feature');
  
  if (!isNewFeatureEnabled) return null;
  return <NewFeature />;
}
```

### Creating a Flag (PostHog Dashboard)

1. Go to PostHog → Feature Flags
2. Click "New feature flag"
3. Set key (e.g., `new-feature`)
4. Configure rollout percentage
5. Save

---

## Testing in Staging

1. **Set environment variables** in Railway staging environment
2. **Enable debug mode**: Check browser console for `[PostHog]` logs
3. **Verify events**: PostHog → Events → Live events
4. **Enable autocapture** (staging only):
   ```bash
   NEXT_PUBLIC_POSTHOG_AUTOCAPTURE=true
   ```

---

## Session Replay

Session replay is **disabled by default** to control costs. It automatically starts when these events occur:

- `payment_failed`
- `booking_error`
- `critical_onboarding_error`

All inputs are masked by default. Add `data-ph-mask` to mask additional elements.

---

## Cost Control

The integration enforces strict cost controls:

- ✅ Event allowlist: Only defined events are sent
- ✅ Autocapture disabled in production
- ✅ Pageview capture disabled (use `trackPageview()` manually if needed)
- ✅ Session replay off by default
- ✅ Internal events filtered in production

---

## Group Analytics (Future)

Foundation is in place for organization/school grouping:

```typescript
import { setOrganization } from '@/lib/analytics';

// When user joins an organization
setOrganization('org-123', { name: 'Cairo Learning Center' });
```
