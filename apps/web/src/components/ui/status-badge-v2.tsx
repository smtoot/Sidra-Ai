import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';

export type StatusVariant =
    | 'success'
    | 'error'
    | 'warning'
    | 'info'
    | 'pending'
    | 'neutral';

interface StatusBadgeV2Props {
    variant: StatusVariant;
    children: React.ReactNode;
    showIcon?: boolean;
    showDot?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
    success: 'bg-green-100 text-green-800 border-green-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    pending: 'bg-orange-100 text-orange-800 border-orange-200',
    neutral: 'bg-gray-100 text-gray-800 border-gray-200',
};

const iconMap: Record<StatusVariant, React.ComponentType<any>> = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: CheckCircle,
    pending: Clock,
    neutral: Loader2,
};

const dotStyles: Record<StatusVariant, string> = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
    pending: 'bg-orange-500',
    neutral: 'bg-gray-500',
};

const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
};

export function StatusBadgeV2({
    variant,
    children,
    showIcon = false,
    showDot = false,
    size = 'sm',
    className,
}: StatusBadgeV2Props) {
    const Icon = iconMap[variant];

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full font-medium border',
                variantStyles[variant],
                sizeStyles[size],
                className
            )}
        >
            {showDot && (
                <span
                    className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        dotStyles[variant]
                    )}
                />
            )}
            {showIcon && <Icon className={cn(size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5')} />}
            {children}
        </span>
    );
}

// Preset status badges for common use cases
export const StatusPresets = {
    Active: () => <StatusBadgeV2 variant="success" showDot>نشط</StatusBadgeV2>,
    Inactive: () => <StatusBadgeV2 variant="neutral" showDot>غير نشط</StatusBadgeV2>,
    Pending: () => <StatusBadgeV2 variant="pending" showDot>قيد الانتظار</StatusBadgeV2>,
    Approved: () => <StatusBadgeV2 variant="success" showIcon>معتمد</StatusBadgeV2>,
    Rejected: () => <StatusBadgeV2 variant="error" showIcon>مرفوض</StatusBadgeV2>,
    Completed: () => <StatusBadgeV2 variant="success" showIcon>مكتمل</StatusBadgeV2>,
    Cancelled: () => <StatusBadgeV2 variant="error">ملغي</StatusBadgeV2>,
    Warning: () => <StatusBadgeV2 variant="warning" showIcon>تحذير</StatusBadgeV2>,
};
