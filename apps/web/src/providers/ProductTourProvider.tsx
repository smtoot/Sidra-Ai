'use client';

import { createContext, useContext, useCallback, useEffect, useState, useRef } from 'react';
import { driver, type Driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';
import { authApi } from '@/lib/api/auth';
import { TOUR_EVENTS } from '@sidra/shared';
import { getTourSteps, type TourTriggerSource } from '@/lib/tour/tour-steps';

// Stable localStorage key for V1
const TOUR_COMPLETED_KEY = 'sidra_tour_completed_v1';
const TOUR_SKIPPED_KEY = 'sidra_tour_skipped_v1';

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

  // Cleanup driver instance and all DOM artifacts
  const destroyDriver = useCallback(() => {
    // Remove all highlight classes
    document.querySelectorAll('.driver-active-element').forEach(el => {
      el.classList.remove('driver-active-element');
    });
    document.querySelectorAll('.sidra-tour-highlight').forEach(el => {
      el.classList.remove('sidra-tour-highlight');
    });

    // Remove any leftover driver.js overlay
    document.querySelectorAll('.driver-overlay').forEach(el => {
      el.remove();
    });
    document.querySelectorAll('.driver-popover').forEach(el => {
      el.remove();
    });

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
    trackEvent(TOUR_EVENTS.COMPLETED, {
      role: user?.role || 'unknown',
      trigger: currentTriggerRef.current
    });
    trackEvent(TOUR_EVENTS.CTA_CLICKED, {
      role: user?.role || 'unknown',
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

  // Handle skip tour
  const handleSkipTour = useCallback(() => {
    if (driverRef.current) {
      driverRef.current.destroy();
    }
  }, []);

  // Helper to clean up all highlight classes from the DOM
  const cleanupHighlights = useCallback(() => {
    document.querySelectorAll('.driver-active-element').forEach(el => {
      el.classList.remove('driver-active-element');
    });
    document.querySelectorAll('.sidra-tour-highlight').forEach(el => {
      el.classList.remove('sidra-tour-highlight');
    });
  }, []);

  // Initialize driver with role-specific final CTA handler
  const initializeDriver = useCallback((role: string, isMobile: boolean) => {
    // Get steps with completion handler
    const steps = getTourSteps(role as 'TEACHER' | 'PARENT' | 'STUDENT', isMobile, handleTourCompletion, handleSkipTour);
    stepsRef.current = steps;

    const d = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      disableActiveInteraction: false,
      stagePadding: 10,
      stageRadius: 8,
      popoverClass: 'sidra-tour-popover',
      progressText: '{{current}} من {{total}}',
      nextBtnText: 'التالي',
      prevBtnText: 'السابق',
      doneBtnText: 'إنهاء الجولة',
      onHighlightStarted: (element, step, options) => {
        // Clean up previous highlights before highlighting new element
        cleanupHighlights();

        // Track step viewed
        const stepIndex = options.state.activeIndex ?? 0;
        trackEvent(TOUR_EVENTS.STEP_VIEWED, {
          role: user?.role || 'unknown',
          stepIndex,
          stepElement: typeof step.element === 'string' ? step.element : 'unknown'
        });
      },
      onHighlighted: (element, step, options) => {
        // Fix RTL positioning and highlighting
        const selector = typeof step.element === 'string' ? step.element : null;

        // Find the VISIBLE element - there may be duplicates (mobile drawer + desktop sidebar)
        let visibleTarget: HTMLElement | null = null;
        if (selector) {
          const allMatches = document.querySelectorAll(selector);
          for (const el of allMatches) {
            const rect = (el as HTMLElement).getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              visibleTarget = el as HTMLElement;
              break;
            }
          }
        }

        // Remove highlight from wrong element and add to correct one
        if (visibleTarget && element !== visibleTarget) {
          // Remove driver's highlight class from wrong element
          element?.classList.remove('driver-active-element');
          // Add highlight to the correct visible element
          visibleTarget.classList.add('driver-active-element');
        }

        const repositionPopover = () => {
          const popoverEl = document.querySelector('.driver-popover') as HTMLElement;
          const targetElement = visibleTarget || element as HTMLElement;

          if (popoverEl && targetElement) {
            const rect = targetElement.getBoundingClientRect();
            const popoverRect = popoverEl.getBoundingClientRect();

            // Position popover to the left of the element (for RTL sidebar on right)
            const gap = 15;
            const leftPos = rect.left - popoverRect.width - gap;
            const topPos = rect.top + (rect.height / 2) - (popoverRect.height / 2);

            // Ensure popover stays within viewport
            const finalLeft = Math.max(10, leftPos);
            const finalTop = Math.max(10, Math.min(topPos, window.innerHeight - popoverRect.height - 10));

            // Set position
            popoverEl.classList.add('sidra-positioned');
            popoverEl.style.setProperty('left', `${finalLeft}px`, 'important');
            popoverEl.style.setProperty('top', `${finalTop}px`, 'important');
            popoverEl.style.setProperty('right', 'auto', 'important');
            popoverEl.style.setProperty('transform', 'none', 'important');
            popoverEl.style.setProperty('position', 'fixed', 'important');

            // Show popover with fade in
            popoverEl.classList.add('sidra-visible');
          }
        };

        // Position and show after a brief delay
        setTimeout(repositionPopover, 50);
        setTimeout(repositionPopover, 150);
      },
      onDeselected: (element) => {
        // Remove highlight from deselected element
        if (element) {
          element.classList.remove('driver-active-element');
          element.classList.remove('sidra-tour-highlight');
        }
      },
      onDestroyStarted: () => {
        // User closed tour before completion (X button or overlay click)
        if (!tourCompletedRef.current) {
          const activeIndex = driverRef.current?.getActiveIndex() ?? 0;
          trackEvent(TOUR_EVENTS.CLOSED, {
            role: user?.role || 'unknown',
            trigger: currentTriggerRef.current,
            closedAtStep: activeIndex,
            totalSteps: stepsRef.current.length
          });

          // Mark as skipped/seen in localStorage so it doesn't annoy user on refresh
          // But do NOT mark full completion in DB to allow manual restart
          if (user?.id) {
            localStorage.setItem(TOUR_SKIPPED_KEY, user.id);
          }
        }

        // Clean up all highlights immediately
        cleanupHighlights();
      },
      onDestroyed: () => {
        // Final cleanup after driver is destroyed
        cleanupHighlights();
        setIsActive(false);
      }
    });

    driverRef.current = d;
    return d;
  }, [user?.role, handleTourCompletion, cleanupHighlights]);

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

    // Wait for DOM to be fully ready after sidebar animation
    await new Promise(resolve => setTimeout(resolve, 300));

    // Verify first element exists before starting
    const firstElement = document.querySelector('[data-tour="nav-dashboard"]');
    if (!firstElement) {
      console.warn('Tour element not found: [data-tour="nav-dashboard"]');
      return;
    }

    // Initialize driver
    const d = initializeDriver(user.role, isMobile);

    if (stepsRef.current.length === 0) {
      console.warn('No tour steps available for role:', user.role);
      return;
    }

    // Track tour start
    trackEvent(TOUR_EVENTS.STARTED, {
      role: user.role,
      isMobile,
      trigger
    });

    setIsActive(true);
    d.setSteps(stepsRef.current);
    d.drive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // 1. Check Backend Persistence First (Strongest check)
    // Cast user as any to access custom property if TS complains, or assume interface updated
    if ((user as any).hasCompletedTour) return;

    // 2. Check localStorage cache (stable key for V1)
    if (localStorage.getItem(TOUR_COMPLETED_KEY) === user.id) return;

    // 3. Check if skipped recently (to avoid annoyance on same device)
    if (localStorage.getItem(TOUR_SKIPPED_KEY) === user.id) return;

    // Dashboard paths for each role
    const dashboardPaths = ['/teacher', '/parent', '/student'];
    const isOnDashboard = dashboardPaths.some(p => pathname === p || pathname === `${p}/dashboard`);

    if (isOnDashboard) {
      // Delay to ensure DOM is ready and navigation is rendered
      const timer = setTimeout(() => {
        startTour('auto');
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [pathname, user, startTour]); // Added user to dependency (not just user.id/role)

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
