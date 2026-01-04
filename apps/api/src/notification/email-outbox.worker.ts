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
    const pendingEmails = await this.prisma.email_outbox.findMany({
      where: {
        status: EmailStatus.PENDING,
        OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
      },
      take: 10, // Process in batches
      orderBy: { createdAt: 'asc' },
    });

    if (pendingEmails.length === 0) {
      return;
    }

    this.logger.log(`Processing ${pendingEmails.length} pending emails`);

    for (const email of pendingEmails) {
      // Claim the email atomically (set to PROCESSING)
      const claimed = await this.prisma.email_outbox.updateMany({
        where: {
          id: email.id,
          status: EmailStatus.PENDING, // Only if still PENDING
        },
        data: {
          status: EmailStatus.PROCESSING,
        },
      });

      // If another worker claimed it, skip
      if (claimed.count === 0) {
        continue;
      }

      try {
        // Attempt to send email
        await this.sendEmail(email);

        // Mark as SENT
        await this.prisma.email_outbox.update({
          where: { id: email.id },
          data: {
            status: EmailStatus.SENT,
            sentAt: new Date(),
          },
        });

        this.logger.log(`Email sent: ${email.id} to ${email.to}`);
      } catch (error: any) {
        const attempts = email.attempts + 1;
        const errorMessage = this.truncateError(
          error.message || 'Unknown error',
        );

        if (attempts >= MAX_RETRY_ATTEMPTS) {
          // Max retries reached -> FAILED
          await this.prisma.email_outbox.update({
            where: { id: email.id },
            data: {
              status: EmailStatus.FAILED,
              attempts,
              lastAttempt: new Date(),
              errorMessage,
            },
          });

          this.logger.error(
            `Email permanently failed after ${attempts} attempts: ${email.id}`,
          );
        } else {
          // Calculate exponential backoff: 2^attempts minutes, capped at 1 hour
          const backoffMinutes = Math.min(
            Math.pow(2, attempts),
            MAX_BACKOFF_MINUTES,
          );
          const nextRetryAt = new Date(Date.now() + backoffMinutes * 60 * 1000);

          await this.prisma.email_outbox.update({
            where: { id: email.id },
            data: {
              status: EmailStatus.PENDING,
              attempts,
              lastAttempt: new Date(),
              nextRetryAt,
              errorMessage,
            },
          });

          this.logger.warn(
            `Email failed, will retry in ${backoffMinutes} min: ${email.id}`,
          );
        }
      }
    }
  }

  /**
   * Actually send the email using Resend.
   * If RESEND_API_KEY is not configured, logs only (graceful degradation).
   */
  private async sendEmail(email: {
    to: string;
    subject: string;
    templateId: string;
    payload: any;
  }): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    // If no Resend API key, fall back to logging
    if (!apiKey) {
      this.logger.warn(
        `RESEND_API_KEY not configured - email not sent. ` +
        `To: ${email.to}, Subject: ${email.subject}, Template: ${email.templateId}`,
      );
      return;
    }

    try {
      const { Resend } = require('resend');
      const resend = new Resend(apiKey);

      // Resend doesn't use template IDs like SendGrid
      // Instead, we'll send a simple HTML email with the payload data
      // You can later integrate with React Email templates
      const htmlContent = this.buildEmailHtml(email.subject, email.payload);

      const data = await resend.emails.send({
        from: fromEmail,
        to: email.to,
        subject: email.subject,
        html: htmlContent,
      });

      this.logger.log(`Email sent via Resend to: ${email.to}, ID: ${data.id}`);
    } catch (error: any) {
      this.logger.error(`Resend API error: ${error.message}`, error.stack);
      throw error; // Re-throw to trigger retry logic
    }
  }

  /**
   * Build simple HTML email from payload
   * TODO: Replace with proper email templates (React Email)
   */
  private buildEmailHtml(subject: string, payload: any): string {
    const entries = Object.entries(payload)
      .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">${subject}</h2>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
            ${entries}
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            هذا بريد إلكتروني تلقائي من منصة سدرة - This is an automated email from Sidra Platform
          </p>
        </body>
      </html>
    `;
  }

  /**
   * Truncate error message to prevent DB bloat.
   */
  private truncateError(message: string): string {
    const MAX_LENGTH = 500;
    return message.length > MAX_LENGTH
      ? message.substring(0, MAX_LENGTH) + '...'
      : message;
  }
}
