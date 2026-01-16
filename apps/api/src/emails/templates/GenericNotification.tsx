import {
    Button,
    Section,
    Text,
} from '@react-email/components';
import * as React from 'react';
import { BaseEmail } from '../BaseEmail';

interface GenericNotificationProps {
    recipientName: string;
    title: string;
    message: string;
    actionUrl?: string;
    actionLabel?: string;
    notificationType?: 'info' | 'success' | 'warning' | 'error';
}

export const GenericNotification: React.FC<GenericNotificationProps> = ({
    recipientName,
    title,
    message,
    actionUrl,
    actionLabel = 'عرض التفاصيل',
    notificationType = 'info',
}) => {
    const getTypeStyles = () => {
        switch (notificationType) {
            case 'success':
                return { bg: '#f0fdf4', border: '#10b981', emoji: '✅' };
            case 'warning':
                return { bg: '#fffbeb', border: '#f59e0b', emoji: '⚠️' };
            case 'error':
                return { bg: '#fef2f2', border: '#ef4444', emoji: '❌' };
            default:
                return { bg: '#f0f9ff', border: '#003366', emoji: 'ℹ️' }; // Info uses Brand Primary
        }
    };

    const typeStyles = getTypeStyles();

    return (
        <BaseEmail preview={title} title={`${typeStyles.emoji} ${title}`}>
            <Text style={greeting}>
                مرحباً {recipientName}،
            </Text>

            <Section
                style={{
                    ...notificationBox,
                    backgroundColor: typeStyles.bg,
                    borderRight: `4px solid ${typeStyles.border}`,
                }}
            >
                <Text style={messageText}>{message}</Text>
            </Section>

            {actionUrl && (
                <Section style={ctaSection}>
                    <Button href={actionUrl} style={button}>
                        {actionLabel}
                    </Button>
                </Section>
            )}

            <Text style={footerNote}>
                تلقيت هذا الإشعار لأنك مشترك في منصة سدرة التعليمية.
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

const notificationBox = {
    borderRadius: '8px',
    padding: '24px',
    margin: '24px 0',
};

const messageText = {
    fontSize: '15px',
    color: '#1f2937', // Text Main
    lineHeight: '1.7',
    margin: '0',
    whiteSpace: 'pre-line' as const,
    fontFamily: 'Tajawal, Cairo, Arial, sans-serif',
};

const ctaSection = {
    textAlign: 'center' as const,
    margin: '32px 0',
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

const footerNote = {
    fontSize: '12px',
    color: '#9ca3af', // Gray 400
    textAlign: 'center' as const,
    margin: '30px 0 0 0',
    fontFamily: 'Tajawal, Cairo, Arial, sans-serif',
};

export default GenericNotification;
