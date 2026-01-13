'use client';

import { useEffect, useState } from 'react';
import { loadRuntimeConfig } from '@/config/runtime';

interface RuntimeConfigProviderProps {
  children: React.ReactNode;
}

/**
 * Provider that loads runtime configuration when the app starts
 * This ensures the config is available before any components try to use it
 */
export function RuntimeConfigProvider({ children }: RuntimeConfigProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRuntimeConfig()
      .then(() => {
        setIsLoaded(true);
      })
      .catch((err) => {
        console.error('Failed to load runtime configuration:', err);
        setError(err.message);
        // Still set as loaded to allow app to continue with fallback values
        setIsLoaded(true);
      });
  }, []);

  if (!isLoaded) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '1rem' }}>Loading configuration...</div>
          {error && (
            <div style={{ color: 'red', fontSize: '0.875rem' }}>
              Error: {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
