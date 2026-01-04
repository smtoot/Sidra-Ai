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
    color: '#1e293b',
    margin: '20px 0 15px 0',
};

const paragraph = {
    fontSize: '14px',
    color: '#475569',
    lineHeight: '1.6',
    margin: '0 0 15px 0',
};

const reminderBox = {
    backgroundColor: '#dbeafe',
    borderRadius: '8px',
    padding: '15px',
    margin: '0 0 20px 0',
    textAlign: 'center' as const,
    border: '2px solid #0ea5e9',
};

const urgentBox = {
    backgroundColor: '#fef3c7',
    borderRadius: '8px',
    padding: '15px',
    margin: '0 0 20px 0',
    textAlign: 'center' as const,
    border: '2px solid #f59e0b',
};

const urgentText = {
    fontSize: '18px',
    color: '#1e293b',
    margin: '0',
    fontWeight: 'bold',
};

const detailsBox = {
    backgroundColor: '#f1f5f9',
    borderRadius: '8px',
    padding: '20px',
    margin: '20px 0',
};

const detailValue = {
    fontSize: '16px',
    color: '#1e293b',
    margin: '0 0 10px 0',
};

const ctaSection = {
    textAlign: 'center' as const,
    margin: '25px 0',
};

const button = {
    backgroundColor: '#10b981',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '14px 32px',
};

const tipsBox = {
    backgroundColor: '#f0fdf4',
    borderRadius: '8px',
    padding: '15px 20px',
    margin: '20px 0 0 0',
    borderRight: '3px solid #10b981',
};

const tipsTitle = {
    fontSize: '14px',
    color: '#15803d',
    margin: '0 0 10px 0',
    fontWeight: 'bold',
};

const tipItem = {
    fontSize: '13px',
    color: '#166534',
    margin: '5px 0',
};

export default SessionReminder;
