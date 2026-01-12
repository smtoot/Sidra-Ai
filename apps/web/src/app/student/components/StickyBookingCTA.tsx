'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import Link from 'next/link';

/**
 * Sticky bottom CTA for mobile - primary conversion driver
 * Always visible on scroll, guides user to book a session
 */
export function StickyBookingCTA() {
    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 p-4 pb-6 bg-gradient-to-t from-white via-white to-white/95 border-t border-gray-100 safe-area-pb">
            <Link href="/search" className="block">
                <Button
                    size="lg"
                    className="w-full h-14 text-lg font-bold shadow-xl hover:shadow-2xl transition-all rounded-xl gap-2"
                >
                    <Calendar className="w-5 h-5" />
                    احجز حصة
                </Button>
            </Link>
        </div>
    );
}
