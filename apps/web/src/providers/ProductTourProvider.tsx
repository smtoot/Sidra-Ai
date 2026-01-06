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

  // Initialize driver with role-specific final CTA handler
  const initializeDriver = useCallback((role: string, isMobile: boolean) => {
    // Get steps with completion handler
    const steps = getTourSteps(role as 'TEACHER' | 'PARENT' | 'STUDENT', isMobile, handleTourCompletion);
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
        // Track step viewed
        const stepIndex = options.state.activeIndex ?? 0;
        trackEvent(TOUR_EVENTS.STEP_VIEWED, {
          role: user?.role || 'unknown',
          stepIndex,
          stepElement: typeof step.element === 'string' ? step.element : 'unknown'
        });

        // Hide popover immediately to prevent flicker during repositioning
        const popoverEl = document.querySelector('.driver-popover') as HTMLElement;
        if (popoverEl) {
          popoverEl.style.setProperty('opacity', '0', 'important');
          popoverEl.style.setProperty('transition', 'none', 'important');
        }
      },
      onHighlighted: (element, step, options) => {
        // Fix RTL positioning AFTER highlight animation completes
        const repositionPopover = (attempt: number, showPopover: boolean) => {
          const popoverEl = document.querySelector('.driver-popover') as HTMLElement;
          const selector = typeof step.element === 'string' ? step.element : null;

          // Find the VISIBLE element - there may be duplicates (mobile drawer + desktop sidebar)
          let targetElement: HTMLElement | null = null;
          if (selector) {
            const allMatches = document.querySelectorAll(selector);
            for (const el of allMatches) {
              const rect = (el as HTMLElement).getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                targetElement = el as HTMLElement;
                break;
              }
            }
          } else {
            targetElement = element as HTMLElement;
          }

          if (popoverEl && targetElement) {
            const rect = targetElement.getBoundingClientRect();
            const popoverRect = popoverEl.getBoundingClientRect();

            // Position popover to the left of the element (for RTL sidebar on right)
            // Add some padding from the element
            const gap = 15;
            const leftPos = rect.left - popoverRect.width - gap;

            // Vertically center the popover relative to the target element
            const topPos = rect.top + (rect.height / 2) - (popoverRect.height / 2);

            // Ensure popover stays within viewport
            const finalLeft = Math.max(10, leftPos);
            const finalTop = Math.max(10, Math.min(topPos, window.innerHeight - popoverRect.height - 10));

            console.log(`[Tour Debug ${attempt}] Target:`, rect.left, rect.top, 'Popover to:', finalLeft, finalTop);

            // Set position with !important
            popoverEl.classList.add('sidra-positioned');
            popoverEl.style.setProperty('left', `${finalLeft}px`, 'important');
            popoverEl.style.setProperty('top', `${finalTop}px`, 'important');
            popoverEl.style.setProperty('right', 'auto', 'important');
            popoverEl.style.setProperty('transform', 'none', 'important');
            popoverEl.style.setProperty('position', 'fixed', 'important');

            // Show popover after final repositioning
            if (showPopover) {
              popoverEl.style.setProperty('opacity', '1', 'important');
              popoverEl.style.setProperty('transition', 'opacity 0.2s ease', 'important');
            }
          }
        };

        // Reposition multiple times to ensure it sticks, show on final attempt
        repositionPopover(1, false);
        setTimeout(() => repositionPopover(2, false), 50);
        setTimeout(() => repositionPopover(3, true), 150);
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
  const startTour = async (trigger: TourTriggerSource = 'manual') => {
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
  };

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
