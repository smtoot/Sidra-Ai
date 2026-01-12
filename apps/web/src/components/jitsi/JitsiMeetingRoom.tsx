'use client';

import React, { useEffect, useRef, useState } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';

export interface JitsiConfig {
  domain: string;
  roomName: string;
  jwt: string;
  userInfo: {
    id: string;
    email?: string;
    displayName: string;
    role: 'teacher' | 'student' | 'parent';
  };
  configOverwrite?: Record<string, any>;
  interfaceConfigOverwrite?: Record<string, any>;
}

interface JitsiMeetingRoomProps {
  config: JitsiConfig;
  onMeetingEnd?: () => void;
  onMeetingError?: (error: Error) => void;
  onReadyToClose?: () => void;
}

/**
 * JitsiMeetingRoom Component
 *
 * Renders a full-screen Jitsi meeting using the official Jitsi React SDK.
 * Handles JWT authentication, user configuration, and meeting lifecycle events.
 */
export const JitsiMeetingRoom: React.FC<JitsiMeetingRoomProps> = ({
  config,
  onMeetingEnd,
  onMeetingError,
  onReadyToClose,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Validate configuration
    if (!config.domain || !config.roomName || !config.jwt) {
      setError('Invalid Jitsi configuration');
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
  }, [config]);

  const handleApiReady = (api: any) => {
    console.log('Jitsi API Ready', api);

    // Add event listeners
    api.addEventListener('videoConferenceJoined', () => {
      console.log('User joined the meeting');
    });

    api.addEventListener('videoConferenceLeft', () => {
      console.log('User left the meeting');
      onMeetingEnd?.();
    });

    api.addEventListener('readyToClose', () => {
      console.log('Meeting ready to close');
      onReadyToClose?.();
    });
  };

  const handleReadyToClose = () => {
    console.log('Ready to close');
    onReadyToClose?.();
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center p-8 bg-red-900/20 rounded-lg border border-red-500">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Meeting Error</h2>
          <p className="text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading meeting...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-screen w-screen">
      <JitsiMeeting
        domain={config.domain}
        roomName={config.roomName}
        jwt={config.jwt}
        configOverwrite={{
          ...config.configOverwrite,
          startWithAudioMuted: config.configOverwrite?.startWithAudioMuted ?? false,
          startWithVideoMuted: config.configOverwrite?.startWithVideoMuted ?? false,
        }}
        interfaceConfigOverwrite={config.interfaceConfigOverwrite}
        userInfo={{
          displayName: config.userInfo.displayName,
          email: config.userInfo.email || '',
        }}
        onApiReady={handleApiReady}
        onReadyToClose={handleReadyToClose}
        getIFrameRef={(iframeRef) => {
          iframeRef.style.height = '100vh';
          iframeRef.style.width = '100vw';
        }}
      />
    </div>
  );
};

export default JitsiMeetingRoom;
