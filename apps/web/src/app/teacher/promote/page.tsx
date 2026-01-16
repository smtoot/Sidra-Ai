'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Copy, Check, Eye, Calendar, Sparkles, Share2, Download, Megaphone, Star } from 'lucide-react';
import { teacherApi, DashboardStats } from '@/lib/api/teacher';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function PromotePage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [isApproved, setIsApproved] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [dashboardData, profileData, statusData] = await Promise.all([
                    teacherApi.getDashboardStats(),
                    teacherApi.getProfile(),
                    teacherApi.getApplicationStatus()
                ]);
                setStats(dashboardData);
                setProfile(profileData);
                setIsApproved(statusData.applicationStatus === 'APPROVED');
            } catch (error) {
                console.error("Failed to load data", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 md:p-8" dir="rtl">
                <div className="max-w-7xl mx-auto flex justify-center items-center h-96">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (!isApproved) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
                <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md text-center space-y-4">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                        <Share2 className="w-8 h-8 text-amber-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">الميزة غير متاحة حالياً</h2>
                    <p className="text-gray-600">
                        عذراً، صفحة الترويج متاحة فقط للمعلمين المعتمدين. يرجى إكمال ملفك الشخصي وانتظار الموافقة للوصول إلى هذه الميزة.
                    </p>
                    <Button onClick={() => window.location.href = '/teacher'} variant="outline" className="w-full">
                        العودة للرئيسية
                    </Button>
                </div>
            </div>
        );
    }

    const teacherSlug = profile?.slug || profile?.id;
    const profileUrl = `https://sidra.sd/teachers/${teacherSlug}`;
    const directBookingUrl = `${profileUrl}?demo=true`;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-tajawal" dir="rtl">
            <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">

                {/* Header */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <Share2 className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">روّج لنفسك</h1>
                            <p className="text-gray-600">زيد عدد طلابك بمشاركة ملفك الشخصي وروابط الحجز المباشر</p>
                        </div>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                        icon={Star}
                        label="عدد التقييمات"
                        value={stats?.counts?.totalReviews || "0"}
                        color="yellow"
                    />
                    <StatCard
                        icon={Calendar}
                        label="عدد الحجوزات"
                        value={stats?.counts?.completedSessions || "0"}
                        color="green"
                    />
                    <StatCard
                        icon={Sparkles}
                        label="عدد الحصص التجريبية"
                        value={stats?.counts?.demoSessions || "0"}
                        color="purple"
                    />
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Right Column (Primary) */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Share Profile Card */}
                        <Card className="border-none shadow-md overflow-hidden">
                            <CardHeader className="bg-gradient-to-l from-primary/5 to-transparent border-b border-gray-100">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Share2 className="w-5 h-5 text-primary" />
                                    شارك ملفك الشخصي
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">

                                {/* Profile Link Input */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">رابط ملفك الشخصي</label>
                                    <div className="flex gap-2">
                                        <Input
                                            readOnly
                                            value={profileUrl}
                                            className="bg-gray-50 font-mono text-left text-sm"
                                            dir="ltr"
                                        />
                                        <CopyButton text={profileUrl} label="نسخ الرابط" />
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 my-4"></div>

                                {/* Share Text Tabs */}
                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-gray-700 block">نص جاهز للمشاركة</label>
                                    <Tabs defaultValue="whatsapp" className="w-full" dir="rtl">
                                        <TabsList className="w-full grid grid-cols-3 bg-gray-100 p-1">
                                            <TabsTrigger value="whatsapp">واتساب (عادي)</TabsTrigger>
                                            <TabsTrigger value="short">مختصر</TabsTrigger>
                                            <TabsTrigger value="formal">رسمي</TabsTrigger>
                                        </TabsList>

                                        <div className="mt-4">
                                            <TabsContent value="whatsapp">
                                                <ShareTextArea
                                                    defaultValue={`مرحباً 👋\nأنا أقدّم دروس خصوصية على منصة سدرة.\n\nبإمكانكم حجز حصص معي لتقوية المستوى وتحسين الأداء الدراسي.\n\nتفضلوا بزيارة ملفي الشخصي للحجز:\n${profileUrl}`}
                                                />
                                            </TabsContent>
                                            <TabsContent value="short">
                                                <ShareTextArea
                                                    defaultValue={`احجز حصتك الآن معي على منصة سدرة عبر الرابط:\n${profileUrl}`}
                                                />
                                            </TabsContent>
                                            <TabsContent value="formal">
                                                <ShareTextArea
                                                    defaultValue={`السلام عليكم ورحمة الله،\n\nيسرني إبلاغكم عن توفر أوقات جديدة للتدريس الخصوصي عبر منصة سدرة التعليمية.\n\nللاطلاع على التقييمات وحجز المواعيد، يرجى زيارة الرابط أدناه:\n${profileUrl}`}
                                                />
                                            </TabsContent>
                                        </div>
                                    </Tabs>
                                </div>

                                <div className="border-t border-gray-100 my-4"></div>

                                {/* Social Buttons */}
                                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                                    <SocialShareButton platform="whatsapp" url={profileUrl} />
                                    <SocialShareButton platform="facebook" url={profileUrl} />
                                    <SocialShareButton platform="twitter" url={profileUrl} />
                                    <SocialShareButton platform="linkedin" url={profileUrl} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* QR Code Section */}
                        <Card className="border-none shadow-md">
                            <CardHeader className="border-b border-gray-100">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <MaximizeIcon className="w-5 h-5 text-gray-600" />
                                    رمز QR الخاص بك
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row items-center gap-8">
                                    {/* QR Display */}
                                    <div id="qr-code-wrapper" className="bg-white p-4 rounded-xl border-2 border-gray-100 shadow-sm">
                                        <QRCodeSVG
                                            value={profileUrl}
                                            size={160}
                                            level="H"
                                            includeMargin={true}
                                        />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-3 w-full md:w-auto flex-1">
                                        <p className="text-gray-600 text-sm mb-2">
                                            يمكنك استخدام رمز QR في المنشورات المطبوعة ليسهل على الطلاب الوصول لملفك.
                                        </p>
                                        <div className="flex gap-3">
                                            <DownloadButton type="png" wrapperId="qr-code-wrapper" fileName={`qr-${teacherSlug}`} />
                                            <DownloadButton type="svg" wrapperId="qr-code-wrapper" fileName={`qr-${teacherSlug}`} variant="outline" />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                    </div>

                    {/* Left Column (Secondary) */}
                    <div className="space-y-6">

                        {/* Direct Booking Card */}
                        <Card className="border-none shadow-md bg-white overflow-hidden">
                            <CardHeader className="bg-amber-50/50 border-b border-gray-100">
                                <CardTitle className="flex items-center gap-2 text-lg text-amber-900">
                                    <Sparkles className="w-5 h-5 text-amber-500" />
                                    ✨ احجز مباشرة
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">رابط الحجز المباشر</label>
                                    <div className="flex gap-2">
                                        <Input
                                            readOnly
                                            value={directBookingUrl}
                                            className="bg-gray-50 font-mono text-left text-sm"
                                            dir="ltr"
                                        />
                                        <CopyButton text={directBookingUrl} label="نسخ الرابط" primary />
                                    </div>
                                </div>

                                {/* Warning Box */}
                                <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-3 text-sm text-amber-800/80">
                                    <div className="flex items-center gap-2 font-bold mb-1">
                                        <AlertCircle className="w-4 h-4" />
                                        ملاحظات مهمة:
                                    </div>
                                    <ul className="list-disc list-inside space-y-1 text-xs px-1">
                                        <li>هذا الرابط يفتح نافذة الحجز مباشرة</li>
                                        <li>الحصة التجريبية متاحة مرة واحدة لكل طالب</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tips Card */}
                        <Card className="border-none shadow-md bg-blue-50/30">
                            <CardHeader className="border-b border-blue-100/50">
                                <CardTitle className="flex items-center gap-2 text-lg text-primary-900">
                                    <Megaphone className="w-5 h-5 text-primary" />
                                    نصائح لزيادة الحجوزات
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <ul className="space-y-3">
                                    <TipItem text="شارك رابطك في قروبات واتساب الخاصة بالطلاب أو أولياء الأمور" />
                                    <TipItem text="ضع الرابط في الـ Bio على فيسبوك، إنستغرام، أو لينكد إن" />
                                    <TipItem text="استخدم رمز QR في تصميم بوستر أو بطاقة شخصية" />
                                    <TipItem text="اطلب من طلابك الحاليين مشاركة رابطك مع أصدقائهم" />
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Coming Soon Card */}
                        <Card className="border-2 border-dashed border-gray-200 bg-gray-50/50 opacity-70">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg text-gray-400">
                                    <ClockIcon className="w-5 h-5" />
                                    ⏳ قريباً
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-6 pb-6">
                                <ul className="space-y-3 text-gray-400 text-sm font-medium">
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                                        مواد ترويجية جاهزة (تصاميم)
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                                        كوبونات خصم للطلاب
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                                        برنامج الإحالات والمكافآت
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                    </div>
                </div>

            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------

