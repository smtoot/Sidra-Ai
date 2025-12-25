'use client';

import { useState, useEffect } from 'react';
import { teacherApi, TeacherDocument, DocumentType } from '@/lib/api/teacher';
import { uploadFile } from '@/lib/api/upload';
import { AuthenticatedImage } from '@/components/ui/AuthenticatedImage';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, FileText, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TeacherDocumentUploadProps {
    /** Callback when documents change */
    onDocumentsChange?: (documents: TeacherDocument[]) => void;
    /** Whether the component is in read-only mode */
    disabled?: boolean;
}

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
    { value: 'ID_CARD', label: 'بطاقة الهوية' },
    { value: 'CERTIFICATE', label: 'شهادة تعليمية' },
    { value: 'DEGREE', label: 'شهادة جامعية' },
    { value: 'OTHER', label: 'مستند آخر' },
];

/**
 * Teacher document upload component.
 * Allows teachers to upload ID cards, certificates, degrees, etc.
 */
export function TeacherDocumentUpload({ onDocumentsChange, disabled = false }: TeacherDocumentUploadProps) {
    const [documents, setDocuments] = useState<TeacherDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<DocumentType>('CERTIFICATE');

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        try {
            const docs = await teacherApi.getDocuments();
            setDocuments(docs);
            onDocumentsChange?.(docs);
        } catch (error) {
            console.error('Failed to load documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            // uploadFile handles validation and compression
            const fileKey = await uploadFile(file, 'teacher-docs');

            // Add document record
            const newDoc = await teacherApi.addDocument({
                type: selectedType,
                fileKey,
                fileName: file.name,
            });

            // Update state
            const updatedDocs = [...documents, newDoc];
            setDocuments(updatedDocs);
            onDocumentsChange?.(updatedDocs);

            toast.success('تم رفع المستند بنجاح ✅');
        } catch (error: any) {
            console.error('Failed to upload document:', error);
            // Show validation error or server error
            toast.error(error?.message || error?.response?.data?.message || 'فشل رفع المستند');
        } finally {
            setUploading(false);
            // Reset file input
            e.target.value = '';
        }
    };

    const handleDelete = async (docId: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا المستند؟')) return;

        setDeleting(docId);
        try {
            await teacherApi.removeDocument(docId);
            const updatedDocs = documents.filter(d => d.id !== docId);
            setDocuments(updatedDocs);
            onDocumentsChange?.(updatedDocs);
            toast.success('تم حذف المستند');
        } catch (error: any) {
            console.error('Failed to delete document:', error);
            toast.error('فشل حذف المستند');
        } finally {
            setDeleting(null);
        }
    };

    const getDocumentTypeLabel = (type: DocumentType) => {
        return DOCUMENT_TYPES.find(t => t.value === type)?.label || type;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-primary">المستندات والشهادات</h3>
                <span className="text-sm text-text-subtle">
                    {documents.length} مستند
                </span>
            </div>

            {/* Upload Section */}
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6">
                <div className="flex flex-col md:flex-row items-center gap-4">
                    {/* Document Type Selector */}
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value as DocumentType)}
                        className="px-4 py-2 rounded-lg border border-gray-300 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                        disabled={uploading || disabled}
                    >
                        {DOCUMENT_TYPES.map(type => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>

                    {/* File Input */}
                    <label className="flex-1 w-full">
                        <input
                            type="file"
                            accept="image/jpeg,image/png,application/pdf"
                            onChange={handleFileChange}
                            disabled={uploading || disabled}
                            className="hidden"
                        />
                        <div className={`
                            flex items-center justify-center gap-2 px-6 py-3 rounded-lg
                            cursor-pointer transition-colors
                            ${(uploading || disabled)
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-primary text-white hover:bg-primary/90'
                            }
                        `}>
                            {uploading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    جاري الرفع...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-5 h-5" />
                                    اختر ملف
                                </>
                            )}
                        </div>
                    </label>
                </div>

                <p className="text-xs text-text-subtle text-center mt-3">
                    الأنواع المسموحة: JPEG, PNG, PDF • الحد الأقصى: 5 ميجابايت
                </p>
            </div>

            {/* Documents List */}
            {documents.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-text-subtle">لم يتم رفع أي مستندات بعد</p>
                    <p className="text-sm text-gray-400 mt-1">
                        قم برفع شهاداتك ومستنداتك للتحقق من حسابك
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc) => (
                        <div
                            key={doc.id}
                            className="bg-surface border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        >
                            {/* Image Preview (for images) */}
                            {doc.fileName.match(/\.(jpg|jpeg|png)$/i) ? (
                                <AuthenticatedImage
                                    fileKey={doc.fileUrl}
                                    alt={doc.fileName}
                                    className="h-32 w-full"
                                    enableFullView={true}
                                />
                            ) : (
                                <div className="h-32 w-full bg-gray-100 flex items-center justify-center">
                                    <FileText className="w-12 h-12 text-gray-400" />
                                </div>
                            )}

                            {/* Document Info */}
                            <div className="p-4">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded mb-1">
                                            {getDocumentTypeLabel(doc.type)}
                                        </span>
                                        <p className="text-sm font-medium truncate" title={doc.fileName}>
                                            {doc.fileName}
                                        </p>
                                        <p className="text-xs text-text-subtle mt-1">
                                            {new Date(doc.uploadedAt).toLocaleDateString('ar-EG')}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(doc.id)}
                                        disabled={deleting === doc.id || disabled}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                        {deleting === doc.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Verification Notice */}
            {documents.length > 0 && (
                <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                        <p className="font-medium">في انتظار المراجعة</p>
                        <p className="text-yellow-700 mt-1">
                            سيتم مراجعة مستنداتك من قبل فريق الإدارة. قد يستغرق هذا 1-2 يوم عمل.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
