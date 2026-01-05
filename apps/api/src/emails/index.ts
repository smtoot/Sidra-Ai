// Export all email templates
export { BaseEmail } from './BaseEmail';
export { BookingConfirmation } from './templates/BookingConfirmation';
export { PaymentReceipt } from './templates/PaymentReceipt';
export { SessionReminder } from './templates/SessionReminder';
export { GenericNotification } from './templates/GenericNotification';

// Re-export render function from React Email
export { render } from '@react-email/render';