function StatCard({ icon: Icon, label, value, color }: any) {
    const colors: any = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        green: "bg-green-50 text-green-600 border-green-100",
        purple: "bg-purple-50 text-purple-600 border-purple-100",
        yellow: "bg-yellow-50 text-yellow-600 border-yellow-100",
    };

    return (
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-xs font-bold mb-1">{label}</p>
                    <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                </div>
                <div className={cn("p-3 rounded-xl border", colors[color])}>
                    <Icon className="w-5 h-5" />
                </div>
            </CardContent>
        </Card>
    );
}

function CopyButton({ text, label, minimal, primary }: { text: string, label: string, minimal?: boolean, primary?: boolean }) {
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        toast.success("تم نسخ الرابط بنجاح");
    };

    return (
        <Button
            onClick={handleCopy}
            variant={primary ? "default" : "outline"}
            className={cn("gap-2 font-bold", minimal ? "px-3" : "px-4")}
        >
            <Copy className="w-4 h-4" />
            {!minimal && label}
        </Button>
    );
}

function ShareTextArea({ defaultValue }: { defaultValue: string }) {
    return (
        <div className="relative group">
            <Textarea
                defaultValue={defaultValue}
                className="min-h-[120px] bg-white resize-none text-base leading-relaxed p-4"
            />
            <Button
                variant="secondary"
                size="sm"
                className="absolute left-3 bottom-3 gap-2 shadow-sm opacity-90 hover:opacity-100 transition-opacity"
                onClick={(e) => {
                    const textarea = e.currentTarget.parentElement?.querySelector('textarea');
                    if (textarea) {
                        navigator.clipboard.writeText(textarea.value);
                        toast.success("تم نسخ النص");
                    }
                }}
            >
                <Copy className="w-3 h-3" />
                <span className="text-xs">نسخ النص</span>
            </Button>
        </div>
    );
}

