import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { SystemSettingsService } from './system-settings.service';

@Controller('system-settings')
export class PublicSystemSettingsController {
    constructor(private readonly settingsService: SystemSettingsService) { }

    @Public()
    @Get('config')
    async getPublicSettings() {
        const settings = await this.settingsService.getSettings();
        return {
            cancellationPolicies: settings.cancellationPolicies,
            searchConfig: settings.searchConfig,
            // Add other safe public settings here as needed
            packagesEnabled: settings.packagesEnabled,
            demosEnabled: settings.demosEnabled,
            maintenanceMode: settings.maintenanceMode,
            currency: settings.currency,
            meetingLinkAccessMinutes: settings.meetingLinkAccessMinutesBefore,
        };
    }

    /**
     * SECURITY FIX: Fetch deposit bank info from database instead of hardcoding in frontend
     * This endpoint is public but only returns deposit-related info
     */
    @Public()
    @Get('deposit-info')
    async getDepositBankInfo() {
        const settings = await this.settingsService.getSettings();
        return {
            bankName: settings.depositBankName,
            accountHolderName: settings.depositAccountHolderName,
            accountNumber: settings.depositAccountNumber,
        };
    }
}
