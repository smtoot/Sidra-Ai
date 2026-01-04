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
    color: '#1e293b',
    margin: '0 0 15px 0',
};

const paragraph = {
    fontSize: '14px',
    color: '#475569',
    lineHeight: '1.6',
    margin: '0 0 15px 0',
};

const detailsBox = {
    backgroundColor: '#f1f5f9',
    borderRadius: '8px',
    padding: '20px',
    margin: '20px 0',
    border: '1px solid #e2e8f0',
};

const detailLabel = {
    fontSize: '12px',
    color: '#64748b',
    margin: '0 0 5px 0',
    fontWeight: '600',
};

const detailValue = {
    fontSize: '16px',
    color: '#1e293b',
    margin: '0 0 15px 0',
    fontWeight: 'bold',
};

const divider = {
    borderColor: '#e2e8f0',
    margin: '15px 0',
};

const button = {
    backgroundColor: '#0ea5e9',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    padding: '12px 24px',
    margin: '10px 0',
};

const footerNote = {
    fontSize: '13px',
    color: '#64748b',
    backgroundColor: '#fef3c7',
    padding: '12px',
    borderRadius: '6px',
    margin: '20px 0 0 0',
    borderRight: '3px solid #f59e0b',
};

export default BookingConfirmation;
