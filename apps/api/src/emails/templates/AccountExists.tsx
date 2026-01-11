import { Button, Section, Text } from '@react-email/components';
import * as React from 'react';
import { BaseEmail } from '../BaseEmail';

interface AccountExistsProps {
  email: string;
  loginUrl: string;
}

export const AccountExists: React.FC<AccountExistsProps> = ({
  email,
  loginUrl,
}) => {
  return (
    <BaseEmail preview="تنبيه أمني - الحساب موجود بالفعل" title="تنبيه أمني">
      <Text style={greeting}>مرحباً،</Text>

      <Section style={noticeBox}>
        <Text style={noticeText}>
          🔔 لقد حاولت التسجيل باستخدام البريد الإلكتروني:{' '}
          <strong>{email}</strong>
        </Text>

        <Text style={noticeText}>
          يبدو أن هذا البريد الإلكتروني مستخدم بالفعل في حساب سدرة موجود.
        </Text>
      </Section>

      <Text style={message}>
        إذا كنت تمتلك هذا الحساب، يمكنك تسجيل الدخول مباشرة:
      </Text>

      <Section style={ctaSection}>
        <Button href={loginUrl} style={button}>
          تسجيل الدخول
        </Button>
      </Section>

      <Section style={helpSection}>
        <Text style={helpTitle}>❓ هل نسيت كلمة المرور؟</Text>
        <Text style={helpText}>
          يمكنك إعادة تعيين كلمة المرور من صفحة تسجيل الدخول باستخدام خيار "نسيت كلمة
          المرور".
        </Text>
      </Section>

      <Section style={divider} />

      {/* English version */}
      <Text style={englishText}>
        <strong>Security Alert</strong>
        <br />
        You attempted to register with the email: <strong>{email}</strong>
      </Text>

      <Text style={englishText}>
        This email is already associated with an existing Sidra account. If this
        is your account, please log in instead.
      </Text>

      <Text style={footerNote}>
        إذا لم تحاول التسجيل، يمكنك تجاهل هذا البريد. حسابك آمن.
        <br />
        If you didn't attempt to register, please ignore this email. Your account
        is secure.
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

const noticeBox = {
  backgroundColor: '#fef3c7',
  border: '2px solid #f59e0b',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};

const noticeText = {
  fontSize: '15px',
  color: '#1f2937', // Text Main
  lineHeight: '1.6',
  margin: '0 0 10px 0',
  fontFamily: 'Tajawal, Cairo, Arial, sans-serif',
};

const message = {
  fontSize: '15px',
  color: '#4b5563', // Text Body
  lineHeight: '1.6',
  margin: '20px 0',
  fontFamily: 'Tajawal, Cairo, Arial, sans-serif',
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '25px 0',
};

const button = {
  backgroundColor: '#D4A056', // Brand Accent (Gold)
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  fontFamily: 'Tajawal, Cairo, Arial, sans-serif',
};

const helpSection = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '20px',
  margin: '25px 0',
};

const helpTitle = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#1f2937', // Text Main
  margin: '0 0 10px 0',
  fontFamily: 'Tajawal, Cairo, Arial, sans-serif',
};

const helpText = {
  fontSize: '14px',
  color: '#6b7280', // Text Subtle
  lineHeight: '1.6',
  margin: '0',
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

const footerNote = {
  fontSize: '12px',
  color: '#9ca3af', // Gray 400
  textAlign: 'center' as const,
  margin: '30px 0 0 0',
  lineHeight: '1.6',
  fontFamily: 'Tajawal, Cairo, Arial, sans-serif',
};

export default AccountExists;
