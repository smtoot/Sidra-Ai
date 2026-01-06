import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils"; // Assuming utils exists or I need to create it

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default:
                    "bg-primary text-primary-foreground shadow hover:bg-primary/90 text-white", // Nile Blue
                secondary:
                    "bg-transparent border border-primary text-primary hover:bg-primary/10",
                tertiary:
                    "text-primary underline-offset-4 hover:underline",
                destructive:
                    "bg-error text-destructive-foreground shadow-sm hover:bg-error/90 text-white", // Red
                outline:
                    "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
                // Touch targets: 44px minimum for mobile accessibility (Apple/Google guidelines)
                default: "h-11 px-4 py-2.5 min-h-[44px]",
                sm: "h-10 rounded-md px-3 text-sm min-h-[40px]",
                lg: "h-12 rounded-md px-8 min-h-[48px]",
                icon: "h-11 w-11 min-h-[44px] min-w-[44px]",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };
