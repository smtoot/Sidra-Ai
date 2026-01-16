import {
    Button,
    Section,
    Text,
    Hr,
} from '@react-email/components';
import * as React from 'react';
import { BaseEmail } from '../BaseEmail';

interface BookingConfirmationProps {
    studentName: string;
    teacherName: string;
    subjectName: string;
    sessionDate: string;
    sessionTime: string;
    meetingLink?: string;
    bookingId: string;
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
    studentName,
    teacherName,
    subjectName,
    sessionDate,
    sessionTime,
    meetingLink,
    bookingId,
}) => {
    return (
        <BaseEmail
            preview={`تأكيد الحجز - ${subjectName} مع ${teacherName}`}
            title="تم تأكيد حجز الحصة"
        >
            <Text style={greeting}>
                مرحباً {studentName}،
            </Text>

            <Text style={paragraph}>
                تم تأكيد حجز حصتك التعليمية بنجاح!
            </Text>

            <Section style={detailsBox}>
                <Text style={detailLabel}>المادة:</Text>
                <Text style={detailValue}>{subjectName}</Text>

                <Hr style={divider} />

                <Text style={detailLabel}>المعلم:</Text>
                <Text style={detailValue}>{teacherName}</Text>

                <Hr style={divider} />

                <Text style={detailLabel}>التاريخ:</Text>
                <Text style={detailValue}>{sessionDate}</Text>

                <Hr style={divider} />

                <Text style={detailLabel}>الوقت:</Text>
                <Text style={detailValue}>{sessionTime}</Text>

                {meetingLink && (
                    <>
                        <Hr style={divider} />
                        <Text style={detailLabel}>رابط الحصة:</Text>
                        <Button href={meetingLink} style={button}>
                            انضم للحصة
                        </Button>
                    </>
                )}
            </Section>

            <Text style={paragraph}>
                رقم الحجز: <strong>{bookingId}</strong>
            </Text>

            <Text style={footerNote}>
                💡 نصيحة: قم بإضافة الحصة إلى تقويمك لتذكيرك بالموعد.
            </Text>
        </BaseEmail>
    );
};

// Styles
const greeting = {
    fontSize: '16px',
    color: '#1f2937', // Text Main
    margin: '0 0 15px 0',
    fontFamily: 'Tajawal, Cairo, Arial, sans-serif',
};

const paragraph = {
    fontSize: '14px',
    color: '#4b5563', // Text Body
    lineHeight: '1.6',
    margin: '0 0 15px 0',
    fontFamily: 'Tajawal, Cairo, Arial, sans-serif',
};

const detailsBox = {
    backgroundColor: '#FAFAFA', // Background
    borderRadius: '8px',
    padding: '24px',
    margin: '24px 0',
    border: '1px solid #e5e7eb',
};

const detailLabel = {
    fontSize: '13px',
    color: '#6b7280', // Text Subtle
    margin: '0 0 6px 0',
    fontWeight: '600',
    fontFamily: 'Tajawal, Cairo, Arial, sans-serif',
};

const detailValue = {
    fontSize: '16px',
    color: '#1f2937', // Text Main
    margin: '0 0 16px 0',
    fontWeight: 'bold',
    fontFamily: 'Tajawal, Cairo, Arial, sans-serif',
};

const divider = {
    borderColor: '#e5e7eb',
    margin: '16px 0',
};

const button = {
    backgroundColor: '#D4A056', // Brand Accent (Gold)
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    padding: '14px 24px',
    margin: '16px 0 0 0',
    fontFamily: 'Tajawal, Cairo, Arial, sans-serif',
};

const footerNote = {
    fontSize: '13px',
    color: '#003366', // Brand Primary
    backgroundColor: '#f0f9ff', // Light Blue
    padding: '16px',
    borderRadius: '8px',
    margin: '24px 0 0 0',
    borderRight: '4px solid #003366',
    fontFamily: 'Tajawal, Cairo, Arial, sans-serif',
};

export default BookingConfirmation;
