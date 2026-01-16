import "reflect-metadata";
import type { Metadata } from "next";
import { Tajawal, Poppins, Cairo } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SystemConfigProvider } from "@/context/SystemConfigContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { QueryProvider } from "@/providers/QueryProvider";
import { PostHogProvider } from "@/providers/PostHogProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProductTourProvider } from "@/providers/ProductTourProvider";
import { RuntimeConfigProvider } from "@/components/providers/RuntimeConfigProvider";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  variable: "--font-tajawal",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sidra - سدرة",
  description: "Marketplace for Sudanese Teachers",
  icons: {
    icon: '/images/logo-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${cairo.variable} ${tajawal.variable} ${poppins.variable} font-sans bg-background text-text antialiased`}
      >
        <ErrorBoundary>
          <RuntimeConfigProvider>
            <PostHogProvider>
              <QueryProvider>
                <SystemConfigProvider>
                  <AuthProvider>
                    <ProductTourProvider>
                      <DashboardLayout>
                        {children}
                      </DashboardLayout>
                    </ProductTourProvider>
                  </AuthProvider>
                </SystemConfigProvider>
              </QueryProvider>
            </PostHogProvider>
          </RuntimeConfigProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
