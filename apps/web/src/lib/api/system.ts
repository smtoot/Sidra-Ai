import { api } from '@/lib/api';

export interface SystemConfig {
    packagesEnabled: boolean;
    demosEnabled: boolean;
    maintenanceMode: boolean;
    currency: string;
}

export const systemApi = {
    getConfig: async (): Promise<SystemConfig> => {
        const response = await api.get('/system/config');
        return response.data;
    }
};
