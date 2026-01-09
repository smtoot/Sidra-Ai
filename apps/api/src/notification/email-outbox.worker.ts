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
  private lastProcessingStart = 0;

  constructor(private prisma: PrismaService) {}

  /**
   * Process pending emails every 30 seconds.
   * Uses atomic claim to prevent duplicate processing.
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async processOutbox() {
    // STABILITY FIX: Prevent concurrent runs with timeout protection
    // If processing takes longer than 2 minutes, allow a new run (indicates stuck job)
    const now = Date.now();
    const processingTimeout = 2 * 60 * 1000; // 2 minutes

    if (this.isProcessing) {
      if (now - this.lastProcessingStart > processingTimeout) {
        this.logger.warn(
          'Previous email processing exceeded timeout, allowing new run',
        );
        this.isProcessing = false;
      } else {
        return;
      }
    }

    this.isProcessing = true;
    this.lastProcessingStart = now;

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
      const msg = `RESEND_API_KEY not configured - cannot send email to ${email.to}`;
      this.logger.warn(msg);
      throw new Error(msg);
    }

    try {
      const { Resend } = require('resend');
      const resend = new Resend(apiKey);

      // Resend doesn't use template IDs like SendGrid
      // Instead, we'll render React Email templates with the payload data
      const htmlContent = await this.renderEmailTemplate(
        email.templateId,
        email.payload,
      );

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
   * Render email content using React Email templates
   * Maps template IDs to the appropriate template component
   */
  private async renderEmailTemplate(
    templateId: string,
    payload: any,
  ): Promise<string> {
    const { render } = require('@react-email/render');
    const React = require('react');

    try {
      let emailComponent;

      switch (templateId) {
        case 'booking-confirmation':
        case 'booking_approved':
          const { BookingConfirmation } = require('../emails');
          emailComponent = React.createElement(BookingConfirmation, {
            studentName: payload.studentName || 'الطالب',
            teacherName: payload.teacherName || 'المعلم',
            subjectName: payload.subjectName || 'المادة',
            sessionDate:
              payload.sessionDate || new Date().toLocaleDateString('ar'),
            sessionTime: payload.sessionTime || 'وقت الحصة',
            meetingLink: payload.meetingLink,
            bookingId: payload.bookingId || '',
          });
          break;

        case 'payment-receipt':
        case 'payment_success':
        case 'wallet_topup':
          const { PaymentReceipt } = require('../emails');
          emailComponent = React.createElement(PaymentReceipt, {
            recipientName:
              payload.recipientName || payload.userName || 'المستخدم',
            transactionId: payload.transactionId || payload.readableId || 'N/A',
            amount: parseFloat(payload.amount || 0),
            type: payload.type || 'WALLET_TOPUP',
            description:
              payload.description || payload.message || 'معاملة مالية',
            currentBalance: parseFloat(
              payload.currentBalance || payload.balance || 0,
            ),
            date: payload.date || new Date().toLocaleString('ar'),
          });
          break;

        case 'session-reminder':
        case 'session_reminder_24h':
        case 'session_reminder_1h':
          const { SessionReminder } = require('../emails');
          const hoursUntil = templateId.includes('1h') ? 1 : 24;
          emailComponent = React.createElement(SessionReminder, {
            studentName: payload.studentName || 'الطالب',
            teacherName: payload.teacherName || 'المعلم',
            subjectName: payload.subjectName || 'المادة',
            sessionTime: payload.sessionTime || 'وقت الحصة',
            meetingLink: payload.meetingLink,
            hoursUntil,
          });
          break;

        default:
          // Use generic notification for all other cases
          const { GenericNotification } = require('../emails');
          emailComponent = React.createElement(GenericNotification, {
            recipientName:
              payload.recipientName || payload.userName || 'المستخدم',
            title: payload.title || 'إشعار من سدرة',
            message: payload.message || '',
            actionUrl: payload.link || payload.actionUrl,
            actionLabel: payload.actionLabel || 'عرض التفاصيل',
            notificationType: this.getNotificationType(templateId),
          });
      }

      // Render to HTML
      return render(emailComponent);
    } catch (error) {
      this.logger.error(
        `Failed to render email template: ${templateId}`,
        error,
      );
      // Fallback to basic HTML
      return this.buildBasicEmailHtml(templateId, payload);
    }
  }

  /**
   * Determine notification type from template ID
   */
  private getNotificationType(
    templateId: string,
  ): 'info' | 'success' | 'warning' | 'error' {
    if (templateId.includes('success') || templateId.includes('approved'))
      return 'success';
    if (templateId.includes('warning') || templateId.includes('reminder'))
      return 'warning';
    if (
      templateId.includes('error') ||
      templateId.includes('failed') ||
      templateId.includes('rejected')
    )
      return 'error';
    return 'info';
  }

  /**
   * Fallback: Build basic HTML email (if React Email fails)
   * Kept for backward compatibility and error recovery
   */
  private buildBasicEmailHtml(subject: string, payload: any): string {
    const { title, message, link } = payload;

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #0ea5e9; padding: 30px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 32px;">سدرة</h1>
            <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">منصة التعليم الإلكترونية</p>
          </div>
          <div style="padding: 40px 20px;">
            ${title ? `<h2 style="color: #1e293b; margin: 0 0 20px 0;">${title}</h2>` : ''}
            ${message ? `<p style="color: #475569; line-height: 1.6; margin: 0 0 20px 0;">${message}</p>` : ''}
            ${link ? `<p style="text-align: center;"><a href="${link}" style="display: inline-block; background-color: #0ea5e9; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">عرض التفاصيل</a></p>` : ''}
          </div>
          <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 12px; margin: 5px 0;">هذا البريد الإلكتروني مرسل من منصة سدرة</p>
            <p style="color: #64748b; font-size: 12px; margin: 5px 0;">© ${new Date().getFullYear()} سدرة. جميع الحقوق محفوظة.</p>
          </div>
        </div>
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
