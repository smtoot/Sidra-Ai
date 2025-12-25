import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
    {
        variants: {
            variant: {
                success: "bg-success-50 text-success-700",
                warning: "bg-warning-50 text-warning-700",
                error: "bg-error-50 text-error-700",
                info: "bg-primary-50 text-primary-700",
                neutral: "bg-gray-100 text-gray-700",
            },
        },
        defaultVariants: {
            variant: "neutral",
        },
    }
);

const statusDotVariants = cva("w-1.5 h-1.5 rounded-full", {
    variants: {
        variant: {
            success: "bg-success-500",
            warning: "bg-warning-500",
            error: "bg-error-500",
            info: "bg-primary-500",
            neutral: "bg-gray-400",
        },
    },
    defaultVariants: {
        variant: "neutral",
    },
});

export interface StatusBadgeProps
    extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
    /**
     * Whether to show the status dot indicator
     * @default true
     */
    showDot?: boolean;
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
    ({ className, variant, showDot = true, children, ...props }, ref) => {
        return (
            <span
                ref={ref}
                className={cn(statusBadgeVariants({ variant }), className)}
                {...props}
            >
                {showDot && (
                    <span className={cn(statusDotVariants({ variant }))} aria-hidden="true" />
                )}
                {children}
            </span>
        );
    }
);

StatusBadge.displayName = "StatusBadge";

export { StatusBadge, statusBadgeVariants };