// ----------------------------------------------------------------------
// Social Share Button
// ----------------------------------------------------------------------

function SocialShareButton({ platform, url }: { platform: string, url: string }) {
    const getShareUrl = () => {
        const text = `احجز حصتك معي على منصة سدرة: ${url}`;
        switch (platform) {
            case 'whatsapp': return `https://wa.me/?text=${encodeURIComponent(text)}`;
            case 'facebook': return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
            case 'twitter': return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
            case 'linkedin': return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
                return '#';
        }
    };

    const icons: any = {
        whatsapp: { bg: 'bg-[#25D366]', hover: 'hover:bg-[#128C7E]', icon: <span className="font-bold relative -top-0.5">WA</span> },
        facebook: { bg: 'bg-[#1877F2]', hover: 'hover:bg-[#0C63D4]', icon: <span className="font-bold">FB</span> },
        twitter: { bg: 'bg-[#000000]', hover: 'hover:bg-[#333333]', icon: <span className="font-bold">X</span> },
        linkedin: { bg: 'bg-[#0A66C2]', hover: 'hover:bg-[#004182]', icon: <span className="font-bold">IN</span> },
    };

    const style = icons[platform];

    return (
        <a
            href={getShareUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-white transition-all shadow-sm hover:scale-105",
                style.bg,
                style.hover
            )}
            title={`مشاركة عبر ${platform}`}
        >
            {platform === 'whatsapp' ? <MessageCircleIcon className="w-5 h-5 fill-current" /> :
                platform === 'facebook' ? <FacebookIcon className="w-5 h-5 fill-current" /> :
                    platform === 'twitter' ? <XIcon className="w-4 h-4 fill-current" /> :
                        <LinkedinIcon className="w-5 h-5 fill-current" />
            }
        </a>
    );
}

