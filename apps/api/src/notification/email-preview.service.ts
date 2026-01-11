import { Injectable, Logger } from '@nestjs/common';
import { render } from '@react-email/render';
import * as React from 'react';

// Import templates
import { BookingConfirmation } from '../emails/templates/BookingConfirmation';
import { PaymentReceipt } from '../emails/templates/PaymentReceipt';
import { SessionReminder } from '../emails/templates/SessionReminder';
// TODO: OTP templates not yet committed
// import { RegistrationOtp } from '../emails/templates/RegistrationOtp';
// import { AccountExists } from '../emails/templates/AccountExists';
import { GenericNotification } from '../emails/templates/GenericNotification';

@Injectable()
export class EmailPreviewService {
  private readonly logger = new Logger(EmailPreviewService.name);

  /**
   * Get list of available templates with their IDs
   */
  getAvailableTemplates() {
    return [
      { id: 'booking-confirmation', name: 'Booking Confirmation' },
      { id: 'payment-receipt', name: 'Payment Receipt' },
      { id: 'session-reminder-urgent', name: 'Session Reminder (Urgent - 1h)' },
      {
        id: 'session-reminder-daily',
        name: 'Session Reminder (Standard - 24h)',
      },
      // TODO: OTP templates not yet committed
      // { id: 'registration-otp', name: 'Registration OTP' },
      // { id: 'account-exists', name: 'Account Exists Alert' },
      { id: 'generic-success', name: 'Generic Notification (Success)' },
      { id: 'generic-warning', name: 'Generic Notification (Warning)' },
    ];
  }

  /**
   * Render a specific template with dummy data
   */
  async renderTemplate(templateId: string): Promise<string> {
    try {
      let emailComponent;

      switch (templateId) {
        case 'booking-confirmation':
          emailComponent = React.createElement(BookingConfirmation, {
            studentName: 'أحمد محمد',
            teacherName: 'د. سارة علي',
            subjectName: 'الرياضيات - الصف الثالث',
            sessionDate: '2026-01-20',
            sessionTime: '10:00 صباحاً',
            meetingLink: 'https://meet.google.com/abc-defg-hij',
            bookingId: 'BK-123456',
          });
          break;

        case 'payment-receipt':
          emailComponent = React.createElement(PaymentReceipt, {
            recipientName: 'أحمد محمد',
            transactionId: 'TX-987654',
            amount: 25000,
            type: 'WALLET_TOPUP',
            description: 'شحن رصيد المحفظة',
            currentBalance: 50000,
            date: '2026-01-15',
          });
          break;

        case 'session-reminder-urgent':
          emailComponent = React.createElement(SessionReminder, {
            studentName: 'أحمد محمد',
            teacherName: 'د. سارة علي',
            subjectName: 'الفيزياء',
            sessionTime: '11:00 صباحاً',
            meetingLink: 'https://meet.google.com/xyz',
            hoursUntil: 1,
          });
          break;

        case 'session-reminder-daily':
          emailComponent = React.createElement(SessionReminder, {
            studentName: 'أحمد محمد',
            teacherName: 'د. سارة علي',
            subjectName: 'الكيمياء',
            sessionTime: '10:00 صباحاً',
            meetingLink: 'https://meet.google.com/xyz',
            hoursUntil: 24,
          });
          break;

        // TODO: OTP templates not yet committed
        // case 'registration-otp':
        //   emailComponent = React.createElement(RegistrationOtp, {
        //     otp: '123456',
        //     email: 'ahmed@example.com',
        //     expiryMinutes: 10,
        //   });
        //   break;

        // case 'account-exists':
        //   emailComponent = React.createElement(AccountExists, {
        //     email: 'ahmed@example.com',
        //     loginUrl: 'https://sidra.ai/login',
        //   });
        //   break;

        case 'generic-success':
          emailComponent = React.createElement(GenericNotification, {
            recipientName: 'أحمد محمد',
            title: 'تم تحديث البيانات بنجاح',
            message: 'تم حفظ تغييرات ملفك الشخصي بنجاح.',
            actionUrl: 'https://sidra.ai/profile',
            notificationType: 'success',
          });
          break;

        case 'generic-warning':
          emailComponent = React.createElement(GenericNotification, {
            recipientName: 'أحمد محمد',
            title: 'تنبيه انتهاء الاشتراك',
            message: 'سينتهي اشتراكك في الباقة الحالية خلال 3 أيام.',
            actionUrl: 'https://sidra.ai/subscription',
            actionLabel: 'تجديد الاشتراك',
            notificationType: 'warning',
          });
          break;

        default:
          throw new Error(`Unknown template ID: ${templateId}`);
      }

      return render(emailComponent);
    } catch (error) {
      this.logger.error(`Failed to render preview for ${templateId}`, error);
      throw error;
    }
  }
}
