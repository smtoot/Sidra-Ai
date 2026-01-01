'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Linkedin, Check, Share2, Send } from "lucide-react";
import { toast } from "sonner";

// Custom WhatsApp Icon
const WhatsAppIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
);

// Custom X (Twitter) Icon
const XIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
);

// Custom Telegram Icon
const TelegramIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
);

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    teacherName: string;
    teacherSlug: string;
    bio?: string;
}

export function ShareModal({ isOpen, onClose, teacherName, teacherSlug, bio }: ShareModalProps) {
    const [copied, setCopied] = useState(false);
    const [canNativeShare, setCanNativeShare] = useState(false);

    // Check for native share support on mount
    useEffect(() => {
        setCanNativeShare(typeof navigator !== 'undefined' && !!navigator.share);
    }, []);

    // Construct the URL
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const profileUrl = `${origin}/teachers/${teacherSlug}`;

    // Arabic share text
    const shareText = `تعرّف على ${teacherName} في سدرة! 🌟\n${bio ? bio.substring(0, 80) + '...' : 'معلم متميز متاح الآن للحصص الخصوصية.'}`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(profileUrl);
            setCopied(true);
            toast.success("تم نسخ الرابط بنجاح!");
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error("فشل في نسخ الرابط");
        }
    };

    const handleNativeShare = async () => {
        try {
            await navigator.share({
                title: `${teacherName} - سدرة`,
                text: shareText,
                url: profileUrl,
            });
        } catch (err) {
            // User cancelled or share failed - no need to show error
            if ((err as Error).name !== 'AbortError') {
                console.error('Share failed:', err);
            }
        }
    };

    const handleShare = (platform: 'whatsapp' | 'twitter' | 'linkedin' | 'telegram') => {
        let url = '';
        const encodedText = encodeURIComponent(shareText);
        const encodedUrl = encodeURIComponent(profileUrl);

        switch (platform) {
            case 'whatsapp':
                url = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
                break;
            case 'twitter':
                url = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
                break;
            case 'linkedin':
                url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
                break;
            case 'telegram':
                url = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
                break;
        }

        window.open(url, '_blank', 'width=600,height=400');
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md font-tajawal" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-right">مشاركة الملف الشخصي</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <p className="text-sm text-center text-muted-foreground mb-2">
                        شارك ملف <strong>{teacherName}</strong> مع أصدقائك ومعارفك
                    </p>

                    {/* Native Share Button (Mobile) */}
                    {canNativeShare && (
                        <Button
                            onClick={handleNativeShare}
                            className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-6 gap-2 mb-2"
                        >
                            <Share2 className="w-5 h-5" />
                            مشاركة مباشرة
                        </Button>
                    )}

                    {/* Social Share Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            className="flex flex-col h-20 items-center justify-center gap-2 hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-all"
                            onClick={() => handleShare('whatsapp')}
                        >
                            <WhatsAppIcon className="w-7 h-7" />
                            <span className="font-medium">واتساب</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex flex-col h-20 items-center justify-center gap-2 hover:bg-sky-50 hover:text-sky-500 hover:border-sky-300 transition-all"
                            onClick={() => handleShare('telegram')}
                        >
                            <TelegramIcon className="w-7 h-7" />
                            <span className="font-medium">تيليجرام</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex flex-col h-20 items-center justify-center gap-2 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all"
                            onClick={() => handleShare('twitter')}
                        >
                            <XIcon className="w-6 h-6" />
                            <span className="font-medium">إكس</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex flex-col h-20 items-center justify-center gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all"
                            onClick={() => handleShare('linkedin')}
                        >
                            <Linkedin className="w-7 h-7" />
                            <span className="font-medium">لينكدإن</span>
                        </Button>
                    </div>

                    {/* Copy Link Section */}
                    <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-2 text-right">أو انسخ الرابط:</p>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 relative">
                                <input
                                    readOnly
                                    dir="ltr"
                                    className="flex h-10 w-full rounded-lg border border-input bg-gray-50 px-3 py-2 text-sm text-left font-mono truncate focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={profileUrl}
                                />
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                className={`px-4 h-10 transition-all ${copied ? 'bg-green-500 hover:bg-green-600' : ''}`}
                                onClick={handleCopyLink}
                            >
                                {copied ? (
                                    <>
                                        <Check className="h-4 w-4 ml-1" />
                                        <span>تم</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4 ml-1" />
                                        <span>نسخ</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
