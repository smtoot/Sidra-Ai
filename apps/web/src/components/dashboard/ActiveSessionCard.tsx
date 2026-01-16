'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, ExternalLink, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming standard utils

interface ActiveSessionCardProps {
    session: any;
    userRole: 'TEACHER' | 'STUDENT' | 'PARENT';
}

export function ActiveSessionCard({ session, userRole }: ActiveSessionCardProps) {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    if (!session) return null;

    const startTime = new Date(session.startTime);
    const endTime = new Date(session.endTime);
    const isStarted = now >= startTime;
    const minutesElapsed = Math.floor((now.getTime() - startTime.getTime()) / 60000);
    const minutesUntilStart = Math.floor((startTime.getTime() - now.getTime()) / 60000);
    const minutesRemaining = Math.floor((endTime.getTime() - now.getTime()) / 60000);

    // Role-specific text
    const isTeacher = userRole === 'TEACHER';
    const roleName = isTeacher ? 'Student' : 'Teacher';
    const otherPartyName = isTeacher ? session.studentName : session.teacherName;
    const subjectName = session.subjectName;

    // Meeting Link Logic
    const hasJitsi = session.jitsiEnabled;
    const bookingId = session.id;

    const handleJoin = () => {
        if (hasJitsi && bookingId) {
            window.open(`/meeting/${bookingId}`, '_blank');
        }
    };

    return (
        <Card className="border-2 border-primary/20 bg-primary/5 shadow-lg mb-6 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary animate-pulse" />

            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

                    {/* Left Side: Status & Info */}
                    <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                            <Badge variant="destructive" className="animate-pulse px-3 py-1 text-sm font-medium flex items-center gap-2">
                                <Video className="w-4 h-4" />
                                {isStarted ? 'Live Now - الحصة شغالة' : 'Starting Soon - تبدأ قريباً'}
                            </Badge>

                            <div className="flex items-center gap-2 text-muted-foreground text-sm font-mono">
                                <Clock className="w-4 h-4" />
                                {isStarted ? (
                                    <span>بدأت قبل {Math.abs(minutesElapsed)} دقيقة</span>
                                ) : (
                                    <span>تبدأ خلال {minutesUntilStart} دقيقة</span>
                                )}
                                <span className="mx-1">•</span>
                                <span>باقي {minutesRemaining} دقيقة</span>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-foreground mb-1">
                                {subjectName}
                            </h2>
                            <p className="text-lg text-muted-foreground">
                                مع {otherPartyName}
                            </p>
                        </div>

                        {/* Child Name Badge for Parents */}
                        {userRole === 'PARENT' && session.studentName && (
                            <Badge variant="outline" className="mt-1">
                                الطالب: {session.studentName}
                            </Badge>
                        )}
                    </div>

                    {/* Right Side: Action Button */}
                    <div className="w-full md:w-auto flex flex-col items-stretch md:items-end gap-3 min-w-[200px]">
                        {hasJitsi ? (
                            <Button
                                size="lg"
                                className="w-full md:w-auto text-lg h-14 shadow-md transition-all hover:scale-105"
                                onClick={handleJoin}
                            >
                                <ExternalLink className="mr-2 h-5 w-5" />
                                {isTeacher ? 'ابدأ الحصة الآن' : 'انضم للحصة الآن'}
                            </Button>
                        ) : (
                            <div className="w-full">
                                <Button
                                    disabled
                                    variant="secondary"
                                    size="lg"
                                    className="w-full opacity-80 cursor-not-allowed"
                                >
                                    <AlertTriangle className="mr-2 h-5 w-5 text-yellow-500" />
                                    رابط الحصة غير متوفر
                                </Button>
                                {isTeacher && (
                                    <p className="text-xs text-red-500 mt-2 text-center md:text-right font-medium">
                                        ⚠️ يرجى إضافة رابط الاجتماع من تفاصيل الحصة
                                    </p>
                                )}
                                {!isTeacher && (
                                    <p className="text-xs text-muted-foreground mt-2 text-center md:text-right">
                                        المعلم لم يضف الرابط بعد. انتظر قليلاً.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Secondary Link to details */}
                        <div className="text-center md:text-right w-full">
                            <a href={isTeacher ? `/teacher/sessions/${session.id}` : `/booking/${session.id}`} className="text-sm text-primary hover:underline block p-1">
                                عرض التفاصيل
                            </a>
                        </div>
                    </div>

                </div>
            </CardContent>
        </Card>
    );
}
