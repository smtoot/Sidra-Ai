# Product Tour Implementation Plan (V1)

## Overview
Implement a first-time user onboarding walkthrough using Driver.js across all user roles (Teacher, Parent, Student).

---

## Phase 1: Schema & Backend

### 1.1 Prisma Schema Update
Add `hasCompletedTour` field to the `users` model in `/packages/database/prisma/schema.prisma`:

```prisma
model users {
  // ... existing fields ...
  hasCompletedTour    Boolean   @default(false)
  tourCompletedAt     DateTime?
}
```

**Note**: The model is named `users` (lowercase, plural) in the existing schema.

### 1.2 Database Migration
```bash
cd packages/database
npx prisma migrate dev --name add_user_tour_completion
```

### 1.3 API Endpoint
Create endpoint in NestJS backend using authenticated user context:

**File**: `/apps/api/src/users/users.controller.ts`
```typescript
@Patch('me/tour-completed')
@UseGuards(JwtAuthGuard)
async markTourCompleted(@CurrentUser() user: UserPayload) {
  return this.usersService.markTourCompleted(user.id);
}
```

**File**: `/apps/api/src/users/users.service.ts`
```typescript
async markTourCompleted(userId: string) {
  return this.prisma.users.update({
    where: { id: userId },
    data: {
      hasCompletedTour: true,
      tourCompletedAt: new Date()
    }
  });
}
```

### 1.4 Frontend API Client
Add method to `authApi` (uses existing `api` axios instance with credentials):

**File**: `/apps/web/src/lib/api/auth.ts`
```typescript
export const authApi = {
    // ... existing methods ...

    markTourCompleted: async (): Promise<void> => {
        await api.patch('/users/me/tour-completed');
    }
};
```

---

## Phase 2: Frontend Setup

### 2.1 Install Driver.js
```bash
cd apps/web
npm install driver.js
```

### 2.2 Add data-tour Attributes to Navigation.tsx
File: `/apps/web/src/components/layout/Navigation.tsx`

Add these `data-tour` attributes to sidebar elements:

| Element | data-tour Value | Purpose |
|---------|-----------------|---------|
| Sidebar container | `data-tour="sidebar"` | Main sidebar reference |
| Dashboard link | `data-tour="nav-dashboard"` | Dashboard navigation |
| Lessons/Sessions link | `data-tour="nav-lessons"` | Lessons page (Teacher: حصصي, Parent: الحصص) |
| Availability link | `data-tour="nav-availability"` | Teacher availability |
| Children link | `data-tour="nav-children"` | Parent's children list |
| Book Teacher link | `data-tour="nav-book-teacher"` | Parent/Student booking |
| Wallet link | `data-tour="nav-wallet"` | Wallet/payments |
| Profile link | `data-tour="nav-profile"` | Profile settings |
| Help menu section | `data-tour="nav-help"` | Help/support area |

### 2.3 Add Help Menu Item
Add "ابدأ جولة تعريفية" (Start Tour) button to sidebar Help section:

```tsx
// In Navigation.tsx help menu items
import { PlayCircle } from 'lucide-react';

{
  icon: PlayCircle,
  label: 'ابدأ جولة تعريفية',
  onClick: () => window.dispatchEvent(new CustomEvent('start-product-tour')),
  dataTour: 'start-tour-button'
}
```

---

## Phase 3: Product Tour Component

### 3.1 Create Tour Provider
File: `/apps/web/src/providers/ProductTourProvider.tsx`

