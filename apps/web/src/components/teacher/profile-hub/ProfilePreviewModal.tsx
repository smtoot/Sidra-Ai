'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Play } from 'lucide-react';
import { TeacherProfileView } from '@/components/teacher/public-profile/TeacherProfileView';
import { mapHubStateToPublicProfile } from '@/lib/mappers/profile-mapper';

interface ProfilePreviewPageProps {
    open: boolean;
    onClose: () => void;
    profile: any; // Raw hub profile state
}

export function ProfilePreviewPage({ open, onClose, profile }: ProfilePreviewPageProps) {

    // Lock body scroll when open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    if (!open) return null;

    // Map the raw hub state to the public profile format
    // Strict Mode: No dummy data. Empty fields remain empty.
    const mappedProfile = mapHubStateToPublicProfile(profile);

    return (
        <div className="fixed inset-0 z-50 bg-background-light overflow-y-auto font-tajawal" dir="rtl">
            {/* Close Button Floating or Fixed Header? 
                TeacherProfileView has a banner, but we need a close button for the modal context.
                We'll add a floating close button or a header. 
                Since TeacherProfileView has a banner in preview mode, we can overlay a close button 
                or put it in a separate header above the view.
            */}

            <div className="relative">
                {/* Floating Close Button */}
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={onClose}
                    className="fixed top-4 left-4 z-[60] shadow-lg border border-gray-200"
                >
                    <X className="w-4 h-4 ml-2" />
                    إغلاق المعاينة
                </Button>

                <TeacherProfileView
                    teacher={mappedProfile}
                    mode="preview"
                />
            </div>
        </div>
    );
}
