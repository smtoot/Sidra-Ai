import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export interface JitsiConfigResponse {
  bookingId: string;
  meetingMethod: 'jitsi' | 'external';
  jitsiConfig?: {
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
  };
  externalLink?: string;
  canJoin: boolean;
  message?: string;
  accessibleAt?: string;
}

interface UseJitsiConfigResult {
  config: JitsiConfigResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Custom hook to fetch Jitsi configuration for a booking
 *
 * @param bookingId - The booking ID to fetch configuration for
 * @returns Configuration, loading state, error, and refetch function
 */
export function useJitsiConfig(bookingId: string): UseJitsiConfigResult {
  const [config, setConfig] = useState<JitsiConfigResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { accessToken } = useAuth();

  const fetchConfig = async () => {
    if (!bookingId) {
      setError('Booking ID is required');
      setIsLoading(false);
      return;
    }

    if (!accessToken) {
      setError('Authentication required');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/bookings/${bookingId}/jitsi-config`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to fetch meeting configuration: ${response.status}`
        );
      }

      const data: JitsiConfigResponse = await response.json();
      setConfig(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching Jitsi config:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [bookingId, accessToken]);

  return {
    config,
    isLoading,
    error,
    refetch: fetchConfig,
  };
}

/**
 * Hook to toggle between Jitsi and external meeting link (teacher only)
 */
export function useToggleJitsi(bookingId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { accessToken } = useAuth();

  const toggleMeetingMethod = async (useExternal: boolean) => {
    if (!accessToken) {
      setError('Authentication required');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/bookings/${bookingId}/toggle-jitsi`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ useExternal }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to toggle meeting method: ${response.status}`
        );
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error toggling Jitsi:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    toggleMeetingMethod,
    isLoading,
    error,
  };
}
