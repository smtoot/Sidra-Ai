import {
    Button,
    Section,
    Text,
} from '@react-email/components';
import * as React from 'react';
import { BaseEmail } from '../BaseEmail';

interface SessionReminderProps {
    studentName: string;
    teacherName: string;
    subjectName: string;
    sessionTime: string;
    meetingLink?: string;
    hoursUntil: number;
}

export const SessionReminder: React.FC<SessionReminderProps> = ({
    studentName,
    teacherName,
    subjectName,
    sessionTime,
    meetingLink,
    hoursUntil,
}) => {
    const isUrgent = hoursUntil <= 1;

    return (
        <BaseEmail
            preview={`تذكير: حصتك في ${subjectName} تبدأ خلال ${hoursUntil} ساعة`}
            title={isUrgent ? '⏰ حصتك تبدأ قريباً!' : '📅 تذكير بحصتك القادمة'}
        >
            <Section style={isUrgent ? urgentBox : reminderBox}>
                <Text style={urgentText}>
                    {isUrgent
                        ? '🔔 حصتك تبدأ خلال ساعة واحدة!'
                        : `🕐 حصتك تبدأ خلال ${hoursUntil} ساعة`}
                </Text>
            </Section>

            <Text style={greeting}>
                مرحباً {studentName}،
            </Text>

            <Text style={paragraph}>
                هذا تذكير بحصتك القادمة:
            </Text>

            <Section style={detailsBox}>
                <Text style={detailValue}>📚 {subjectName}</Text>
                <Text style={detailValue}>👨‍🏫 مع {teacherName}</Text>
                <Text style={detailValue}>🕒 {sessionTime}</Text>
            </Section>

            {meetingLink && (
                <Section style={ctaSection}>
                    <Button href={meetingLink} style={button}>
                        {isUrgent ? 'انضم الآن' : 'رابط الحصة'}
                    </Button>
                </Section>
            )}

            <Section style={tipsBox}>
                <Text style={tipsTitle}>💡 نصائح للاستعداد:</Text>
                <Text style={tipItem}>✓ تأكد من اتصالك بالإنترنت</Text>
                <Text style={tipItem}>✓ جهز أدواتك وملاحظاتك</Text>
                <Text style={tipItem}>✓ اختر مكاناً هادئاً للحصة</Text>
            </Section>
        </BaseEmail>
    );
};

// Styles
const greeting = {
    fontSize: '16px',
    color: '#1f293b', // Text Main
    margin: '20px 0 15px 0',
    fontFamily: 'Tajawal, Cairo, Arial, sans-serif',
};

const paragraph = {
    fontSize: '14px',
    color: '#4b5563', // Text Body
    lineHeight: '1.6',
    margin: '0 0 15px 0',
    fontFamily: 'Tajawal, Cairo, Arial, sans-serif',
};

const reminderBox = {
    backgroundColor: '#f0f9ff', // Light Blue bg
    borderRadius: '8px',
    padding: '16px',
    margin: '0 0 24px 0',
    textAlign: 'center' as const,
    border: '1px solid #003366', // Brand Primary border
};

const urgentBox = {
    backgroundColor: '#fffbeb', // Amber bg
    borderRadius: '8px',
    padding: '16px',
    margin: '0 0 24px 0',
    textAlign: 'center' as const,
    border: '1px solid #d97706', // Amber dark
};

const urgentText = {
    fontSize: '18px',
    color: '#1f293b', // Text Main
    margin: '0',
    fontWeight: 'bold',
    fontFamily: 'Tajawal, Cairo, Arial, sans-serif',
};

const detailsBox = {
    backgroundColor: '#FAFAFA',
    borderRadius: '8px',
    padding: '24px',
    margin: '24px 0',
    border: '1px solid #e5e7eb',
};

const detailValue = {
    fontSize: '16px',
    color: '#1f293b', // Text Main
    margin: '0 0 12px 0',
    fontFamily: 'Tajawal, Cairo, Arial, sans-serif',
    display: 'block',
};

const ctaSection = {
    textAlign: 'center' as const,
    margin: '32px 0',
};

const button = {
    backgroundColor: '#D4A056', // Brand Accent (Gold)
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '16px 32px',
    fontFamily: 'Tajawal, Cairo, Arial, sans-serif',
};

const tipsBox = {
    backgroundColor: '#f0fdf4', // Green bg (Success-like)
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0 0 0',
    borderRight: '4px solid #10b981',
};

const tipsTitle = {
    fontSize: '14px',
    color: '#15803d',
    margin: '0 0 12px 0',
    fontWeight: 'bold',
    fontFamily: 'Tajawal, Cairo, Arial, sans-serif',
};

const tipItem = {
    fontSize: '13px',
    color: '#166534',
    margin: '6px 0',
    fontFamily: 'Tajawal, Cairo, Arial, sans-serif',
};

export default SessionReminder;