```typescript
'use client';

import { createContext, useContext, useCallback, useEffect, useState, useRef } from 'react';
import { driver, Driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';
import { authApi } from '@/lib/api/auth';
import { getTourSteps, type TourTriggerSource } from '@/lib/tour/tour-steps';

// Stable localStorage key for V1
const TOUR_COMPLETED_KEY = 'sidra_tour_completed_v1';

interface ProductTourContextType {
  startTour: (trigger?: TourTriggerSource) => void;
  isActive: boolean;
}

const ProductTourContext = createContext<ProductTourContextType | null>(null);

export function ProductTourProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isActive, setIsActive] = useState(false);

  // Refs for explicit completion tracking
  const driverRef = useRef<Driver | null>(null);
  const stepsRef = useRef<DriveStep[]>([]);
  const currentTriggerRef = useRef<TourTriggerSource>('manual');
  const tourCompletedRef = useRef(false);

  // Cleanup driver instance
  const destroyDriver = useCallback(() => {
    if (driverRef.current) {
      driverRef.current.destroy();
      driverRef.current = null;
    }
    setIsActive(false);
  }, []);

  // Handle explicit tour completion (only on final CTA click)
  const handleTourCompletion = useCallback(async (finalDestination: string) => {
    if (tourCompletedRef.current) return; // Prevent double completion
    tourCompletedRef.current = true;

    // 1. Track completion analytics
    trackEvent('TOUR_EVENTS', 'tour_completed', {
      role: user?.role,
      trigger: currentTriggerRef.current
    });
    trackEvent('TOUR_EVENTS', 'tour_cta_clicked', {
      role: user?.role,
      destination: finalDestination
    });

    // 2. Persist to backend (fire and forget, but await for reliability)
    try {
      await authApi.markTourCompleted();
    } catch (error) {
      console.error('Failed to persist tour completion to backend:', error);
      // Continue anyway - localStorage will serve as fallback
    }

    // 3. Persist to localStorage
    if (user?.id) {
      localStorage.setItem(TOUR_COMPLETED_KEY, user.id);
    }

    // 4. Destroy driver instance
    destroyDriver();

    // 5. Navigate using app router
    router.push(finalDestination);
  }, [user?.role, user?.id, destroyDriver, router]);

  // Initialize driver with role-specific final CTA handler
  const initializeDriver = useCallback((role: string, isMobile: boolean) => {
    // Get steps with completion handler
    const steps = getTourSteps(role as 'TEACHER' | 'PARENT' | 'STUDENT', isMobile, handleTourCompletion);
    stepsRef.current = steps;

    const d = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      overlayClickNext: false,
      stagePadding: 10,
      stageRadius: 8,
      popoverClass: 'sidra-tour-popover',
      progressText: '{{current}} من {{total}}',
      nextBtnText: 'التالي',
      prevBtnText: 'السابق',
      doneBtnText: 'إنهاء الجولة',
      onHighlightStarted: (element, step, options) => {
        // Track step viewed
        const stepIndex = options.state.activeIndex;
        trackEvent('TOUR_EVENTS', 'tour_step_viewed', {
          role: user?.role,
          stepIndex,
          stepElement: typeof step.element === 'string' ? step.element : 'unknown'
        });
      },
      onDestroyStarted: () => {
        // User closed tour before completion (X button or overlay click)
        if (!tourCompletedRef.current) {
          const activeIndex = driverRef.current?.getActiveIndex() ?? 0;
          trackEvent('TOUR_EVENTS', 'tour_closed', {
            role: user?.role,
            trigger: currentTriggerRef.current,
            closedAtStep: activeIndex,
            totalSteps: stepsRef.current.length
          });
        }
        setIsActive(false);
      }
    });

    driverRef.current = d;
    return d;
  }, [user?.role, handleTourCompletion]);

  // Ensure sidebar visibility before tour starts
  const ensureSidebarVisibility = useCallback(() => {
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      // Dispatch event to open mobile menu
      window.dispatchEvent(new CustomEvent('open-mobile-menu'));
      // Give time for animation
      return new Promise(resolve => setTimeout(resolve, 350));
    } else {
      // Dispatch event to expand sidebar if collapsed
      window.dispatchEvent(new CustomEvent('expand-sidebar'));
      return new Promise(resolve => setTimeout(resolve, 100));
    }
  }, []);

  // Main tour start function
  const startTour = useCallback(async (trigger: TourTriggerSource = 'manual') => {
    if (!user?.role || isActive) return;

    // Reset completion flag for new tour
    tourCompletedRef.current = false;
    currentTriggerRef.current = trigger;

    const isMobile = window.innerWidth < 768;

    // Ensure navigation is visible
    await ensureSidebarVisibility();

    // Initialize driver
    const d = initializeDriver(user.role, isMobile);

    if (stepsRef.current.length === 0) {
      console.warn('No tour steps available for role:', user.role);
      return;
    }

    // Track tour start
    trackEvent('TOUR_EVENTS', 'tour_started', {
      role: user.role,
      isMobile,
      trigger
    });

    setIsActive(true);
    d.setSteps(stepsRef.current);
    d.drive();
  }, [user?.role, isActive, ensureSidebarVisibility, initializeDriver]);

  // Listen for manual tour start from Help menu
  useEffect(() => {
    const handleStartTour = () => startTour('manual');
    window.addEventListener('start-product-tour', handleStartTour);
    return () => window.removeEventListener('start-product-tour', handleStartTour);
  }, [startTour]);

  // Auto-start on first dashboard visit
  useEffect(() => {
    if (!user?.id || !user?.role) return;

    // Check localStorage cache first (stable key for V1)
    const cachedCompletion = localStorage.getItem(TOUR_COMPLETED_KEY);
    if (cachedCompletion === user.id) return;

    // Check if user has completed tour (from JWT or API response)
    // Note: hasCompletedTour should be included in the user profile response
    // For now, rely on localStorage as primary check until backend is updated

    const dashboardPaths = ['/teacher/dashboard', '/parent/dashboard', '/student/dashboard'];
    const isOnDashboard = dashboardPaths.some(p => pathname.startsWith(p.replace('/dashboard', '')));

    if (isOnDashboard) {
      // Delay to ensure DOM is ready and navigation is rendered
      const timer = setTimeout(() => {
        startTour('auto');
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [pathname, user?.id, user?.role, startTour]);

  // Cleanup on unmount
  useEffect(() => {
    return () => destroyDriver();
  }, [destroyDriver]);

  return (
    <ProductTourContext.Provider value={{ startTour, isActive }}>
      {children}
    </ProductTourContext.Provider>
  );
}

export const useProductTour = () => {
  const context = useContext(ProductTourContext);
  if (!context) throw new Error('useProductTour must be used within ProductTourProvider');
  return context;
};
```

