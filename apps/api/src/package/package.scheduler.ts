import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PackageService } from './package.service';

@Injectable()
export class PackageScheduler {
    private readonly logger = new Logger(PackageScheduler.name);

    constructor(private packageService: PackageService) { }

    /**
     * Run daily at midnight to expire old packages
     * Safe to run multiple times (idempotent)
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handlePackageExpiry() {
        this.logger.log('Running package expiry cron job...');
        try {
            const result = await this.packageService.expirePackages();
            this.logger.log(`Package expiry complete: ${result.expiredCount} packages expired`);
        } catch (error) {
            this.logger.error('Package expiry cron job failed', error);
        }
    }
}
