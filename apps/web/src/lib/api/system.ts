import { api } from '../api';

export interface SystemConfig {
    maintenanceMode: boolean;
    currency: string;
    meetingLinkAccessMinutes: number;
    packagesEnabled: boolean;
    demosEnabled: boolean;
    searchConfig?: any;
    cancellationPolicies?: any;
}

export const systemApi = {
    getPublicConfig: async (): Promise<SystemConfig> => {
        const response = await api.get('/system-settings/config');
        return response.data;
    }
};
