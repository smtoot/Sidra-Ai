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
    color: '#1e293b',
    margin: '0 0 15px 0',
};

const paragraph = {
    fontSize: '14px',
    color: '#475569',
    lineHeight: '1.6',
    margin: '0 0 15px 0',
};

const receiptBox = {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '20px',
    margin: '20px 0',
    border: '2px solid #0ea5e9',
};

const amountSection = {
    textAlign: 'center' as const,
    padding: '15px 0',
};

const amountLabel = {
    fontSize: '12px',
    color: '#64748b',
    margin: '0 0 5px 0',
};

const amountValue = {
    fontSize: '32px',
    color: '#0ea5e9',
    margin: '0',
    fontWeight: 'bold',
};

const detailLabel = {
    fontSize: '12px',
    color: '#64748b',
    margin: '10px 0 5px 0',
    fontWeight: '600',
};

const detailValue = {
    fontSize: '14px',
    color: '#1e293b',
    margin: '0 0 10px 0',
};

const balanceValue = {
    fontSize: '18px',
    color: '#10b981',
    margin: '0 0 10px 0',
    fontWeight: 'bold',
};

const divider = {
    borderColor: '#e2e8f0',
    margin: '10px 0',
};

const footerNote = {
    fontSize: '13px',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    padding: '12px',
    borderRadius: '6px',
    margin: '20px 0 0 0',
    textAlign: 'center' as const,
};

export default PaymentReceipt;