### 3.2 Tour Steps Configuration
File: `/apps/web/src/lib/tour/tour-steps.ts`

```typescript
import { DriveStep } from 'driver.js';

export type UserRole = 'TEACHER' | 'PARENT' | 'STUDENT';
export type TourTriggerSource = 'auto' | 'manual';

type CompletionHandler = (destination: string) => Promise<void>;

export function getTourSteps(
  role: UserRole,
  isMobile: boolean,
  onComplete: CompletionHandler
): DriveStep[] {
  const baseSteps = getBaseSteps(isMobile);
  const roleSteps = getRoleSpecificSteps(role, isMobile, onComplete);

  return [...baseSteps, ...roleSteps];
}

function getBaseSteps(isMobile: boolean): DriveStep[] {
  return [
    {
      element: '[data-tour="sidebar"]',
      popover: {
        title: 'مرحباً بك في سدرة! 👋',
        description: 'هذي لوحة التحكم الخاصة فيك. خلّينا نعرفك عليها بسرعة.',
        side: isMobile ? 'bottom' : 'left',
        align: 'start'
      }
    }
  ];
}

function getRoleSpecificSteps(
  role: UserRole,
  isMobile: boolean,
  onComplete: CompletionHandler
): DriveStep[] {
  switch (role) {
    case 'TEACHER':
      return getTeacherSteps(isMobile, onComplete);
    case 'PARENT':
      return getParentSteps(isMobile, onComplete);
    case 'STUDENT':
      return getStudentSteps(isMobile, onComplete);
    default:
      return [];
  }
}

function getTeacherSteps(isMobile: boolean, onComplete: CompletionHandler): DriveStep[] {
  return [
    {
      element: '[data-tour="nav-dashboard"]',
      popover: {
        title: 'لوحة التحكم',
        description: 'هنا تشوف ملخص يومك: الحصص الجاية، الأرباح، والإشعارات المهمة.',
        side: isMobile ? 'bottom' : 'left'
      }
    },
    {
      element: '[data-tour="nav-availability"]',
      popover: {
        title: 'مواعيد التوفّر ⭐',
        description: 'أهم خطوة! حدد الأوقات البتكون متاح فيها عشان الطلاب يقدرون يحجزون معك.',
        side: isMobile ? 'bottom' : 'left'
      }
    },
    {
      element: '[data-tour="nav-lessons"]',
      popover: {
        title: 'حصصي',
        description: 'هنا تلاقي كل حجوزاتك - الجاية والماضية. تقدر تبدأ الحصة أو تشوف التفاصيل.',
        side: isMobile ? 'bottom' : 'left'
      }
    },
    {
      element: '[data-tour="nav-wallet"]',
      popover: {
        title: 'المحفظة',
        description: 'تابع أرباحك واطلب سحب رصيدك بسهولة.',
        side: isMobile ? 'bottom' : 'left'
      }
    },
    {
      element: '[data-tour="nav-profile"]',
      popover: {
        title: 'الملف الشخصي',
        description: 'عدّل بياناتك، خبراتك، وأسعارك. ملف كامل = ثقة أكثر من الطلاب!',
        side: isMobile ? 'bottom' : 'left'
      }
    },
    {
      element: '[data-tour="nav-help"]',
      popover: {
        title: 'المساعدة',
        description: 'محتاج مساعدة؟ تواصل معنا في أي وقت. وتقدر تعيد الجولة من هنا!',
        side: isMobile ? 'bottom' : 'left'
      }
    },
    {
      // Final step - CTA with explicit completion
      element: '[data-tour="nav-availability"]',
      popover: {
        title: 'يلّا نبدأ! 🚀',
        description: 'خلّينا نحدد أوقات توفّرك عشان تبدأ تستقبل حجوزات.',
        side: isMobile ? 'bottom' : 'left',
        onNextClick: () => {
          onComplete('/teacher/availability');
        }
      }
    }
  ];
}

function getParentSteps(isMobile: boolean, onComplete: CompletionHandler): DriveStep[] {
  return [
    {
      element: '[data-tour="nav-dashboard"]',
      popover: {
        title: 'لوحة التحكم',
        description: 'هنا تشوف ملخص حجوزات أطفالك والحصص الجاية.',
        side: isMobile ? 'bottom' : 'left'
      }
    },
    {
      element: '[data-tour="nav-children"]',
      popover: {
        title: 'أطفالي ⭐',
        description: 'أضف أطفالك عشان تقدر تحجز لهم دروس مع أفضل المعلمين.',
        side: isMobile ? 'bottom' : 'left'
      }
    },
    {
      element: '[data-tour="nav-book-teacher"]',
      popover: {
        title: 'احجز معلم',
        description: 'تصفح قائمة المعلمين المعتمدين واختر الأنسب لطفلك.',
        side: isMobile ? 'bottom' : 'left'
      }
    },
    {
      element: '[data-tour="nav-lessons"]',
      popover: {
        title: 'الحصص',
        description: 'تابع جميع الحجوزات - الجاية والمكتملة.',
        side: isMobile ? 'bottom' : 'left'
      }
    },
    {
      element: '[data-tour="nav-help"]',
      popover: {
        title: 'المساعدة',
        description: 'محتاج مساعدة؟ فريقنا جاهز لخدمتك. وتقدر تعيد الجولة من هنا!',
        side: isMobile ? 'bottom' : 'left'
      }
    },
    {
      // Final step - CTA with explicit completion
      element: '[data-tour="nav-children"]',
      popover: {
        title: 'يلّا نبدأ! 🚀',
        description: 'أضف طفلك الأول عشان نبدأ رحلة التعلم!',
        side: isMobile ? 'bottom' : 'left',
        onNextClick: () => {
          onComplete('/parent/children');
        }
      }
    }
  ];
}

function getStudentSteps(isMobile: boolean, onComplete: CompletionHandler): DriveStep[] {
  return [
    {
      element: '[data-tour="nav-dashboard"]',
      popover: {
        title: 'لوحة التحكم',
        description: 'هنا تشوف ملخص حصصك الجاية وتقدمك.',
        side: isMobile ? 'bottom' : 'left'
      }
    },
    {
      element: '[data-tour="nav-book-teacher"]',
      popover: {
        title: 'احجز معلم ⭐',
        description: 'تصفح المعلمين المعتمدين واحجز حصتك الأولى!',
        side: isMobile ? 'bottom' : 'left'
      }
    },
    {
      element: '[data-tour="nav-lessons"]',
      popover: {
        title: 'حصصي',
        description: 'تابع جميع حجوزاتك ودخّل الحصة من هنا.',
        side: isMobile ? 'bottom' : 'left'
      }
    },
    {
      element: '[data-tour="nav-wallet"]',
      popover: {
        title: 'المحفظة',
        description: 'شوف رصيدك وتاريخ معاملاتك.',
        side: isMobile ? 'bottom' : 'left'
      }
    },
    {
      element: '[data-tour="nav-help"]',
      popover: {
        title: 'المساعدة',
        description: 'محتاج مساعدة؟ تواصل معنا! وتقدر تعيد الجولة من هنا.',
        side: isMobile ? 'bottom' : 'left'
      }
    },
    {
      // Final step - CTA with explicit completion
      element: '[data-tour="nav-book-teacher"]',
      popover: {
        title: 'يلّا نبدأ! 🚀',
        description: 'خلّينا نلاقي لك المعلم المناسب!',
        side: isMobile ? 'bottom' : 'left',
        onNextClick: () => {
          onComplete('/student/teachers');
        }
      }
    }
  ];
}
```

