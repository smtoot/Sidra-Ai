import { Button, Section, Text } from '@react-email/components';
import * as React from 'react';
import { BaseEmail } from '../BaseEmail';

interface RegistrationOtpProps {
  otp: string;
  email: string;
  expiryMinutes: number;
}

export const RegistrationOtp: React.FC<RegistrationOtpProps> = ({
  otp,
  email,
  expiryMinutes = 10,
}) => {
  return (
    <BaseEmail preview={`رمز التحقق الخاص بك: ${otp}`} title="مرحباً بك في سدرة!">
      <Text style={greeting}>أهلاً بك،</Text>

      <Text style={message}>
        شكراً لتسجيلك في منصة سدرة التعليمية. لإكمال التسجيل، يرجى إدخال رمز التحقق
        التالي:
      </Text>

      {/* OTP Box */}
      <Section style={otpBox}>
        <Text style={otpText}>{otp}</Text>
      </Section>

      <Text style={expiryText}>
        ⏱️ هذا الرمز صالح لمدة {expiryMinutes} دقائق فقط.
      </Text>

      <Text style={warningText}>
        🔒 لا تشارك هذا الرمز مع أي شخص. فريق سدرة لن يطلب منك هذا الرمز أبداً.
      </Text>

      <Section style={divider} />

      {/* English version for accessibility */}
      <Text style={englishText}>
        Thank you for registering with Sidra. To complete your registration,
        please enter the following verification code:
      </Text>

      <Text style={expiryTextEn}>
        This code is valid for {expiryMinutes} minutes only.
      </Text>

      <Text style={footerNote}>
        إذا لم تقم بطلب هذا الرمز، يرجى تجاهل هذا البريد.
        <br />
        If you didn't request this code, please ignore this email.
      </Text>
    </BaseEmail>
  );
};

// Styles
const greeting = {
  fontSize: '16px',
  color: '#1f2937', // Text Main
  margin: '0 0 20px 0',
  fontFamily: 'Tajawal, Cairo, Arial, sans-serif',
};

const message = {
  fontSize: '15px',
  color: '#4b5563', // Text Body
  lineHeight: '1.6',
  margin: '0 0 25px 0',
  fontFamily: 'Tajawal, Cairo, Arial, sans-serif',
};

const otpBox = {
  backgroundColor: '#f8fafc',
  border: '2px dashed #003366', // Brand Primary
  borderRadius: '12px',
  padding: '30px 20px',
  textAlign: 'center' as const,
  margin: '25px 0',
};

const otpText = {
  fontSize: '36px',
  fontWeight: 'bold',
  color: '#003366', // Brand Primary
  letterSpacing: '8px',
  margin: '0',
  fontFamily: 'monospace',
};

const expiryText = {
  fontSize: '14px',
  color: '#6b7280', // Text Subtle
  textAlign: 'center' as const,
  margin: '20px 0',
  fontFamily: 'Tajawal, Cairo, Arial, sans-serif',
};

const warningText = {
  fontSize: '13px',
  color: '#991b1b', // Red 800
  backgroundColor: '#fef2f2',
  border: '1px solid #fee2e2',
  borderRadius: '6px',
  padding: '12px 16px',
  margin: '20px 0',
  fontFamily: 'Tajawal, Cairo, Arial, sans-serif',
};

const divider = {
  borderTop: '1px solid #e5e7eb',
  margin: '30px 0',
};

const englishText = {
  fontSize: '14px',
  color: '#6b7280', // Text Subtle
  lineHeight: '1.6',
  margin: '0 0 15px 0',
  direction: 'ltr' as const,
  fontFamily: 'Tajawal, Cairo, Arial, sans-serif',
};

const expiryTextEn = {
  fontSize: '13px',
  color: '#6b7280', // Text Subtle
  margin: '10px 0 20px 0',
  direction: 'ltr' as const,
  fontFamily: 'Tajawal, Cairo, Arial, sans-serif',
};

const footerNote = {
  fontSize: '12px',
  color: '#9ca3af', // Gray 400
  textAlign: 'center' as const,
  margin: '30px 0 0 0',
  lineHeight: '1.6',
  fontFamily: 'Tajawal, Cairo, Arial, sans-serif',
};

export default RegistrationOtp;
