'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api/admin';
import { toast } from 'sonner';

interface EmailTemplate {
    id: string;
    name: string;
}

export default function EmailPreviewsPage() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [htmlContent, setHtmlContent] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [loadingTemplates, setLoadingTemplates] = useState(true);

    // Fetch available templates on mount
    useEffect(() => {
        async function fetchTemplates() {
            try {
                const data = await adminApi.getEmailTemplates();
                setTemplates(data);
                if (data.length > 0) {
                    setSelectedTemplate(data[0].id);
                }
            } catch (error) {
                console.error('Failed to fetch templates', error);
                toast.error('فشل في تحميل القوالب');
            } finally {
                setLoadingTemplates(false);
            }
        }
        fetchTemplates();
    }, []);

    // Fetch preview when selected template changes
    useEffect(() => {
        if (!selectedTemplate) return;

        async function fetchPreview() {
            setLoading(true);
            try {
                const html = await adminApi.getEmailPreview(selectedTemplate);
                setHtmlContent(html);
            } catch (error) {
                console.error('Failed to fetch preview', error);
                toast.error('فشل في تحميل المعاينة');
                setHtmlContent('<div style="padding: 20px; color: red;">فشل في تحميل المعاينة</div>');
            } finally {
                setLoading(false);
            }
        }

        fetchPreview();
    }, [selectedTemplate]);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Sidebar: Controls */}
                <div className="w-full md:w-1/4 bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
                    <h1 className="text-xl font-bold text-gray-900 mb-6">معاينة البريد الإلكتروني</h1>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                اختر القالب
                            </label>
                            {loadingTemplates ? (
                                <div className="animate-pulse h-10 bg-gray-100 rounded"></div>
                            ) : (
                                <select
                                    value={selectedTemplate}
                                    onChange={(e) => setSelectedTemplate(e.target.value)}
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500 text-right dir-rtl"
                                >
                                    {templates.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
                            <p>هذه معاينة حية للقالب باستخدام بيانات افتراضية.</p>
                        </div>
                    </div>
                </div>

                {/* Main Area: Preview */}
                <div className="w-full md:w-3/4 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden min-h-[600px] flex flex-col">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h2 className="font-semibold text-gray-700">شاشة المعاينة</h2>
                        <div className="text-xs text-gray-400">Rendered HTML</div>
                    </div>

                    <div className="flex-1 relative bg-gray-100 p-4">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <div className="bg-white mx-auto shadow-lg max-w-[650px] min-h-[500px] rounded-sm overflow-hidden">
                                <iframe
                                    srcDoc={htmlContent}
                                    title="Email Preview"
                                    className="w-full h-[800px] border-none"
                                    sandbox="allow-same-origin"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
