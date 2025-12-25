"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Context for open state
const CollapsibleContext = React.createContext<{ open: boolean }>({ open: false });

// Root component
interface CollapsibleProps extends React.HTMLAttributes<HTMLDivElement> {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
    ({ className, open, children, ...props }, ref) => {
        // Filter out onOpenChange from props since it's handled by parent state
        const { onOpenChange, ...divProps } = props as any;
        return (
            <CollapsibleContext.Provider value={{ open: !!open }}>
                <div ref={ref} className={cn("", className)} {...divProps}>
                    {children}
                </div>
            </CollapsibleContext.Provider>
        );
    }
);
Collapsible.displayName = "Collapsible"

// Trigger - supports asChild to avoid nested buttons
interface CollapsibleTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    asChild?: boolean;
}

const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(
    ({ className, asChild, children, ...props }, ref) => {
        if (asChild && React.isValidElement(children)) {
            const child = children as React.ReactElement<{ className?: string }>;
            // Clone the child and pass through props
            return React.cloneElement(child, {
                ...props,
                className: cn(child.props.className, className),
            });
        }
        return (
            <button ref={ref} className={cn("", className)} {...props}>
                {children}
            </button>
        );
    }
);
CollapsibleTrigger.displayName = "CollapsibleTrigger"

// Content - uses context to show/hide
const CollapsibleContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
    const { open } = React.useContext(CollapsibleContext);
    if (!open) return null;
    return (
        <div
            ref={ref}
            className={cn("overflow-hidden", className)}
            {...props}
        />
    );
});
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }

