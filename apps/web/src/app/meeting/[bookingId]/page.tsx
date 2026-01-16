'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useJitsiConfig } from '@/hooks/useJitsiConfig';
import dynamic from 'next/dynamic';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SessionCompletionModal } from '@/components/booking/SessionCompletionModal';

// Dynamically import JitsiMeetingRoom to avoid SSR issues
const JitsiMeetingRoom = dynamic(
  () => import('@/components/jitsi/JitsiMeetingRoom').then((mod) => mod.JitsiMeetingRoom),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading meeting...</p>
        </div>
      </div>
    ),
  }
);

/**
 * Meeting Page
 *
 * This page handles joining a Jitsi meeting for a specific booking.
 * It fetches the meeting configuration from the API and renders the Jitsi room.
 */
export default function MeetingPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.bookingId as string;

  const { config, isLoading, error, refetch } = useJitsiConfig(bookingId);

  // P1-5: State for end meeting confirmation dialog and session completion modal
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const [showSessionCompletionModal, setShowSessionCompletionModal] = useState(false);

  useEffect(() => {
    // Poll for configuration updates every 30 seconds if not yet accessible
    if (config && !config.canJoin) {
      const interval = setInterval(() => {
        refetch();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [config, refetch]);

  // Handle user leaving the meeting (Hangup) - Just redirect, don't change status
  const handleMeetingLeft = () => {
    console.log('User left meeting');
    redirectUser();
  };

  // P1-5: Show confirmation dialog when teacher ends meeting
  const handleMeetingEnded = () => {
    console.log('Meeting ended (readyToClose)');

    // For teachers, show confirmation dialog before completing session
    if (config?.jitsiConfig?.userInfo?.role === 'teacher') {
      setShowEndConfirmation(true);
      return;
    }

    // For students/parents, just redirect
    redirectUser();
  };

  // P1-5: Open session completion modal when teacher confirms ending
  const handleConfirmEndSession = () => {
    setShowEndConfirmation(false);
    setShowSessionCompletionModal(true);
  };

  // P1-5: Cancel ending session - redirect without completing
  const handleCancelEndSession = () => {
    setShowEndConfirmation(false);
    redirectUser();
  };

  // P1-5: Handle successful session completion from modal
  const handleSessionCompletionSuccess = () => {
    setShowSessionCompletionModal(false);
    redirectUser();
  };

  // P1-5: Handle closing completion modal without completing
  const handleSessionCompletionClose = () => {
    setShowSessionCompletionModal(false);
    redirectUser();
  };

  const redirectUser = () => {
    // Determine redirect URL based on role if available
    if (config?.jitsiConfig?.userInfo?.role) {
      const { role } = config.jitsiConfig.userInfo;
      if (role === 'teacher') {
        router.push(`/teacher/sessions/${bookingId}`);
        return;
      } else if (role === 'student' || role === 'parent') {
        router.push(`/${role}/bookings/${bookingId}`);
        return;
      }
    }

    // Fallback if role is unknown
    router.push('/');
  };

  const handleMeetingError = (err: Error) => {
    console.error('Meeting error:', err);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Loading meeting configuration...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center p-8 bg-red-900/20 rounded-lg border border-red-500 max-w-md">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Unable to Join Meeting</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // No configuration
  if (!config) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center p-8 bg-gray-800 rounded-lg border border-gray-700 max-w-md">
          <h2 className="text-2xl font-bold text-gray-300 mb-4">Meeting Not Found</h2>
          <p className="text-gray-400 mb-6">
            Unable to find meeting configuration for this booking.
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // External meeting link
  if (config.meetingMethod === 'external') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center p-8 bg-gray-800 rounded-lg border border-gray-700 max-w-md">
          <h2 className="text-2xl font-bold text-gray-300 mb-4">External Meeting</h2>
          <p className="text-gray-400 mb-6">
            {config.externalLink
              ? 'This meeting uses an external link.'
              : config.message || 'No meeting link available yet.'}
          </p>
          {config.externalLink && (
            <a
              href={config.externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mb-4"
            >
              Join Meeting
            </a>
          )}
          <button
            onClick={() => router.back()}
            className="block w-full px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Cannot join yet
  if (!config.canJoin) {
    const accessibleAt = config.accessibleAt ? new Date(config.accessibleAt) : null;

    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center p-8 bg-yellow-900/20 rounded-lg border border-yellow-500 max-w-md">
          <h2 className="text-2xl font-bold text-yellow-500 mb-4">Meeting Not Yet Available</h2>
          <p className="text-gray-300 mb-4">{config.message || 'Please wait...'}</p>
          {accessibleAt && (
            <p className="text-gray-400 text-sm mb-6">
              Meeting will be accessible at:{' '}
              <span className="font-semibold">{accessibleAt.toLocaleString()}</span>
            </p>
          )}
          <div className="space-y-3">
            <button
              onClick={refetch}
              className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Check Again
            </button>
            <button
              onClick={() => router.back()}
              className="w-full px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Ready to join Jitsi meeting
  if (config.jitsiConfig) {
    return (
      <>
        {/* P1-5: End Meeting Confirmation Dialog for Teachers */}
        <Dialog open={showEndConfirmation} onOpenChange={setShowEndConfirmation}>
          <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl text-white">إنهاء الحصة</DialogTitle>
              <DialogDescription className="text-gray-300">
                هل أنت متأكد من إنهاء الحصة؟ ستتمكن من إضافة ملخص الحصة والواجبات.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-3 sm:gap-3">
              <Button
                variant="outline"
                onClick={handleCancelEndSession}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                إلغاء والخروج
              </Button>
              <Button
                onClick={handleConfirmEndSession}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                متابعة لملخص الحصة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* P1-5: Session Completion Modal with summary, homework, etc. */}
        <SessionCompletionModal
          isOpen={showSessionCompletionModal}
          onClose={handleSessionCompletionClose}
          bookingId={bookingId}
          onSuccess={handleSessionCompletionSuccess}
        />

        {/* Jitsi Meeting Room - hidden when dialogs are shown */}
        {!showEndConfirmation && !showSessionCompletionModal && (
          <JitsiMeetingRoom
            config={config.jitsiConfig}
            bookingId={bookingId}
            onMeetingEnd={handleMeetingLeft}
            onMeetingError={handleMeetingError}
            onReadyToClose={handleMeetingEnded}
          />
        )}

        {/* Show a backdrop when dialogs are open but Jitsi closed */}
        {(showEndConfirmation || showSessionCompletionModal) && (
          <div className="fixed inset-0 bg-gray-900 z-40" />
        )}
      </>
    );
  }

  // Fallback
  return (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <div className="text-center p-8 bg-gray-800 rounded-lg border border-gray-700 max-w-md">
        <h2 className="text-2xl font-bold text-gray-300 mb-4">Unable to Load Meeting</h2>
        <p className="text-gray-400 mb-6">An unexpected error occurred.</p>
        <button
          onClick={() => router.back()}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
