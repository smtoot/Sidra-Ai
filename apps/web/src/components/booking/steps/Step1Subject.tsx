'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Subject {
    id: string;
    name: string;
    price: number;
}

interface Step1SubjectProps {
    subjects: Subject[];
    selectedSubject: string;
    onSelect: (subjectId: string) => void;
}

export function Step1Subject({ subjects, selectedSubject, onSelect }: Step1SubjectProps) {
    return (
        <div className="space-y-3">
            <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-1">
                    اختر المادة التي تريد دراستها
                </h3>
                <p className="text-xs text-gray-500">
                    يمكنك رؤية السعر لكل حصة لكل مادة
                </p>
            </div>

            <div className="space-y-2">
                {subjects.map((subject) => (
                    <button
                        key={subject.id}
                        onClick={() => onSelect(subject.id)}
                        className={cn(
                            'w-full p-4 rounded-xl border-2 transition-all text-right',
                            'hover:border-primary hover:shadow-sm',
                            selectedSubject === subject.id
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                : 'border-gray-200 bg-white'
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                                <div
                                    className={cn(
                                        'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0',
                                        selectedSubject === subject.id
                                            ? 'border-primary bg-primary'
                                            : 'border-gray-300'
                                    )}
                                >
                                    {selectedSubject === subject.id && (
                                        <Check className="w-4 h-4 text-white" />
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-gray-900">
                                        {subject.name}
                                    </p>
                                </div>
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-primary">
                                    {subject.price.toLocaleString()} SDG
                                </p>
                                <p className="text-xs text-gray-500">للحصة الواحدة</p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
