import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationService } from '../notification/notification.service';
import { normalizeMoney } from '../utils/money';

@Injectable()
export class EscrowSchedulerService {
    private readonly logger = new Logger(EscrowSchedulerService.name);

    constructor(
        private prisma: PrismaService,
        private walletService: WalletService,
        private notificationService: NotificationService
    ) { }

    /**
     * Auto-release job: Runs every 15 minutes
     * Releases payment for PENDING_CONFIRMATION bookings where autoReleaseAt has passed
     */
    @Cron(CronExpression.EVERY_10_MINUTES) // Use 10 min for more responsive releases
    async processAutoReleases() {
        this.logger.log('🕐 Running auto-release job...');
        const now = new Date();

        try {
            // Find bookings ready for auto-release (dispute window expired, no dispute)
            const bookingsToRelease = await this.prisma.booking.findMany({
                where: {
                    status: 'PENDING_CONFIRMATION',
                    disputeWindowClosesAt: { lte: now }, // NEW: Use dispute window
                    dispute: null // No active dispute
                },
                include: {
                    teacherProfile: { include: { user: true } },
                    bookedByUser: true,
                }
            });

            if (bookingsToRelease.length === 0) {
                this.logger.log('✓ No bookings ready for auto-release');
                return { released: 0 };
            }

            let releasedCount = 0;
            for (const booking of bookingsToRelease) {
                try {
                    // P1-3 FIX: Atomic Auto-Release within transaction
                    await this.prisma.$transaction(async (tx) => {
                        // 1. Conditional Update: PENDING_CONFIRMATION -> COMPLETED
                        // This guarantees we hold the lock and state is valid
                        const updatedBooking = await tx.booking.update({
                            where: {
                                id: booking.id,
                                status: 'PENDING_CONFIRMATION' // Strict check
                            },
                            data: {
                                status: 'COMPLETED',
                                paymentReleasedAt: now
                            }
                        }); // Will throw if record check fails or already updated? No, standard update throws if not found?
                        // Actually, update throws 'Record to update not found.' if condition fails.
                        // This is exactly what we want for concurrency safety.

                        // 2. Release payment to teacher (atomic with status update)
                        const price = Number(booking.price);
                        const commissionRate = Number(booking.commissionRate);

                        await this.walletService.releaseFundsOnCompletion(
                            booking.bookedByUserId,
                            booking.teacherProfile.userId,
                            booking.id,
                            price,
                            commissionRate,
                            tx // Pass transaction
                        );
                    });

                    releasedCount++;
                    this.logger.log(`💰 Released payment for booking ${booking.id.slice(0, 8)}`);

                    // Notify teacher of payment release (auto-release)
                    // Note: Notifications are safe outside TX, but we do them after successful commit.
                    const price = normalizeMoney(booking.price); // MONEY NORMALIZATION
                    const commissionRate = Number(booking.commissionRate);
                    const teacherAmount = normalizeMoney(price * (1 - commissionRate)); // MONEY NORMALIZATION

                    await this.notificationService.notifyTeacherPaymentReleased({
                        bookingId: booking.id,
                        teacherId: booking.teacherProfile.user.id,
                        amount: teacherAmount,
                        releaseType: 'AUTO',
                    });

                } catch (err) {
                    // Detailed error logging for debugging
                    if (err.code === 'P2025') {
                        this.logger.warn(`Skipped auto-release for ${booking.id}: Status changed or concurrent update.`);
                    } else {
                        this.logger.error(`Failed to release booking ${booking.id}:`, err);
                    }
                }
            }

            this.logger.log(`✅ Auto-release complete: ${releasedCount} bookings processed`);
            return { released: releasedCount };

        } catch (err) {
            this.logger.error('Auto-release job failed:', err);
            return { released: 0, error: err.message };
        }
    }

    /**
     * Reminder job: Runs every hour
     * Sends reminders at T+6h, T+12h, T+24h after session completion
     */
    @Cron(CronExpression.EVERY_HOUR)
    async sendConfirmationReminders() {
        this.logger.log('📬 Running reminder job...');

        try {
            // Get system settings for reminder intervals
            const settings = await this.getSystemSettings();
            const reminderIntervals = [6, 12, 24]; // Hardcoded: reminderIntervals was removed from settings
            const now = new Date();

            let reminderCount = 0;

            // Process each reminder interval
            for (const hoursAfterCompletion of reminderIntervals) {
                // Find bookings where:
                // - Session was completed X hours ago
                // - Still in PENDING_CONFIRMATION status
                // - No reminder flag set for this interval
                const targetCompletionTime = new Date(
                    now.getTime() - hoursAfterCompletion * 60 * 60 * 1000
                );

                const bookingsNeedingReminder = await this.prisma.booking.findMany({
                    where: {
                        status: 'PENDING_CONFIRMATION',
                        disputeWindowOpensAt: {
                            lte: targetCompletionTime,
                            gte: new Date(targetCompletionTime.getTime() - 60 * 60 * 1000) // Within 1-hour window
                        },
                        disputeReminderSentAt: null, // No reminder sent yet
                        dispute: null
                    },
                    include: {
                        bookedByUser: true,
                        teacherProfile: { include: { user: true } },
                    },
                    take: 50 // Limit batch size
                });

                for (const booking of bookingsNeedingReminder) {
                    try {
                        // Calculate hours remaining until auto-release
                        const hoursRemaining = booking.disputeWindowClosesAt
                            ? Math.round((booking.disputeWindowClosesAt.getTime() - now.getTime()) / (1000 * 60 * 60))
                            : 0;

                        if (hoursRemaining > 0) {
                            // Mark reminder as sent
                            await this.prisma.booking.update({
                                where: { id: booking.id },
                                data: { disputeReminderSentAt: now }
                            });

                            // Send notification via NotificationService
                            await this.notificationService.notifyDisputeWindowReminder({
                                bookingId: booking.id,
                                parentUserId: booking.bookedByUserId,
                                hoursRemaining,
                                teacherName: booking.teacherProfile.user.phoneNumber || 'teacher',
                            });

                            reminderCount++;
                            this.logger.log(`⏰ Sent reminder for booking ${booking.id.slice(0, 8)} (${hoursRemaining}h remaining)`);
                        }
                    } catch (err) {
                        this.logger.error(`Failed to send reminder for booking ${booking.id}:`, err);
                    }
                }
            }

            this.logger.log(`✅ Reminders sent: ${reminderCount}`);
            return { reminders: reminderCount };

        } catch (err) {
            this.logger.error('Reminder job failed:', err);
            return { reminders: 0, error: err.message };
        }
    }

    // Helper: Get system settings (with defaults)
    private async getSystemSettings() {
        let settings = await this.prisma.systemSettings.findUnique({
            where: { id: 'default' }
        });

        if (!settings) {
            settings = await this.prisma.systemSettings.create({
                data: {
                    id: 'default',
                    confirmationWindowHours: 48,
                    autoReleaseEnabled: true,
                    reminderHoursBeforeRelease: 6,
                    defaultCommissionRate: 0.18
                }
            });
        }

        return settings;
    }

    /**
     * Manual trigger for testing: Force run auto-release
     * Can be called from admin endpoint
     */
    async forceAutoRelease() {
        return this.processAutoReleases();
    }
}
