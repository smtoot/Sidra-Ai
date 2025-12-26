
import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface FavoriteButtonProps {
    teacherId: string;
    initialIsFavorited?: boolean;
    className?: string;
    onToggle?: (isFavorited: boolean) => void;
}

export function FavoriteButton({ teacherId, initialIsFavorited = false, className, onToggle }: FavoriteButtonProps) {
    const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isLoading) return;
        setIsLoading(true);

        const previousState = isFavorited;
        // Optimistic UI update
        setIsFavorited(!previousState);

        try {
            const response = await api.post(`/favorites/${teacherId}`);
            const newState = response.data.favorited;
            setIsFavorited(newState);
            if (onToggle) onToggle(newState);

            toast.success(newState ? 'Added to favorites' : 'Removed from favorites');
        } catch (error) {
            // Revert on failure
            setIsFavorited(previousState);
            console.error('Failed to toggle favorite:', error);
            toast.error('Failed to update favorite');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            className={cn("rounded-full hover:bg-red-50 hover:text-red-500 transition-colors", className)}
            onClick={handleToggle}
            disabled={isLoading}
        >
            <Heart
                className={cn(
                    "w-5 h-5 transition-all",
                    isFavorited ? "fill-red-500 text-red-500" : "text-gray-500"
                )}
            />
        </Button>
    );
}
