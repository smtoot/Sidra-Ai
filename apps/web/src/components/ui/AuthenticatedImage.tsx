'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Image as ImageIcon, Loader2, ExternalLink } from 'lucide-react';

interface AuthenticatedImageProps {
    /** File key from the upload system (e.g., "deposits/userId/timestamp-file.jpg") */
    fileKey: string;
    /** Alt text for the image */
    alt?: string;
    /** CSS class for the image container */
    className?: string;
    /** CSS class for the image itself */
    imageClassName?: string;
    /** Show loading spinner */
    showLoader?: boolean;
    /** Allow click to view full size in modal */
    enableFullView?: boolean;
}

/**
 * Component that displays images from the authenticated storage system.
 * Fetches the image with JWT token and displays it using a blob URL.
 * 
 * Use this for receipt images, documents, etc. that require authentication.
 */
export function AuthenticatedImage({
    fileKey,
    alt = 'Image',
    className = '',
    imageClassName = '',
    showLoader = true,
    enableFullView = true,
}: AuthenticatedImageProps) {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [fileType, setFileType] = useState<string | null>(null); // Track mime type

    useEffect(() => {
        if (!fileKey) {
            setLoading(false);
            setError('No file key provided');
            return;
        }

        // Check if it's already a full URL (legacy)
        if (fileKey.startsWith('http://') || fileKey.startsWith('https://')) {
            setBlobUrl(fileKey);
            setLoading(false);
            return;
        }

        const fetchImage = async () => {
            setLoading(true);
            setError(null);

            // Check if token exists before making authenticated request
            const token = localStorage.getItem('token');
            if (!token) {
                console.warn('AuthenticatedImage: No auth token found, user might not be logged in');
                setError('يرجى تسجيل الدخول');
                setLoading(false);
                return;
            }

            try {
                const response = await api.get(`/storage/file?key=${encodeURIComponent(fileKey)}`, {
                    responseType: 'blob',
                });

                const blob = response.data;
                const url = URL.createObjectURL(blob);
                setBlobUrl(url);
                setFileType(blob.type); // Store file type (e.g. application/pdf)
            } catch (err: any) {
                // ... error handling ...
                // Provide specific error messages
                if (err?.response?.status === 401) {
                    setError('غير مصرح - يرجى تسجيل الدخول');
                    // console.warn(`AuthImage 401: ${fileKey}`);
                } else if (err?.response?.status === 403) {
                    setError('غير مسموح بالوصول');
                    // Expected for seed data mismatches or private files
                } else if (err?.response?.status === 404 || err?.response?.status === 400) {
                    setError('الملف غير موجود');
                } else {
                    console.error(`Failed to load image [${fileKey}]:`, err);
                    setError('فشل تحميل الصورة');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchImage();

        // Cleanup blob URL on unmount
        return () => {
            if (blobUrl && !blobUrl.startsWith('http')) {
                URL.revokeObjectURL(blobUrl);
            }
        };
    }, [fileKey]);

    if (loading && showLoader) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
        );
    }

    if (error || !blobUrl) {
        return (
            <div className={`flex flex-col items-center justify-center bg-gray-100 text-gray-400 ${className}`}>
                <ImageIcon className="w-8 h-8 mb-1" />
                <span className="text-xs">{error || 'لا توجد صورة'}</span>
            </div>
        );
    }

    // PDF View
    if (fileType === 'application/pdf' || fileKey.toLowerCase().endsWith('.pdf')) {
        return (
            <div
                className={`flex flex-col items-center justify-center bg-red-50 text-red-700 border border-red-100 ${className} ${enableFullView ? 'cursor-pointer hover:bg-red-100' : ''}`}
                onClick={() => {
                    if (enableFullView) window.open(blobUrl, '_blank');
                }}
            >
                <svg className="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-bold">ملف PDF</span>
                <span className="text-xs mt-1">اضغط للمعاينة</span>
            </div>
        );
    }

    return (
        <>
            <div
                className={`relative ${className} ${enableFullView ? 'cursor-pointer' : ''}`}
                onClick={enableFullView ? () => setShowModal(true) : undefined}
            >
                <img
                    src={blobUrl}
                    alt={alt}
                    className={`w-full h-full object-cover ${imageClassName}`}
                />
                {enableFullView && (
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                        <ExternalLink className="w-6 h-6 text-white" />
                    </div>
                )}
            </div>

            {/* Full-size modal */}
            {showModal && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowModal(false)}
                >
                    <div className="max-w-4xl max-h-[90vh] relative">
                        <img
                            src={blobUrl}
                            alt={alt}
                            className="max-w-full max-h-[90vh] object-contain rounded-lg"
                        />
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-2 right-2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
