import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
} from '@react-email/components';
import * as React from 'react';

interface BaseEmailProps {
    preview?: string;
    title: string;
    children: React.ReactNode;
    isRTL?: boolean;
}

export const BaseEmail: React.FC<BaseEmailProps> = ({
    preview,
    title,
    children,
    isRTL = true, // Default to RTL for Arabic
}) => {
    return (
        <Html dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : 'en'}>
            <Head />
            {preview && <Preview>{preview}</Preview>}
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Heading style={logo}>سدرة</Heading>
                        <Text style={tagline}>منصة التعليم الإلكترونية</Text>
                    </Section>

                    {/* Main Content */}
                    <Section style={content}>
                        <Heading style={h1}>{title}</Heading>
                        {children}
                    </Section>

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            هذا البريد الإلكتروني مرسل من منصة سدرة
                        </Text>
                        <Text style={footerText}>
                            <Link href="https://sidra.sd" style={link}>
                                sidra.sd
                            </Link>
                        </Text>
                        <Text style={footerText}>
                            © {new Date().getFullYear()} سدرة. جميع الحقوق محفوظة.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

// Styles
const main = {
    backgroundColor: '#f8fafc',
    fontFamily: 'Arial, sans-serif',
};

const container = {
    margin: '0 auto',
    padding: '20px 0',
    maxWidth: '600px',
    backgroundColor: '#ffffff',
};

const header = {
    backgroundColor: '#0ea5e9',
    padding: '30px 20px',
    textAlign: 'center' as const,
};

const logo = {
    color: '#ffffff',
    fontSize: '32px',
    fontWeight: 'bold',
    margin: '0 0 5px 0',
};

const tagline = {
    color: '#ffffff',
    fontSize: '14px',
    margin: '0',
    opacity: 0.9,
};

const content = {
    padding: '40px 20px',
};

const h1 = {
    color: '#1e293b',
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0 0 20px 0',
    textAlign: 'center' as const,
};

const footer = {
    backgroundColor: '#f1f5f9',
    padding: '20px',
    textAlign: 'center' as const,
    borderTop: '1px solid #e2e8f0',
};

const footerText = {
    color: '#64748b',
    fontSize: '12px',
    margin: '5px 0',
};

const link = {
    color: '#0ea5e9',
    textDecoration: 'none',
};

export default BaseEmail;
