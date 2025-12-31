import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Child {
    id: string;
    name: string;
}

interface ChildrenSelectorProps {
    children: Child[];
    selectedChildId: string | null;
    onSelect: (childId: string) => void;
}

export function ChildrenSelector({ children, selectedChildId, onSelect }: ChildrenSelectorProps) {
    if (!children || children.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
            {children.map((child) => {
                const isSelected = selectedChildId === child.id;

                return (
                    <button
                        key={child.id}
                        onClick={() => onSelect(child.id)}
                        className={cn(
                            "group flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-sm font-medium",
                            isSelected
                                ? "border-primary-600 bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-200"
                                : "border-gray-200 bg-white text-gray-600 hover:border-primary-200 hover:bg-gray-50"
                        )}
                    >
                        <Avatar
                            fallback={child.name?.[0]}
                            className={cn(
                                "w-5 h-5 text-xs transition-colors",
                                isSelected ? "bg-primary-200 text-primary-800" : "bg-gray-100"
                            )}
                        />
                        <span>{child.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 ml-1 animate-in fade-in zoom-in" />}
                    </button>
                );
            })}
        </div>
    );
}
