import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

// Use string literals for new enums until Prisma client is regenerated in API workspace
const EmailStatus = {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    SENT: 'SENT',
    FAILED: 'FAILED',
} as const;

const MAX_RETRY_ATTEMPTS = 5;
const MAX_BACKOFF_MINUTES = 60; // 1 hour cap

@Injectable()
export class EmailOutboxWorker {
    private readonly logger = new Logger(EmailOutboxWorker.name);
    private isProcessing = false;

    constructor(private prisma: PrismaService) { }

    /**
     * Process pending emails every 30 seconds.
     * Uses atomic claim to prevent duplicate processing.
     */
    @Cron(CronExpression.EVERY_30_SECONDS)
    async processOutbox() {
        // Prevent concurrent runs
        if (this.isProcessing) {
            return;
        }

        this.isProcessing = true;

        try {
            await this.processPendingEmails();
        } catch (error) {
            this.logger.error('Error processing email outbox', error);
        } finally {
            this.isProcessing = false;
        }
    }

    private async processPendingEmails() {
        const now = new Date();

        // Fetch and claim pending emails atomically
        // Only fetch emails that are ready to be processed
        const pendingEmails = await this.prisma.emailOutbox.findMany({
            where: {
                status: EmailStatus.PENDING,
                OR: [
                    { nextRetryAt: null },
                    { nextRetryAt: { lte: now } }
                ]
            },
            take: 10, // Process in batches
            orderBy: { createdAt: 'asc' }
        });

        if (pendingEmails.length === 0) {
            return;
        }

        this.logger.log(`Processing ${pendingEmails.length} pending emails`);

        for (const email of pendingEmails) {
            // Claim the email atomically (set to PROCESSING)
            const claimed = await this.prisma.emailOutbox.updateMany({
                where: {
                    id: email.id,
                    status: EmailStatus.PENDING, // Only if still PENDING
                },
                data: {
                    status: EmailStatus.PROCESSING,
                }
            });

            // If another worker claimed it, skip
            if (claimed.count === 0) {
                continue;
            }

            try {
                // Attempt to send email
                await this.sendEmail(email);

                // Mark as SENT
                await this.prisma.emailOutbox.update({
                    where: { id: email.id },
                    data: {
                        status: EmailStatus.SENT,
                        sentAt: new Date(),
                    }
                });

                this.logger.log(`Email sent: ${email.id} to ${email.to}`);

            } catch (error: any) {
                const attempts = email.attempts + 1;
                const errorMessage = this.truncateError(error.message || 'Unknown error');

                if (attempts >= MAX_RETRY_ATTEMPTS) {
                    // Max retries reached -> FAILED
                    await this.prisma.emailOutbox.update({
                        where: { id: email.id },
                        data: {
                            status: EmailStatus.FAILED,
                            attempts,
                            lastAttempt: new Date(),
                            errorMessage,
                        }
                    });

                    this.logger.error(`Email permanently failed after ${attempts} attempts: ${email.id}`);
                } else {
                    // Calculate exponential backoff: 2^attempts minutes, capped at 1 hour
                    const backoffMinutes = Math.min(Math.pow(2, attempts), MAX_BACKOFF_MINUTES);
                    const nextRetryAt = new Date(Date.now() + backoffMinutes * 60 * 1000);

                    await this.prisma.emailOutbox.update({
                        where: { id: email.id },
                        data: {
                            status: EmailStatus.PENDING,
                            attempts,
                            lastAttempt: new Date(),
                            nextRetryAt,
                            errorMessage,
                        }
                    });

                    this.logger.warn(`Email failed, will retry in ${backoffMinutes} min: ${email.id}`);
                }
            }
        }
    }

    /**
     * Actually send the email using SendGrid.
     * If SENDGRID_API_KEY is not configured, logs only (graceful degradation).
     */
    private async sendEmail(email: { to: string; subject: string; templateId: string; payload: any }): Promise<void> {
        const apiKey = process.env.SENDGRID_API_KEY;
        const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@sidra-ai.com';

        // If no SendGrid API key, fall back to logging (phone-first: email is optional)
        if (!apiKey) {
            this.logger.warn(
                `SENDGRID_API_KEY not configured - email not sent. ` +
                `To: ${email.to}, Subject: ${email.subject}, Template: ${email.templateId}`
            );
            return;
        }

        try {
            const sgMail = require('@sendgrid/mail');
            sgMail.setApiKey(apiKey);

            const msg = {
                to: email.to,
                from: fromEmail,
                subject: email.subject,
                templateId: email.templateId,
                dynamicTemplateData: email.payload,
            };

            await sgMail.send(msg);
            this.logger.log(`Email sent via SendGrid to: ${email.to}`);
        } catch (error: any) {
            this.logger.error(`SendGrid API error: ${error.message}`, error.stack);
            throw error; // Re-throw to trigger retry logic
        }
    }

    /**
     * Truncate error message to prevent DB bloat.
     */
    private truncateError(message: string): string {
        const MAX_LENGTH = 500;
        return message.length > MAX_LENGTH ? message.substring(0, MAX_LENGTH) + '...' : message;
    }
}
