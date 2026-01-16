
import { render } from '@react-email/render';
import * as fs from 'fs';
import * as path from 'path';
import 'reflect-metadata';
import * as React from 'react';

// Import templates directly
import { BookingConfirmation } from '../src/emails/templates/BookingConfirmation';
import { PaymentReceipt } from '../src/emails/templates/PaymentReceipt';
import { SessionReminder } from '../src/emails/templates/SessionReminder';
// TODO: OTP templates not yet committed to develop branch
// import { RegistrationOtp } from '../src/emails/templates/RegistrationOtp';
// import { AccountExists } from '../src/emails/templates/AccountExists';
import { GenericNotification } from '../src/emails/templates/GenericNotification';

async function generatePreviews() {
    const outputDir = path.join(__dirname, '../email-previews');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('Generating email previews...');

    // Booking Confirmation
    const bookingHtml = await render(
        React.createElement(BookingConfirmation, {
            studentName: 'أحمد محمد',
            teacherName: 'د. سارة علي',
            subjectName: 'الرياضيات - الصف الثالث',
            sessionDate: '2025-01-20',
            sessionTime: '10:00 صباحاً',
            meetingLink: 'https://meet.google.com/abc-defg-hij',
            bookingId: 'BK-123456'
        })
    );
    fs.writeFileSync(path.join(outputDir, 'booking-confirmation.html'), bookingHtml);
    console.log('Generated booking-confirmation.html');

    // Payment Receipt
    const paymentHtml = await render(
        React.createElement(PaymentReceipt, {
            recipientName: 'أحمد محمد',
            transactionId: 'TX-987654',
            amount: 25000,
            type: 'WALLET_TOPUP',
            description: 'شحن رصيد المحفظة',
            currentBalance: 50000,
            date: '2025-01-15'
        })
    );
    fs.writeFileSync(path.join(outputDir, 'payment-receipt.html'), paymentHtml);
    console.log('Generated payment-receipt.html');

    // Session Reminder (Urgent)
    const urgentReminderHtml = await render(
        React.createElement(SessionReminder, {
            studentName: 'أحمد محمد',
            teacherName: 'د. سارة علي',
            subjectName: 'الفيزياء',
            sessionTime: '11:00 صباحاً',
            meetingLink: 'https://meet.google.com/xyz',
            hoursUntil: 1
        })
    );
    fs.writeFileSync(path.join(outputDir, 'session-reminder-urgent.html'), urgentReminderHtml);
    console.log('Generated session-reminder-urgent.html');

    // TODO: OTP templates not yet committed to develop branch
    // // Registration OTP
    // const otpHtml = await render(
    //     React.createElement(RegistrationOtp, {
    //         otp: '123456',
    //         email: 'ahmed@example.com',
    //         expiryMinutes: 10
    //     })
    // );
    // fs.writeFileSync(path.join(outputDir, 'registration-otp.html'), otpHtml);
    // console.log('Generated registration-otp.html');

    // // Account Exists
    // const accountExistsHtml = await render(
    //     React.createElement(AccountExists, {
    //         email: 'ahmed@example.com',
    //         loginUrl: 'https://sidra.ai/login'
    //     })
    // );
    // fs.writeFileSync(path.join(outputDir, 'account-exists.html'), accountExistsHtml);
    // console.log('Generated account-exists.html');

    // Generic Notification
    const genericHtml = await render(
        React.createElement(GenericNotification, {
            recipientName: 'أحمد محمد',
            title: 'تم تحديث سياسة الخصوصية',
            message: 'نود إعلامك بأنه تم تحديث سياسة الخصوصية الخاصة بنا.\nيرجى مراجعة التغييرات الجديدة.',
            actionUrl: 'https://sidra.ai/privacy',
            notificationType: 'info'
        })
    );
    fs.writeFileSync(path.join(outputDir, 'generic-notification.html'), genericHtml);
    console.log('Generated generic-notification.html');

    console.log('All previews generated in apps/api/email-previews/');
}

generatePreviews().catch(console.error);
