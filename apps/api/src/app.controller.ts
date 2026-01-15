import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/public.decorator';
import { SystemSettingsService } from './admin/system-settings.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly settingsService: SystemSettingsService,
  ) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // SECURITY: Public health check endpoint for monitoring/load balancers
  // STABILITY FIX: Returns proper HTTP status codes for health checks
  @Public()
  @Get('health')
  async healthCheck() {
    const health = await this.appService.healthCheck();

    // Return 503 Service Unavailable if database is down
    // This allows container orchestration to restart or route traffic elsewhere
    if (health.status === 'error') {
      throw new HttpException(health, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return health;
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
