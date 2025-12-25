import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { teacherApi, TeachingApproachTag } from '@/lib/api/teacher';
import { toast } from 'sonner';
import { Check, GraduationCap, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeachingApproachSectionProps {
    teachingStyle: string | null;
    currentTags: string[]; // List of Tag IDs
    isReadOnly: boolean;
    onUpdate: (updates: any) => void;
}

export function TeachingApproachSection({
    teachingStyle,
    currentTags,
    isReadOnly,
    onUpdate
}: TeachingApproachSectionProps) {
    const [availableTags, setAvailableTags] = useState<TeachingApproachTag[]>([]);
    const [loadingTags, setLoadingTags] = useState(true);
    const [selectedTags, setSelectedTags] = useState<string[]>(currentTags || []);
    const [styleText, setStyleText] = useState(teachingStyle || '');

    useEffect(() => {
        // Load available tags
        teacherApi.getTeachingApproachTags()
            .then(tags => setAvailableTags(tags))
            .catch(err => {
                console.error('Failed to load tags', err);
                toast.error('فشل تحميل الوسوم');
            })
            .finally(() => setLoadingTags(false));
    }, []);

    // Sync props to state if they change externally (e.g. initial load)
    useEffect(() => {
        if (teachingStyle !== null && teachingStyle !== styleText) setStyleText(teachingStyle);
        if (currentTags && JSON.stringify(currentTags) !== JSON.stringify(selectedTags)) setSelectedTags(currentTags);
    }, [teachingStyle, currentTags]);

    const handleTagToggle = (tagId: string) => {
        if (isReadOnly) return;

        let newTags = [...selectedTags];
        if (selectedTags.includes(tagId)) {
            newTags = selectedTags.filter(id => id !== tagId);
        } else {
            if (selectedTags.length >= 4) {
                toast.error('يمكنك اختيار 4 وسوم كحد أقصى');
                return;
            }
            newTags = [...selectedTags, tagId];
        }

        setSelectedTags(newTags);
        onUpdate({ teachingTagIds: newTags });
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newVal = e.target.value;
        setStyleText(newVal);
        onUpdate({ teachingStyle: newVal });
    };

    return (
        <div className="space-y-8">
            {/* Teaching Style Text */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-primary" />
                    <Label className="text-base font-bold text-gray-700">كيف تصف أسلوبك في التدريس؟</Label>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                    صف كيف تساعد الطلاب على الفهم (مثال: أستخدم الأمثلة الواقعية، أركز على التفاعل، أستخدم الخرائط الذهنية...).
                    هذا النص سيظهر في ملفك العام.
                </p>
                <Textarea
                    value={styleText}
                    onChange={handleTextChange}
                    placeholder="اكتب نبذة عن أسلوبك..."
                    className="min-h-[120px] resize-none border-gray-300 focus:border-primary"
                    disabled={isReadOnly}
                    maxLength={500}
                />
                <div className="text-left text-xs text-gray-400">
                    {styleText.length}/500
                </div>
            </div>

            {/* Tags Selection */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-base font-bold text-gray-700">اختر وسوم تصف طريقتك (اختياري)</Label>
                    <span className={cn("text-xs font-medium", selectedTags.length === 4 ? "text-amber-500" : "text-gray-400")}>
                        {selectedTags.length}/4
                    </span>
                </div>
                <p className="text-sm text-gray-500">
                    يمكنك اختيار ما يصل إلى 4 وسوم تظهر للطلاب في ملفك.
                </p>

                {loadingTags ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {availableTags.map(tag => {
                            const isSelected = selectedTags.includes(tag.id);
                            return (
                                <button
                                    key={tag.id}
                                    onClick={() => handleTagToggle(tag.id)}
                                    disabled={isReadOnly || (!isSelected && selectedTags.length >= 4)}
                                    className={cn(
                                        "relative flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-right",
                                        isSelected
                                            ? "border-primary bg-primary/5 text-primary shadow-sm"
                                            : "border-gray-200 bg-white hover:border-gray-300 text-gray-600",
                                        (isReadOnly || (!isSelected && selectedTags.length >= 4)) && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <span className="font-medium text-sm">{tag.labelAr}</span>
                                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
