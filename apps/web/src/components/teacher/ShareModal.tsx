
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Facebook, Linkedin, MessageCircle, Twitter } from "lucide-react"; // Using MessageCircle for WhatsApp and Twitter for X
import { toast } from "sonner";

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    teacherName: string;
    teacherSlug: string;
    bio?: string;
}

export function ShareModal({ isOpen, onClose, teacherName, teacherSlug, bio }: ShareModalProps) {
    // Construct the URL
    // Assumes the app is hosted at the current origin
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const profileUrl = `${origin}/teachers/${teacherSlug}`;

    const shareText = `Check out ${teacherName} on Sidra! 🌟\n${bio ? bio.substring(0, 50) + '...' : 'Expert tutor available now.'}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(profileUrl);
        toast.success("Link copied to clipboard!");
    };

    const handleShare = (platform: 'whatsapp' | 'twitter' | 'linkedin') => {
        let url = '';
        const encodedText = encodeURIComponent(shareText);
        const encodedUrl = encodeURIComponent(profileUrl);

        switch (platform) {
            case 'whatsapp':
                url = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
                break;
            case 'twitter':
                url = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`; // X
                break;
            case 'linkedin':
                url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
                break;
        }

        window.open(url, '_blank', 'width=600,height=400');
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share Profile</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <p className="text-sm text-center text-muted-foreground mb-2">
                        Share <strong>{teacherName}</strong> with your friends and network.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            className="flex flex-col h-20 items-center justify-center gap-2 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                            onClick={() => handleShare('whatsapp')}
                        >
                            <MessageCircle className="w-6 h-6" />
                            <span>WhatsApp</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex flex-col h-20 items-center justify-center gap-2 hover:bg-black hover:text-white"
                            onClick={() => handleShare('twitter')}
                        >
                            <Twitter className="w-6 h-6" />
                            <span>X (Twitter)</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex flex-col h-20 items-center justify-center gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                            onClick={() => handleShare('linkedin')}
                        >
                            <Linkedin className="w-6 h-6" />
                            <span>LinkedIn</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex flex-col h-20 items-center justify-center gap-2"
                            onClick={handleCopyLink}
                        >
                            <Copy className="w-6 h-6" />
                            <span>Copy Link</span>
                        </Button>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="grid flex-1 gap-2">
                        <input
                            readOnly
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            value={profileUrl}
                        />
                    </div>
                    <Button type="button" size="sm" className="px-3" onClick={handleCopyLink}>
                        <span className="sr-only">Copy</span>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
