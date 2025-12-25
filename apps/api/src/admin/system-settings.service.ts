import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { AuditAction } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class SystemSettingsService {
    private readonly logger = new Logger(SystemSettingsService.name);
    private readonly SETTINGS_ID = 'default';

    constructor(
        private prisma: PrismaService,
        private auditService: AuditService
    ) { }

    /**
     * Get settings with safe upsert
     * Guarantees a return value
     */
    async getSettings() {
        // Try to get existing
        let settings = await this.prisma.systemSettings.findUnique({
            where: { id: this.SETTINGS_ID }
        });

        // If not found, create defaults
        if (!settings) {
            this.logger.log('Initializing default system settings...');
            settings = await this.prisma.systemSettings.create({
                data: {
                    id: this.SETTINGS_ID,
                    // defaults are handled by Prisma schema
                }
            });
        }

        return settings;
    }

    /**
     * Update settings with audit logging
     */
    async updateSettings(
        adminUserId: string,
        data: {
            platformFeePercent?: number; // In UI we use percent (e.g. 15), DB uses decimal (0.15)
            autoReleaseHours?: number;
            paymentWindowHours?: number;
            minHoursBeforeSession?: number;
            packagesEnabled?: boolean;
            demosEnabled?: boolean;
        }
    ) {
        // Get old settings for diff logging
        const oldSettings = await this.getSettings();

        // Prepare update data
        const updateData: any = {};

        if (data.platformFeePercent !== undefined) {
            // Convert 18 -> 0.18
            updateData.defaultCommissionRate = new Decimal(data.platformFeePercent).div(100);
        }

        if (data.autoReleaseHours !== undefined) {
            updateData.confirmationWindowHours = data.autoReleaseHours;
        }

        if (data.paymentWindowHours !== undefined) {
            updateData.paymentWindowHours = data.paymentWindowHours;
        }

        if (data.minHoursBeforeSession !== undefined) {
            updateData.minHoursBeforeSession = data.minHoursBeforeSession;
        }

        if (data.packagesEnabled !== undefined) {
            updateData.packagesEnabled = data.packagesEnabled;
        }

        if (data.demosEnabled !== undefined) {
            updateData.demosEnabled = data.demosEnabled;
        }

        // Execute update
        const newSettings = await this.prisma.systemSettings.update({
            where: { id: this.SETTINGS_ID },
            data: updateData
        });

        // Log the change
        console.log(`[DEBUG] Logging action for user ${adminUserId}`, {
            action: AuditAction.SETTINGS_UPDATE,
            targetId: this.SETTINGS_ID
        });

        try {
            await this.auditService.logAction({
                action: AuditAction.SETTINGS_UPDATE,
                actorId: adminUserId,
                targetId: this.SETTINGS_ID,
                payload: {
                    changes: data,
                    oldValues: {
                        rate: oldSettings.defaultCommissionRate,
                        window: oldSettings.confirmationWindowHours
                    },
                    newValues: {
                        rate: newSettings.defaultCommissionRate,
                        window: newSettings.confirmationWindowHours
                    }
                }
            });
            console.log('[DEBUG] Audit log created successfully');
        } catch (e) {
            console.error('[DEBUG] Audit log creation failed', e);
        }

        return newSettings;
    }
}
