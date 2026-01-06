import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps
    extends React.SelectHTMLAttributes<HTMLSelectElement> { }

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <select
                ref={ref}
                className={cn(
                    // Mobile-first: h-12 (48px) touch target, text-base (16px) prevents iOS zoom
                    "flex h-12 w-full rounded-md border border-gray-300 bg-surface px-3 py-2.5 text-base",
                    "ring-offset-background placeholder:text-gray-400",
                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500 focus-visible:border-primary-500",
                    " disabled:cursor-not-allowed disabled:opacity-50",
                    "[&_optgroup]:font-semibold [&_optgroup]:text-gray-900",
                    "[&_option]:font-normal [&_option]:text-gray-900",
                    className
                )}
                {...props}
            >
                {children}
            </select>
        );
    }
);

Select.displayName = "Select";

export { Select };
