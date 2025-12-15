
'use client';

import { useState, useEffect } from 'react';
import { parentApi } from '@/lib/api/parent';
import { Child } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';
import { ChildList } from './components/ChildList';
import { ChildFormModal } from './components/ChildFormModal';

export default function ChildrenPage() {
    const [children, setChildren] = useState<Child[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingChild, setEditingChild] = useState<Child | null>(null);

    useEffect(() => {
        fetchChildren();
    }, []);

    const fetchChildren = async () => {
        setIsLoading(true);
        try {
            const data = await parentApi.getChildren();
            setChildren(data);
        } catch (error) {
            console.error('Failed to fetch children:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddClick = () => {
        setEditingChild(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (child: Child) => {
        setEditingChild(child);
        setIsFormOpen(true);
    };

    const handleFormSuccess = () => {
        fetchChildren();
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Users className="w-8 h-8 text-primary" />
                        أبنائي
                    </h1>
                    <p className="text-gray-500 mt-2">إدارة حسابات الأبناء ومتابعتهم</p>
                </div>
                <Button onClick={handleAddClick} className="gap-2 shadow-lg hover:shadow-primary/20">
                    <Plus className="w-5 h-5" />
                    إضافة ابن
                </Button>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                </div>
            ) : (
                <ChildList childrenData={children} onEdit={handleEditClick} />
            )}

            {/* Form Modal */}
            <ChildFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSuccess={handleFormSuccess}
                editChild={editingChild}
            />
        </div>
    );
}
