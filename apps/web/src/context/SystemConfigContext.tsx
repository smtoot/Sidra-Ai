'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { systemApi, SystemConfig } from '@/lib/api/system';

interface SystemConfigContextType extends SystemConfig {
    isLoading: boolean;
}

const SystemConfigContext = createContext<SystemConfigContextType>({
    packagesEnabled: true, // Fail-safe default (assume enabled if fetch fails)
    demosEnabled: true,
    maintenanceMode: false,
    currency: 'SDG',
    isLoading: true,
});

export function SystemConfigProvider({ children }: { children: React.ReactNode }) {
    const [config, setConfig] = useState<SystemConfig>({
        packagesEnabled: true,
        demosEnabled: true,
        maintenanceMode: false,
        currency: 'SDG',
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const data = await systemApi.getConfig();
                setConfig(data);
            } catch (error) {
                console.error('Failed to load system config', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchConfig();
    }, []);

    return (
        <SystemConfigContext.Provider value={{ ...config, isLoading }}>
            {children}
        </SystemConfigContext.Provider>
    );
}

export const useSystemConfig = () => useContext(SystemConfigContext);
