'use client';

import { useState, useEffect } from 'react';
import { teacherApi } from '@/lib/api/teacher';
import { Play, ToggleLeft, ToggleRight, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useSystemConfig } from '@/context/SystemConfigContext';

interface DemoSettingsProps {
    isReadOnly?: boolean;
}

export function DemoSettings({ isReadOnly = false }: DemoSettingsProps) {
    const { demosEnabled: globalDemosEnabled, isLoading: configLoading } = useSystemConfig();
    const [demoEnabled, setDemoEnabled] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadDemoSettings();
    }, []);

    const loadDemoSettings = async () => {
        try {
            const settings = await teacherApi.getDemoSettings();
            setDemoEnabled(settings?.demoEnabled ?? false);
        } catch (err) {
            console.error('Failed to load demo settings', err);
        }
    };

    const handleDemoToggle = async () => {
        if (isReadOnly) return;

        setLoading(true);
        const newValue = !demoEnabled;
        try {
            await teacherApi.updateDemoSettings(newValue);
            setDemoEnabled(newValue);
            toast.success(newValue ? 'تم تفعيل الحصص التجريبية' : 'تم إيقاف الحصص التجريبية');
        } catch (err) {
            console.error('Failed to update demo settings', err);
            toast.error('فشل في تحديث إعدادات الحصص التجريبية');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200 space-y-4">
            <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-sm">الحصص التجريبية</h3>
            </div>

            <p className="text-xs text-gray-600">
                اسمح للطلاب الجدد بحجز حصة تجريبية مجانية (30 دقيقة) معك لمرة واحدة
            </p>

            {!globalDemosEnabled && !configLoading ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700">
                        تم إيقاف الحصص التجريبية مؤقتاً من قبل إدارة المنصة. لا يمكن تفعيلها حالياً.
                    </p>
                </div>
            ) : (
                <button
                    onClick={handleDemoToggle}
                    disabled={isReadOnly || loading}
                    className={cn(
                        "flex items-center gap-3 w-full p-3 rounded-lg border transition-all",
                        demoEnabled
                            ? "bg-green-50 border-green-300 hover:bg-green-100"
                            : "bg-gray-50 border-gray-200 hover:bg-gray-100",
                        isReadOnly && "opacity-60 cursor-not-allowed"
                    )}
                >
                    {demoEnabled ? (
                        <ToggleRight className="w-8 h-8 text-green-600" />
                    ) : (
                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                    )}
                    <div className="flex-1 text-right">
                        <p className={cn(
                            "font-medium text-sm",
                            demoEnabled ? "text-green-700" : "text-gray-600"
                        )}>
                            {demoEnabled ? 'الحصص التجريبية مفعّلة' : 'الحصص التجريبية معطّلة'}
                        </p>
                        <p className="text-xs text-gray-500">
                            {demoEnabled
                                ? 'الطلاب يمكنهم حجز حصة تجريبية مجانية معك'
                                : 'لن يتمكن الطلاب من حجز حصص تجريبية'}
                        </p>
                    </div>
                </button>
            )}
        </div>
    );
}