### 3.3 Custom CSS for RTL
File: `/apps/web/src/styles/tour.css`

```css
/* Driver.js RTL Customization */
.sidra-tour-popover {
  direction: rtl;
  font-family: var(--font-tajawal), sans-serif;
}

.sidra-tour-popover .driver-popover-title {
  font-weight: 700;
  font-size: 1.125rem;
}

.sidra-tour-popover .driver-popover-description {
  font-size: 0.9375rem;
  line-height: 1.7;
  color: #4B5563;
}

.sidra-tour-popover .driver-popover-progress-text {
  font-size: 0.75rem;
  color: #9CA3AF;
}

.sidra-tour-popover .driver-popover-navigation-btns {
  flex-direction: row-reverse;
  gap: 0.5rem;
}

.sidra-tour-popover .driver-popover-next-btn {
  background-color: var(--color-primary);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
}

.sidra-tour-popover .driver-popover-prev-btn {
  background-color: transparent;
  color: #6B7280;
  padding: 0.5rem 1rem;
}

/* Mobile adjustments */
@media (max-width: 767px) {
  .sidra-tour-popover {
    max-width: 90vw !important;
  }

  .sidra-tour-popover .driver-popover-title {
    font-size: 1rem;
  }

  .sidra-tour-popover .driver-popover-description {
    font-size: 0.875rem;
  }
}
```

