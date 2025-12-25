'use client';

import { useBreakpoint } from '@/hooks/useMediaQuery';
import { DesktopSidebar } from './sidebar/DesktopSidebar';
import { TabletSlideDrawer } from './sidebar/TabletSlideDrawer';
import { MobileBottomSheet } from './sidebar/MobileBottomSheet';

interface SidebarItem {
    id: string;
    nameAr: string;
    isComplete: boolean;
    isLocked: boolean;
}

interface ResponsiveSidebarProps {
    percentage: number;
    items: SidebarItem[];
    activeSection: string;
    onSectionClick: (id: string) => void;
}

/**
 * Responsive sidebar wrapper that renders the appropriate variant based on screen size:
 * - Mobile (< 640px): Bottom Sheet
 * - Tablet (640-1023px): Slide Drawer
 * - Desktop (>= 1024px): Collapsible Sidebar
 */
export function ResponsiveSidebar({
    percentage,
    items,
    activeSection,
    onSectionClick,
}: ResponsiveSidebarProps) {
    const breakpoint = useBreakpoint();

    // On mobile, render bottom sheet
    if (breakpoint === 'mobile') {
        return (
            <MobileBottomSheet
                percentage={percentage}
                items={items}
                activeSection={activeSection}
                onSectionClick={onSectionClick}
            />
        );
    }

    // On tablet, render slide drawer
    if (breakpoint === 'tablet') {
        return (
            <TabletSlideDrawer
                percentage={percentage}
                items={items}
                activeSection={activeSection}
                onSectionClick={onSectionClick}
            />
        );
    }

    // On desktop, render full/collapsible sidebar
    return (
        <DesktopSidebar
            percentage={percentage}
            items={items}
            activeSection={activeSection}
            onSectionClick={onSectionClick}
        />
    );
}

// Re-export for convenience
export { DesktopSidebar } from './sidebar/DesktopSidebar';
export { TabletSlideDrawer } from './sidebar/TabletSlideDrawer';
export { MobileBottomSheet } from './sidebar/MobileBottomSheet';
