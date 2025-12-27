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
     * Meeting Link Reminder: Runs every 15 minutes
     * Notifies teacher if meeting link is missing 30 minutes before session
     */
    @Cron(CronExpression.EVERY_10_MINUTES)
    async checkMissingMeetingLinks() {
        this.logger.log('🔗 Checking for missing meeting links...');

        try {
            const now = new Date();
            const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
            const twentyMinutesFromNow = new Date(now.getTime() + 20 * 60 * 1000);

            // Find SCHEDULED sessions starting in 20-30 minutes without meeting link
            const sessionsNeedingLink = await this.prisma.booking.findMany({
                where: {
                    status: 'SCHEDULED',
                    startTime: {
                        gte: twentyMinutesFromNow,
                        lte: thirtyMinutesFromNow
                    },
                    OR: [
                        { meetingLink: null },
                        { meetingLink: '' }
                    ]
                },
                include: {
                    teacherProfile: { include: { user: true } },
                },
                take: 50
            });

            let notificationCount = 0;
            for (const booking of sessionsNeedingLink) {
                try {
                    // Send notification to teacher
                    await this.notificationService.notifyUser({
                        userId: booking.teacherProfile.userId,
                        title: 'تنبيه: رابط الحصة مفقود',
                        message: `لديك حصة خلال 30 دقيقة ولم تقم بإضافة رابط الاجتماع. يرجى إضافة الرابط الآن.`,
                        type: 'URGENT',
                        link: `/teacher/sessions/${booking.id}`,
                        dedupeKey: `MISSING_LINK:${booking.id}`,
                        metadata: { bookingId: booking.id }
                    });

                    notificationCount++;
                    this.logger.log(`🔔 Notified teacher about missing link for booking ${booking.id.slice(0, 8)}`);
                } catch (err) {
                    this.logger.error(`Failed to notify teacher for booking ${booking.id}:`, err);
                }
            }

            this.logger.log(`✅ Meeting link check complete: ${notificationCount} notifications sent`);
            return { notified: notificationCount };

        } catch (err) {
            this.logger.error('Meeting link check failed:', err);
            return { notified: 0, error: err.message };
        }
    }

    /**
     * Stale Session Alert: Runs every hour
     * Alerts admin when sessions end but no completion action taken after 6 hours
     */
    @Cron(CronExpression.EVERY_HOUR)
    async alertStaleSession() {
        this.logger.log('⚠️  Checking for stale sessions...');

        try {
            const now = new Date();
            const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

            // Find SCHEDULED sessions that ended 6+ hours ago (teacher forgot to complete)
            const staleSessions = await this.prisma.booking.findMany({
                where: {
                    status: 'SCHEDULED',
                    endTime: { lte: sixHoursAgo }
                },
                include: {
                    teacherProfile: { include: { user: true } },
                    bookedByUser: true
                },
                take: 50
            });

            if (staleSessions.length === 0) {
                this.logger.log('✓ No stale sessions found');
                return { stale: 0 };
            }

            // Get admin users
            const admins = await this.prisma.user.findMany({
                where: { role: 'ADMIN' }
            });

            let alertCount = 0;
            for (const booking of staleSessions) {
                try {
                    const hoursStale = Math.round((now.getTime() - new Date(booking.endTime).getTime()) / (1000 * 60 * 60));

                    // Alert all admins
                    for (const admin of admins) {
                        await this.notificationService.notifyUser({
                            userId: admin.id,
                            title: `حصة عالقة - ${hoursStale} ساعات بعد الانتهاء`,
                            message: `الحصة ${booking.id.slice(0, 8)} انتهت منذ ${hoursStale} ساعات ولم يتم تأكيد الإكمال من المعلم أو الطالب. يرجى التحقق.`,
                            type: 'ADMIN_ALERT',
                            link: `/admin/bookings/${booking.id}`,
                            dedupeKey: `STALE_SESSION:${booking.id}:${hoursStale}h`,
                            metadata: { bookingId: booking.id, hoursStale }
                        });
                    }

                    alertCount++;
                    this.logger.log(`🚨 Alerted admins about stale session ${booking.id.slice(0, 8)} (${hoursStale}h stale)`);
                } catch (err) {
                    this.logger.error(`Failed to alert for stale session ${booking.id}:`, err);
                }
            }

            this.logger.log(`✅ Stale session check complete: ${alertCount} sessions flagged`);
            return { stale: alertCount };

        } catch (err) {
            this.logger.error('Stale session check failed:', err);
            return { stale: 0, error: err.message };
        }
    }

    /**
     * Manual trigger for testing: Force run auto-release
     * Can be called from admin endpoint
     */
    async forceAutoRelease() {
        return this.processAutoReleases();
    }
}
