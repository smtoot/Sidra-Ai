import { useState, useEffect } from 'react';
import { teacherApi, TeacherApplicationStatus } from '@/lib/api/teacher';
import { useAuth } from '@/context/AuthContext';

export function useTeacherApplicationStatus() {
    const { user, isLoading: authLoading } = useAuth();
    const [status, setStatus] = useState<TeacherApplicationStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        // Wait for auth to initialize
        if (authLoading) return;

        // If no user, don't fetch
        if (!user) {
            setLoading(false);
            return;
        }

        let mounted = true;

        const loadStatus = async () => {
            try {
                const data = await teacherApi.getApplicationStatus();
                if (mounted) {
                    setStatus(data);
                }
            } catch (err) {
                if (mounted) {
                    console.error('Failed to load application status', err);
                    setError(err);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        loadStatus();

        return () => {
            mounted = false;
        };
    }, [user, authLoading]);

    const isApproved = status?.applicationStatus === 'APPROVED';
    const isChangesRequested = status?.applicationStatus === 'CHANGES_REQUESTED';
    const isInterviewScheduled = status?.applicationStatus === 'INTERVIEW_SCHEDULED';

    return {
        status,
        loading,
        error,
        isApproved,
        isChangesRequested,
        isInterviewScheduled
    };
}