---

## Phase 4: Analytics Integration

### 4.1 Add Tour Events to Analytics
File: `/packages/shared/src/analytics-events.ts`

```typescript
export const TOUR_EVENTS = {
  tour_started: {
    name: 'tour_started',
    description: 'User started the product tour',
    properties: ['role', 'isMobile', 'trigger'] // trigger: 'auto' | 'manual'
  },
  tour_completed: {
    name: 'tour_completed',
    description: 'User completed the entire tour by clicking final CTA',
    properties: ['role', 'trigger']
  },
  tour_step_viewed: {
    name: 'tour_step_viewed',
    description: 'User viewed a specific tour step',
    properties: ['role', 'stepIndex', 'stepElement']
  },
  tour_closed: {
    name: 'tour_closed',
    description: 'User closed the tour before completion',
    properties: ['role', 'trigger', 'closedAtStep', 'totalSteps']
  },
  tour_cta_clicked: {
    name: 'tour_cta_clicked',
    description: 'User clicked the final CTA button',
    properties: ['role', 'destination']
  }
} as const;
```

---

## Phase 5: Navigation Updates

### 5.1 Add Event Listeners to Navigation.tsx
Add handlers for sidebar visibility events:

```typescript
// In Navigation.tsx
useEffect(() => {
  const handleExpandSidebar = () => {
    setIsCollapsed(false);
  };

  const handleOpenMobileMenu = () => {
    setMobileMenuOpen(true);
  };

  window.addEventListener('expand-sidebar', handleExpandSidebar);
  window.addEventListener('open-mobile-menu', handleOpenMobileMenu);

  return () => {
    window.removeEventListener('expand-sidebar', handleExpandSidebar);
    window.removeEventListener('open-mobile-menu', handleOpenMobileMenu);
  };
}, []);
```

---

## Phase 6: Integration

### 6.1 Add Provider to App
File: `/apps/web/src/app/layout.tsx` (or appropriate layout)

```tsx
import { ProductTourProvider } from '@/providers/ProductTourProvider';

// Wrap children with provider (after AuthProvider)
<AuthProvider>
  <ProductTourProvider>
    {children}
  </ProductTourProvider>
</AuthProvider>
```

### 6.2 Import Tour CSS
File: `/apps/web/src/app/globals.css`

```css
@import '../styles/tour.css';
```

