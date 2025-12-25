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
                    "flex h-10 w-full rounded-md border border-gray-300 bg-surface px-3 py-2 text-sm",
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
