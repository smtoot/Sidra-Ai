import {
    Body,
    Container,
    Font,
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

const baseUrl = process.env.WEB_URL || 'https://sidra.sd';

export const BaseEmail: React.FC<BaseEmailProps> = ({
    preview,
    title,
    children,
    isRTL = true, // Default to RTL for Arabic
}) => {
    return (
        <Html dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : 'en'}>
            <Head>
                <style>
                    {`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;700&display=swap');`}
                </style>
                <Font
                    fontFamily="Cairo"
                    fallbackFontFamily="Arial"
                    webFont={{
                        url: 'https://fonts.gstatic.com/s/cairo/v20/SLXGc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hZj-e8.woff2',
                        format: 'woff2',
                    }}
                    fontWeight={400}
                    fontStyle="normal"
                />
                <Font
                    fontFamily="Cairo"
                    fallbackFontFamily="Arial"
                    webFont={{
                        url: 'https://fonts.gstatic.com/s/cairo/v20/SLXGc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hZj-e8.woff2',
                        format: 'woff2',
                    }}
                    fontWeight={700}
                    fontStyle="normal"
                />
            </Head>
            {preview && <Preview>{preview}</Preview>}
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Img
                            src={`${baseUrl}/images/logo-white.png`}
                            width="120"
                            height="auto"
                            alt="سدرة"
                            style={logo}
                        />
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
                            <Link href={baseUrl} style={link}>
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
    backgroundColor: '#FAFAFA',
    fontFamily: 'Cairo, Tajawal, Arial, sans-serif',
};

const container = {
    margin: '0 auto',
    padding: '0',
    maxWidth: '600px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden' as const,
    marginTop: '20px',
    marginBottom: '20px',
};

const header = {
    backgroundColor: '#003366', // Brand Primary
    padding: '30px 20px',
    textAlign: 'center' as const,
};

const logo = {
    margin: '0 auto 10px auto',
    display: 'block',
};

const tagline = {
    color: '#D4A056', // Brand Accent
    fontSize: '14px',
    margin: '0',
    fontWeight: '500',
    fontFamily: 'Cairo, Tajawal, Arial, sans-serif',
};

const content = {
    padding: '40px 30px',
};

const h1 = {
    color: '#1f2937', // Text Main
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0 0 24px 0',
    textAlign: 'center' as const,
    fontFamily: 'Cairo, Tajawal, Arial, sans-serif',
};

const footer = {
    backgroundColor: '#f8fafc',
    padding: '24px',
    textAlign: 'center' as const,
    borderTop: '1px solid #e2e8f0',
};

const footerText = {
    color: '#6b7280', // Text Subtle
    fontSize: '12px',
    margin: '6px 0',
    fontFamily: 'Cairo, Tajawal, Arial, sans-serif',
};

const link = {
    color: '#003366', // Brand Primary
    textDecoration: 'none',
    fontWeight: 'bold',
};

export default BaseEmail;
