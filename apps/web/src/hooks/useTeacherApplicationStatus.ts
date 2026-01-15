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
            console.log('[useTeacherApplicationStatus] No user, skipping status fetch');
            setLoading(false);
            return;
        }

        // Only fetch for teachers
        if (user.role !== 'TEACHER') {
            console.log('[useTeacherApplicationStatus] User is not a teacher:', user.role);
            setLoading(false);
            return;
        }

        let mounted = true;

        const loadStatus = async () => {
            console.log('[useTeacherApplicationStatus] Fetching status for user:', user.id);
            try {
                const data = await teacherApi.getApplicationStatus();
                console.log('[useTeacherApplicationStatus] Status received:', data?.applicationStatus);
                if (mounted) {
                    setStatus(data);
                }
            } catch (err: any) {
                if (mounted) {
                    console.error('[useTeacherApplicationStatus] Failed to load status:', {
                        message: err?.message,
                        status: err?.response?.status,
                        data: err?.response?.data
                    });
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
