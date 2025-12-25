'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

interface QueryProviderProps {
    children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
    // Create QueryClient instance with default options
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                // Refetch on window focus for fresh data
                refetchOnWindowFocus: false,
                // Retry failed requests once
                retry: 1,
                // Keep unused data in cache for 5 minutes
                gcTime: 5 * 60 * 1000,
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
