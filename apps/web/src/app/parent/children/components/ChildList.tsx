
'use client';

import { useState } from 'react';
import { Child } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, User } from 'lucide-react';

interface ChildListProps {
    childrenData: Child[];
    onEdit: (child: Child) => void;
}

export function ChildList({ childrenData, onEdit }: ChildListProps) {
    if (childrenData.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">لا يوجد أبناء مضافين</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                    قم بإضافة أبنائك لتتمكن من حجز الدروس لهم ومتابعة تقدمهم الدراسي.
                </p>
                {/* Button is handled by parent page to open modal */}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {childrenData.map((child) => (
                <div key={child.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-lg">
                                {child.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">{child.name}</h3>
                                <p className="text-sm text-gray-500">{child.gradeLevel}</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(child)}
                            className="text-gray-400 hover:text-primary hover:bg-primary/5"
                        >
                            <Edit2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}
