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
                return { bg: '#fef3c7', border: '#f59e0b', emoji: '⚠️' };
            case 'error':
                return { bg: '#fef2f2', border: '#ef4444', emoji: '❌' };
            default:
                return { bg: '#dbeafe', border: '#0ea5e9', emoji: 'ℹ️' };
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
    color: '#1e293b',
    margin: '0 0 20px 0',
};

const notificationBox = {
    borderRadius: '8px',
    padding: '20px',
    margin: '20px 0',
};

const messageText = {
    fontSize: '15px',
    color: '#1e293b',
    lineHeight: '1.7',
    margin: '0',
    whiteSpace: 'pre-line' as const,
};

const ctaSection = {
    textAlign: 'center' as const,
    margin: '25px 0',
};

const button = {
    backgroundColor: '#0ea5e9',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 24px',
};

const footerNote = {
    fontSize: '12px',
    color: '#94a3b8',
    textAlign: 'center' as const,
    margin: '30px 0 0 0',
};

export default GenericNotification;
