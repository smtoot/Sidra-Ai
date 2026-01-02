
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/public.decorator';
import { SystemSettingsService } from './admin/system-settings.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly settingsService: SystemSettingsService,
  ) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // SECURITY: Public health check endpoint for monitoring/load balancers
  @Public()
  @Get('health')
  async healthCheck() {
    return this.appService.healthCheck();
  }

  // NEW: Public configuration endpoint for feature flags
  @Public()
  @Get('system/config')
  async getSystemConfig() {
    const settings = await this.settingsService.getSettings();
    return {
      packagesEnabled: settings.packagesEnabled,
      demosEnabled: settings.demosEnabled,
      maintenanceMode: settings.maintenanceMode,
      currency: settings.currency,
      meetingLinkAccessMinutes: settings.meetingLinkAccessMinutesBefore,
    };
  }
}
