'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
    deadline: string; // ISO timestamp
    onExpire?: () => void;
    className?: string;
}

export function CountdownTimer({ deadline, onExpire, className }: CountdownTimerProps) {
    const [timeRemaining, setTimeRemaining] = useState<string>('');
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const calculateTimeRemaining = () => {
            const now = new Date().getTime();
            const end = new Date(deadline).getTime();
            const diff = end - now;

            if (diff <= 0) {
                setIsExpired(true);
                setTimeRemaining('انتهى الوقت');
                if (onExpire) onExpire();
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            if (hours > 0) {
                setTimeRemaining(`${hours} ساعة و ${minutes} دقيقة`);
            } else {
                setTimeRemaining(`${minutes} دقيقة`);
            }
        };

        // Calculate immediately
        calculateTimeRemaining();

        // Update every minute
        const interval = setInterval(calculateTimeRemaining, 60 * 1000);

        return () => clearInterval(interval);
    }, [deadline, onExpire]);

    return (
        <div className={`flex items-center gap-2 ${className || ''}`}>
            <Clock className="w-4 h-4" />
            <span className={isExpired ? 'text-red-600 font-bold' : ''}>
                {timeRemaining}
            </span>
        </div>
    );
}