function TipItem({ text }: { text: string }) {
    return (
        <li className="flex items-start gap-2 text-gray-700 text-sm">
            <Check className="w-4 h-4 text-green-500 mt-1 shrink-0" />
            <span>{text}</span>
        </li>
    );
}

function DownloadButton({ type, wrapperId, fileName, variant = "default" }: { type: 'png' | 'svg', wrapperId: string, fileName: string, variant?: "default" | "outline" }) {
    const handleDownload = () => {
        const wrapper = document.getElementById(wrapperId);
        const svg = wrapper?.querySelector('svg');

        if (!svg) {
            toast.error("حدث خطأ أثناء تحميل الرمز");
            return;
        }

        if (type === 'svg') {
            const svgData = new XMLSerializer().serializeToString(svg);
            const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${fileName}.svg`;
            link.click();
        } else {
            // PNG download via Canvas
            const canvas = document.createElement("canvas");
            const svgSize = svg.getBoundingClientRect();
            // High Resolution
            const scale = 3;
            canvas.width = svgSize.width * scale;
            canvas.height = svgSize.height * scale;
            const ctx = canvas.getContext("2d");
            const img = new Image();
            const svgData = new XMLSerializer().serializeToString(svg);
            const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
            const url = URL.createObjectURL(blob);

            img.onload = () => {
                if (ctx) {
                    ctx.scale(scale, scale);
                    ctx.drawImage(img, 0, 0);
                    const pngUrl = canvas.toDataURL("image/png");
                    const link = document.createElement("a");
                    link.href = pngUrl;
                    link.download = `${fileName}.png`;
                    link.click();
                }
                URL.revokeObjectURL(url);
            };
            img.src = url;
        }
        toast.success(`تم تحميل رمز QR بصيغة ${type.toUpperCase()}`);
    };

    return (
        <Button variant={variant} size="sm" onClick={handleDownload} className="gap-2">
            <Download className="w-4 h-4" />
            {type.toUpperCase()}
        </Button>
    )
}


// Icons (Inline to avoid importing non-existent lucide icons or adding heavy libraries)
const MessageCircleIcon = (props: any) => (
    <svg viewBox="0 0 24 24" {...props}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
);

const FacebookIcon = (props: any) => (
    <svg viewBox="0 0 24 24" {...props}><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 011.141.195v3.325a8.623 8.623 0 00-.653-.036c-2.148 0-2.791 1.657-2.791 3.568v1.235h4.195l-.763 3.667h-3.432v7.98c9.208-1.111 9.208-1.111 9.208-1.111V11.16H23.7V9.796c0-6.19-4.821-11.233-10.708-11.233C7.11 0 2.309 5.042 2.309 11.232v2.753c0 5.918 6.791 9.706 6.791 9.706z" /></svg>
);

const XIcon = (props: any) => (
    <svg viewBox="0 0 24 24" {...props}><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" /></svg>
);

const LinkedinIcon = (props: any) => (
    <svg viewBox="0 0 24 24" {...props}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z" /></svg>
);

const MaximizeIcon = (props: any) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M8 3H5a2 2 0 0 0-2 2v3" />
        <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
        <path d="M3 16v3a2 2 0 0 0 2 2h3" />
        <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
)

const ClockIcon = (props: any) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
)
