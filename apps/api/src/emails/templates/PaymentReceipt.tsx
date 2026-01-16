import {
    Section,
    Text,
    Hr,
} from '@react-email/components';
import * as React from 'react';
import { BaseEmail } from '../BaseEmail';

interface PaymentReceiptProps {
    recipientName: string;
    transactionId: string;
    amount: number;
    type: 'WALLET_TOPUP' | 'PACKAGE_PURCHASE' | 'BOOKING_PAYMENT';
    description: string;
    currentBalance: number;
    date: string;
}

export const PaymentReceipt: React.FC<PaymentReceiptProps> = ({
    recipientName,
    transactionId,
    amount,
    type,
    description,
    currentBalance,
    date,
}) => {
    const getTypeLabel = () => {
        switch (type) {
            case 'WALLET_TOPUP':
                return 'شحن المحفظة';
            case 'PACKAGE_PURCHASE':
                return 'شراء باقة';
            case 'BOOKING_PAYMENT':
                return 'دفع حصة';
            default:
                return 'معاملة مالية';
        }
    };

    const isDebit = type === 'PACKAGE_PURCHASE' || type === 'BOOKING_PAYMENT';

    return (
        <BaseEmail
            preview={`إيصال الدفع - ${amount} SDG`}
            title={isDebit ? '✓ تم الدفع بنجاح' : '✓ تم الشحن بنجاح'}
        >
            <Text style={greeting}>
                مرحباً {recipientName}،
            </Text>

            <Text style={paragraph}>
                {isDebit ? 'تم الدفع بنجاح من محفظتك.' : 'تم شحن محفظتك بنجاح.'}
            </Text>

            <Section style={receiptBox}>
                <Section style={amountSection}>
                    <Text style={amountLabel}>المبلغ</Text>
                    <Text style={amountValue}>
                        {amount.toFixed(2)} SDG
                    </Text>
                </Section>

                <Hr style={divider} />

                <Text style={detailLabel}>نوع المعاملة:</Text>
                <Text style={detailValue}>{getTypeLabel()}</Text>

                <Hr style={divider} />

                <Text style={detailLabel}>الوصف:</Text>
                <Text style={detailValue}>{description}</Text>

                <Hr style={divider} />

                <Text style={detailLabel}>رقم المعاملة:</Text>
                <Text style={detailValue}>{transactionId}</Text>

                <Hr style={divider} />

                <Text style={detailLabel}>التاريخ:</Text>
                <Text style={detailValue}>{date}</Text>

                <Hr style={divider} />

                <Text style={detailLabel}>الرصيد الحالي:</Text>
                <Text style={balanceValue}>{currentBalance.toFixed(2)} SDG</Text>
            </Section>

            <Text style={footerNote}>
                📧 احتفظ بهذا الإيصال كسجل للمعاملة
            </Text>
        </BaseEmail>
    );
};

// Styles
const greeting = {
    fontSize: '16px',
    color: '#1f293b', // Text Main
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

const receiptBox = {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '24px',
    margin: '24px 0',
    border: '2px solid #003366', // Brand Primary border for receipt feel
};

const amountSection = {
    textAlign: 'center' as const,
    padding: '16px 0',
};

const amountLabel = {
    fontSize: '13px',
    color: '#6b7280', // Text Subtle
    margin: '0 0 8px 0',
    fontFamily: 'Tajawal, Cairo, Arial, sans-serif',
};

const amountValue = {
    fontSize: '36px',
    color: '#D4A056', // Brand Accent (Gold)
    margin: '0',
    fontWeight: 'bold',
    fontFamily: 'Tajawal, Cairo, Arial, sans-serif',
};

const detailLabel = {
    fontSize: '13px',
    color: '#6b7280', // Text Subtle
    margin: '12px 0 6px 0',
    fontWeight: '600',
    fontFamily: 'Tajawal, Cairo, Arial, sans-serif',
};

const detailValue = {
    fontSize: '14px',
    color: '#1f293b', // Text Main
    margin: '0 0 12px 0',
    fontFamily: 'Tajawal, Cairo, Arial, sans-serif',
};

const balanceValue = {
    fontSize: '18px',
    color: '#10b981', // Usage for money/success remains green-ish or blend with brand
    margin: '0 0 12px 0',
    fontWeight: 'bold',
    fontFamily: 'Tajawal, Cairo, Arial, sans-serif',
};

const divider = {
    borderColor: '#e5e7eb',
    margin: '12px 0',
};

const footerNote = {
    fontSize: '13px',
    color: '#6b7280', // Text Subtle
    backgroundColor: '#FAFAFA',
    padding: '16px',
    borderRadius: '8px',
    margin: '24px 0 0 0',
    textAlign: 'center' as const,
    fontFamily: 'Tajawal, Cairo, Arial, sans-serif',
};

export default PaymentReceipt;