---

## Implementation Checklist

### Backend
- [ ] Add `hasCompletedTour` and `tourCompletedAt` to `users` schema (note: model is lowercase `users`)
- [ ] Run Prisma migration
- [ ] Create `PATCH /users/me/tour-completed` endpoint (user-context based)
- [ ] Add `hasCompletedTour` to auth profile response (optional, for faster checks)

### Frontend - API
- [ ] Add `markTourCompleted()` to `authApi` in `/lib/api/auth.ts`

### Frontend - Core
- [ ] Install Driver.js: `npm install driver.js`
- [ ] Create `/lib/tour/tour-steps.ts` with completion handler pattern
- [ ] Create `/providers/ProductTourProvider.tsx` with explicit completion flow
- [ ] Create `/styles/tour.css`

### Frontend - Navigation
- [ ] Add `data-tour` attributes to Navigation.tsx
- [ ] Add "ابدأ جولة تعريفية" button to Help menu
- [ ] Add event listeners for `expand-sidebar` and `open-mobile-menu`

### Frontend - Integration
- [ ] Import ProductTourProvider in layout
- [ ] Import tour.css in globals.css

### Analytics
- [ ] Add TOUR_EVENTS to analytics-events.ts with proper property definitions
- [ ] Verify trackEvent calls include trigger source

### Testing
- [ ] Test Teacher tour flow (7 steps + final CTA)
- [ ] Test Parent tour flow (6 steps + final CTA)
- [ ] Test Student tour flow (6 steps + final CTA)
- [ ] Test mobile responsiveness and sidebar opening
- [ ] Test manual restart from Help menu (trigger: 'manual')
- [ ] Test auto-start on first dashboard visit (trigger: 'auto')
- [ ] Verify completion persists to DB before navigation
- [ ] Verify localStorage uses stable key: `sidra_tour_completed_v1`
- [ ] Test closing tour early (X button) - should NOT mark as completed
- [ ] Test that router.push is used (not window.location.href)

---

## Files to Create/Modify

| Action | File Path |
|--------|-----------|
| MODIFY | `/packages/database/prisma/schema.prisma` |
| CREATE | Migration file (auto-generated) |
| MODIFY | `/apps/api/src/users/users.controller.ts` |
| MODIFY | `/apps/api/src/users/users.service.ts` |
| MODIFY | `/apps/web/src/lib/api/auth.ts` |
| CREATE | `/apps/web/src/providers/ProductTourProvider.tsx` |
| CREATE | `/apps/web/src/lib/tour/tour-steps.ts` |
| CREATE | `/apps/web/src/styles/tour.css` |
| MODIFY | `/apps/web/src/components/layout/Navigation.tsx` |
| MODIFY | `/apps/web/src/app/layout.tsx` or role layouts |
| MODIFY | `/apps/web/src/app/globals.css` |
| MODIFY | `/packages/shared/src/analytics-events.ts` |

---

## Critical Implementation Notes

### ✅ Completion Flow (MANDATORY)
1. Tour completion is ONLY triggered when user clicks final CTA button
2. Completion sequence:
   - Track analytics (tour_completed, tour_cta_clicked)
   - Persist to backend via `authApi.markTourCompleted()`
   - Persist to localStorage with stable key
   - Destroy driver instance
   - Navigate using `router.push()`

### ✅ API Usage (MANDATORY)
- Use existing `api` axios instance from `/lib/api.ts`
- All requests go through `authApi` which handles auth automatically
- Never use hardcoded fetch/axios calls to backend

### ✅ Trigger Source Tracking (MANDATORY)
- `'auto'` - First dashboard visit
- `'manual'` - User clicked Help menu button
- Include in all analytics events

### ✅ localStorage Key (MANDATORY)
- Use single stable key: `sidra_tour_completed_v1`
- Value is user ID for validation
- No versioning complexity in V1

### ✅ Navigation (MANDATORY)
- Use Next.js `router.push()` for all navigation
- Never use `window.location.href`

### ✅ Sidebar Visibility (MANDATORY)
- Dispatch custom events to open sidebar before tour starts
- Navigation.tsx must listen for these events
- Wait for animation to complete before starting tour

### ✅ Early Exit Handling
- Closing tour early (X button) does NOT mark as completed
- Only final CTA click marks completion
- Track `tour_closed` event with step info for analytics
