'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gender } from '@sidra/shared';
import { cn } from '@/lib/utils';

interface QualificationsSectionProps {
    education: string;
    yearsOfExperience: number;
    gender?: Gender;
    isReadOnly?: boolean;
    onUpdate: (data: {
        education?: string;
        yearsOfExperience?: number;
        gender?: Gender;
    }) => void;
}

export function QualificationsSection({
    education,
    yearsOfExperience,
    gender,
    isReadOnly = false,
    onUpdate,
}: QualificationsSectionProps) {
    return (
        <div className="space-y-6">
            {/* Education */}
            <div className="space-y-2">
                <Label className="text-base font-medium">المؤهل العلمي</Label>
                <Input
                    value={education}
                    onChange={(e) => onUpdate({ education: e.target.value })}
                    placeholder="مثال: بكالوريوس تربية - جامعة الخرطوم"
                    className="h-12 text-base"
                    disabled={isReadOnly}
                />
            </div>

            {/* Years of Experience */}
            <div className="space-y-2">
                <Label className="text-base font-medium">سنوات الخبرة</Label>
                <Input
                    type="number"
                    min={0}
                    max={50}
                    value={yearsOfExperience}
                    onChange={(e) => onUpdate({ yearsOfExperience: Number(e.target.value) })}
                    className="h-12 text-base w-32"
                    disabled={isReadOnly}
                />
            </div>

            {/* Gender */}
            <div className="space-y-3">
                <Label className="text-base font-medium">الجنس</Label>
                <div className="flex gap-4">
                    <label
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                            gender === Gender.MALE
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-gray-200 hover:border-gray-300",
                            isReadOnly ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                        )}
                    >
                        <input
                            type="radio"
                            name="gender"
                            value={Gender.MALE}
                            checked={gender === Gender.MALE}
                            onChange={() => !isReadOnly && onUpdate({ gender: Gender.MALE })}
                            className="sr-only"
                            disabled={isReadOnly}
                        />
                        <span className="font-medium">ذكر</span>
                    </label>
                    <label
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                            gender === Gender.FEMALE
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-gray-200 hover:border-gray-300",
                            isReadOnly ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                        )}
                    >
                        <input
                            type="radio"
                            name="gender"
                            value={Gender.FEMALE}
                            checked={gender === Gender.FEMALE}
                            onChange={() => !isReadOnly && onUpdate({ gender: Gender.FEMALE })}
                            className="sr-only"
                            disabled={isReadOnly}
                        />
                        <span className="font-medium">أنثى</span>
                    </label>
                </div>
            </div>
        </div>
    );
}
