import * as React from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
    src?: string;
    alt?: string;
    fallback?: string;
    size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
};

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
    ({ className, src, alt, fallback, size = "md", ...props }, ref) => {
        const [imageError, setImageError] = React.useState(false);

        const initials = React.useMemo(() => {
            if (!fallback) return "?";
            return fallback
                .split(" ")
                .map((word) => word[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
        }, [fallback]);

        return (
            <div
                ref={ref}
                className={cn(
                    "relative inline-flex items-center justify-center rounded-full bg-gray-200 overflow-hidden",
                    sizeClasses[size],
                    className
                )}
                {...props}
            >
                {src && !imageError ? (
                    <img
                        src={src}
                        alt={alt || fallback || "Avatar"}
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <span className="font-medium text-gray-600">{initials}</span>
                )}
            </div>
        );
    }
);

Avatar.displayName = "Avatar";

export { Avatar };
