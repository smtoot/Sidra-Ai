'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '../OnboardingContext';
import { ArrowLeft, ArrowRight, Upload, FileText, X, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { uploadFile } from '@/lib/api/upload';
import { teacherApi } from '@/lib/api/teacher';

interface UploadedDoc {
    id: string;
    name: string;
    type: 'ID' | 'CERTIFICATE';
    url: string; // Used for UI display if needed, or just placeholder
}

export function DocumentsStep() {
    const { data, updateData, setCurrentStep } = useOnboarding();
    const [uploading, setUploading] = useState(false);

    // Derived state from context data to keep UI in sync
    const [idDoc, setIdDoc] = useState<UploadedDoc | null>(null);
    const [certificates, setCertificates] = useState<UploadedDoc[]>([]);

    const idInputRef = useRef<HTMLInputElement>(null);
    const certInputRef = useRef<HTMLInputElement>(null);

    // Sync local state with context data on mount/update
    useEffect(() => {
        if (data.documents) {
            const idDocument = data.documents.find((d: any) => d.type === 'ID_CARD');
            if (idDocument) {
                setIdDoc({
                    id: idDocument.id,
                    name: idDocument.fileName,
                    type: 'ID',
                    url: idDocument.fileUrl || ''
                });
            } else {
                setIdDoc(null);
            }

            const certs = data.documents.filter((d: any) => d.type !== 'ID_CARD');
            setCertificates(certs.map((d: any) => ({
                id: d.id,
                name: d.fileName,
                type: 'CERTIFICATE',
                url: d.fileUrl || ''
            })));
        }
    }, [data.documents]);

    const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            toast.error('الملفات المدعومة: PDF, JPG, PNG');
            return;
        }

        setUploading(true);
        try {
            // 1. Upload file to storage
            const fileKey = await uploadFile(file, 'teacher-docs');

            // 2. Add document record to backend
            const newDoc = await teacherApi.addDocument({
                type: 'ID_CARD',
                fileKey,
                fileName: file.name
            });

            // 3. Update Context
            const updatedDocs = [...data.documents, newDoc];
            updateData({ documents: updatedDocs });

            toast.success('تم رفع الهوية بنجاح');
        } catch (error) {
            console.error(error);
            toast.error('فشل رفع الملف');
        } finally {
            setUploading(false);
            // Reset input
            if (idInputRef.current) idInputRef.current.value = '';
        }
    };

    const handleCertUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            toast.error('الملفات المدعومة: PDF, JPG, PNG');
            return;
        }

        setUploading(true);
        try {
            // 1. Upload file to storage
            const fileKey = await uploadFile(file, 'teacher-docs');

            // 2. Add document record to backend
            const newDoc = await teacherApi.addDocument({
                type: 'CERTIFICATE', // Defaulting to CERTIFICATE for now, could be DEGREE
                fileKey,
                fileName: file.name
            });

            // 3. Update Context
            const updatedDocs = [...data.documents, newDoc];
            updateData({ documents: updatedDocs });

            toast.success('تم رفع الشهادة بنجاح');
        } catch (error) {
            console.error(error);
            toast.error('فشل رفع الملف');
        } finally {
            setUploading(false);
            if (certInputRef.current) certInputRef.current.value = '';
        }
    };

    const removeDocument = async (id: string) => {
        try {
            await teacherApi.removeDocument(id);
            const updatedDocs = data.documents.filter((d: any) => d.id !== id);
            updateData({ documents: updatedDocs });
            toast.success('تم حذف الملف');
        } catch (error) {
            toast.error('فشل حذف الملف');
        }
    };

    const handleNext = () => {
        setCurrentStep(5);
    };

    const handleSkip = () => {
        setCurrentStep(5);
    };

    return (
        <div className="space-y-8 font-tajawal">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold text-primary">الخطوة 4: الوثائق والشهادات</h1>
                <p className="text-text-subtle">هذه الخطوة اختيارية حالياً</p>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-right">
                <p className="text-blue-800">
                    💡 إضافة وثائقك يزيد ثقة أولياء الأمور ويرفع ترتيبك في نتائج البحث.
                </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
                {/* ID Document */}
                <div className="space-y-3">
                    <h3 className="font-bold text-gray-900">الهوية الشخصية</h3>
                    <input
                        ref={idInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleIdUpload}
                        className="hidden"
                    />
                    {idDoc ? (
                        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <Check className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <div className="font-medium text-green-800">{idDoc.name}</div>
                                    <div className="text-sm text-green-600">تم الرفع</div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeDocument(idDoc.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                <X className="w-4 h-4 ml-1" />
                                حذف
                            </Button>
                        </div>
                    ) : (
                        <div
                            onClick={() => idInputRef.current?.click()}
                            className={cn(
                                "border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer",
                                "hover:border-primary hover:bg-primary/5 transition-colors"
                            )}
                        >
                            {uploading ? (
                                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                            ) : (
                                <>
                                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-text-subtle">اضغط لرفع الهوية</p>
                                    <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG</p>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Certificates */}
                <div className="space-y-3">
                    <h3 className="font-bold text-gray-900">الشهادات العلمية</h3>
                    <input
                        ref={certInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleCertUpload}
                        className="hidden"
                    />

                    <div className="grid grid-cols-2 gap-3">
                        {certificates.map(cert => (
                            <div
                                key={cert.id}
                                className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                            >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                    <span className="text-sm truncate">{cert.name}</span>
                                </div>
                                <button
                                    onClick={() => removeDocument(cert.id)}
                                    className="p-1 hover:bg-gray-200 rounded text-red-500"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}

                        {/* Add More Button */}
                        <div
                            onClick={() => certInputRef.current?.click()}
                            className={cn(
                                "border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer",
                                "hover:border-primary hover:bg-primary/5 transition-colors",
                                "flex flex-col items-center justify-center min-h-[80px]"
                            )}
                        >
                            {uploading ? (
                                <Loader2 className="w-5 h-5 text-primary animate-spin mb-1" />
                            ) : (
                                <Upload className="w-5 h-5 text-gray-400 mb-1" />
                            )}
                            <span className="text-sm text-text-subtle">إضافة شهادة</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-4">
                <Button
                    variant="outline"
                    onClick={() => setCurrentStep(3)}
                    className="gap-2"
                >
                    <ArrowRight className="w-4 h-4" />
                    السابق
                </Button>
                <div className="flex gap-3">
                    <Button
                        variant="ghost"
                        onClick={handleSkip}
                    >
                        تخطي
                    </Button>
                    <Button
                        onClick={handleNext}
                        className="gap-2 px-6"
                    >
                        التالي
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
