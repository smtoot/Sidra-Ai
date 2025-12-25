'use client';

import { useState, useEffect } from 'react';
import { teacherApi } from '@/lib/api/teacher';
import AvailabilityGrid from '@/components/teacher/AvailabilityGrid';
import { DayOfWeek } from '@sidra/shared';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AvailabilitySlot {
    id: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    isRecurring: boolean;
}

export function AvailabilityManager() {
    const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAvailability();
    }, []);

    const loadAvailability = async () => {
        setLoading(true);
        try {
            // Availability comes from profile
            const profile = await teacherApi.getProfile();
            setAvailability(profile.availability || []);
        } catch (err) {
            console.error('Failed to load availability:', err);
            toast.error('فشل تحميل المواعيد');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (slots: { dayOfWeek: DayOfWeek; startTime: string; endTime: string; isRecurring: boolean }[]) => {
        try {
            // Use setBulkAvailability to replace all slots
            await teacherApi.setBulkAvailability(slots);
            toast.success('تم حفظ المواعيد بنجاح');
            await loadAvailability();
        } catch (err) {
            console.error('Failed to save availability:', err);
            toast.error('فشل حفظ المواعيد');
            throw err;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <AvailabilityGrid
            availability={availability}
            onSave={handleSave}
            loading={loading}
        />
    );
}

