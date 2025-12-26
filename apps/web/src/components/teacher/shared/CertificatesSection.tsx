'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { teacherApi, TeacherDocument, DocumentType } from '@/lib/api/teacher';
import { uploadFile } from '@/lib/api/upload';
import { AuthenticatedImage } from '@/components/ui/AuthenticatedImage';
import { Upload, Trash2, FileText, Loader2, GraduationCap, Award } from 'lucide-react';
import { toast } from 'sonner';

interface CertificatesSectionProps {
    /** Whether the component is in read-only mode */
    disabled?: boolean;
    /** Callback when certificates change */
    onCertificatesChange?: (certificates: TeacherDocument[]) => void;
}

/**
 * Certificates section for education & qualifications.
 * Allows uploading certificates, degrees, and educational documents.
 * Used in both Experience step (Onboarding) and Qualifications section (Profile Hub).
 */
export function CertificatesSection({ disabled = false, onCertificatesChange }: CertificatesSectionProps) {
    const [certificates, setCertificates] = useState<TeacherDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<'CERTIFICATE' | 'DEGREE'>('CERTIFICATE');

    useEffect(() => {
        loadCertificates();
    }, []);

    const loadCertificates = async () => {
        try {
            const docs = await teacherApi.getDocuments();
            // Filter only certificates and degrees (not ID cards)
            const certs = docs.filter(d => d.type === 'CERTIFICATE' || d.type === 'DEGREE');
            setCertificates(certs);
            onCertificatesChange?.(certs);
        } catch (error) {
            console.error('Failed to load certificates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileKey = await uploadFile(file, 'teacher-docs');
            const newDoc = await teacherApi.addDocument({
                type: selectedType,
                fileKey,
                fileName: file.name,
            });

            const updated = [...certificates, newDoc];
            setCertificates(updated);
            onCertificatesChange?.(updated);
            toast.success('تم رفع الشهادة بنجاح ✅');
        } catch (error: any) {
            console.error('Failed to upload certificate:', error);
            toast.error(error?.message || 'فشل رفع الشهادة');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleDelete = async (docId: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه الشهادة؟')) return;

        setDeleting(docId);
        try {
            await teacherApi.removeDocument(docId);
            const updated = certificates.filter(c => c.id !== docId);
            setCertificates(updated);
            onCertificatesChange?.(updated);
            toast.success('تم حذف الشهادة');
        } catch (error) {
            console.error('Failed to delete certificate:', error);
            toast.error('فشل حذف الشهادة');
        } finally {
            setDeleting(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-4 border-t pt-6 mt-6">
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                        <Award className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <h3 className="font-bold">الشهادات والمؤهلات</h3>
                        <p className="text-xs text-text-subtle">اختياري - يعزز ثقة أولياء الأمور</p>
                    </div>
                </div>
                <span className="text-sm text-gray-500">{certificates.length} شهادة</span>
            </div>

            {/* Upload Section */}
            {!disabled && (
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value as 'CERTIFICATE' | 'DEGREE')}
                        className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm"
                        disabled={uploading}
                    >
                        <option value="CERTIFICATE">شهادة تدريبية / دورة</option>
                        <option value="DEGREE">شهادة جامعية / أكاديمية</option>
                    </select>

                    <label className="flex-1">
                        <input
                            type="file"
                            accept="image/jpeg,image/png,application/pdf"
                            onChange={handleUpload}
                            disabled={uploading}
                            className="hidden"
                        />
                        <div className={`
                            flex items-center justify-center gap-2 px-4 py-2 rounded-lg
                            cursor-pointer transition-colors border-2 border-dashed
                            ${uploading
                                ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200'
                                : 'bg-primary/5 text-primary border-primary/30 hover:bg-primary/10'
                            }
                        `}>
                            {uploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    جاري الرفع...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" />
                                    رفع شهادة
                                </>
                            )}
                        </div>
                    </label>
                </div>
            )}

            {/* Certificates List */}
            {certificates.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <GraduationCap className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">لم تقم بإضافة أي شهادات بعد</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {certificates.map((cert) => (
                        <div
                            key={cert.id}
                            className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                        >
                            {/* Preview */}
                            {cert.fileName.match(/\.(jpg|jpeg|png)$/i) ? (
                                <AuthenticatedImage
                                    fileKey={cert.fileUrl}
                                    alt={cert.fileName}
                                    className="h-24 w-full"
                                    enableFullView={true}
                                />
                            ) : (
                                <div className="h-24 w-full bg-gray-100 flex items-center justify-center">
                                    <FileText className="w-8 h-8 text-gray-400" />
                                </div>
                            )}

                            {/* Info */}
                            <div className="p-3 flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <span className={`
                                        inline-block px-2 py-0.5 text-xs font-medium rounded mb-1
                                        ${cert.type === 'DEGREE' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}
                                    `}>
                                        {cert.type === 'DEGREE' ? 'شهادة جامعية' : 'دورة تدريبية'}
                                    </span>
                                    <p className="text-sm truncate" title={cert.fileName}>
                                        {cert.fileName}
                                    </p>
                                </div>
                                {!disabled && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(cert.id)}
                                        disabled={deleting === cert.id}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                        {deleting === cert.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
