import { api } from '../api';

/**
 * Upload folders available on the server.
 * Must match server-side validFolders list.
 */
export type UploadFolder = 'deposits' | 'teacher-docs' | 'disputes' | 'profile-photos' | 'intro-videos' | 'dispute-evidence';

/**
 * Allowed file types per folder
 */
const ALLOWED_TYPES: Record<UploadFolder, string[]> = {
    'profile-photos': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    'intro-videos': ['video/mp4', 'video/webm', 'video/quicktime'],
    'teacher-docs': ['image/jpeg', 'image/png', 'application/pdf'],
    'deposits': ['image/jpeg', 'image/png', 'application/pdf'],
    'disputes': ['image/jpeg', 'image/png', 'application/pdf'],
    'dispute-evidence': ['image/jpeg', 'image/png', 'application/pdf', 'video/mp4'],
};

/**
 * Maximum file sizes in bytes per folder
 */
const MAX_FILE_SIZES: Record<UploadFolder, number> = {
    'profile-photos': 5 * 1024 * 1024, // 5MB
    'intro-videos': 50 * 1024 * 1024, // 50MB
    'teacher-docs': 10 * 1024 * 1024, // 10MB
    'deposits': 5 * 1024 * 1024, // 5MB
    'disputes': 10 * 1024 * 1024, // 10MB
    'dispute-evidence': 20 * 1024 * 1024, // 20MB
};

/**
 * Maximum image dimensions for compression
 */
const MAX_IMAGE_DIMENSION = 1200; // pixels

/**
 * Validate file before upload
 */
export function validateFile(file: File, folder: UploadFolder): { valid: boolean; error?: string } {
    // Check file type
    const allowedTypes = ALLOWED_TYPES[folder];
    if (!allowedTypes.includes(file.type)) {
        const typeNames = allowedTypes.map(t => t.split('/')[1]).join(', ');
        return { valid: false, error: `نوع الملف غير مدعوم. الأنواع المسموحة: ${typeNames}` };
    }

    // Check file size
    const maxSize = MAX_FILE_SIZES[folder];
    if (file.size > maxSize) {
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
        return { valid: false, error: `حجم الملف كبير جداً. الحد الأقصى: ${maxSizeMB} ميجابايت` };
    }

    return { valid: true };
}

/**
 * Compress and resize an image file
 * Returns the compressed file, or the original if compression fails or isn't needed
 */
export async function compressImage(file: File, maxWidth = MAX_IMAGE_DIMENSION, quality = 0.8): Promise<File> {
    // Only compress images
    if (!file.type.startsWith('image/')) {
        return file;
    }

    // Don't compress small images
    if (file.size < 200 * 1024) { // Less than 200KB
        return file;
    }

    return new Promise((resolve) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.onload = () => {
            // Calculate new dimensions
            let { width, height } = img;

            if (width > maxWidth || height > maxWidth) {
                if (width > height) {
                    height = Math.round((height / width) * maxWidth);
                    width = maxWidth;
                } else {
                    width = Math.round((width / height) * maxWidth);
                    height = maxWidth;
                }
            }

            // Set canvas size and draw
            canvas.width = width;
            canvas.height = height;
            ctx?.drawImage(img, 0, 0, width, height);

            // Convert to blob
            canvas.toBlob(
                (blob) => {
                    if (blob && blob.size < file.size) {
                        // Compression successful and smaller
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        console.log(`Image compressed: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB`);
                        resolve(compressedFile);
                    } else {
                        // Compression didn't help, use original
                        resolve(file);
                    }
                },
                'image/jpeg',
                quality
            );
        };

        img.onerror = () => {
            // Failed to load image, return original
            resolve(file);
        };

        img.src = URL.createObjectURL(file);
    });
}

/**
 * Upload a file to the server.
 * 
 * @param file - File to upload
 * @param folder - Target folder
 * @param options - Upload options
 * @returns fileKey - Unique key to reference the file (store in DB)
 * 
 * Note: Files are NOT publicly accessible. Use getFileUrl() to get
 * an authenticated URL for viewing/downloading.
 */
export async function uploadFile(
    file: File,
    folder: UploadFolder,
    options?: { compress?: boolean; maxWidth?: number }
): Promise<string> {
    // Validate file
    const validation = validateFile(file, folder);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    // Compress images if requested or by default for certain folders
    let fileToUpload = file;
    const shouldCompress = options?.compress ?? ['profile-photos'].includes(folder);

    if (shouldCompress && file.type.startsWith('image/')) {
        fileToUpload = await compressImage(file, options?.maxWidth);
    }

    const formData = new FormData();
    formData.append('file', fileToUpload);

    const response = await api.post(`/storage?folder=${folder}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data.fileKey;
}

/**
 * Get the URL to view/download a file.
 * For public files (profile-photos, intro-videos), returns direct URL.
 * For private files, this URL won't work in browser without auth.
 * Use getAuthenticatedFileUrl() for private files in new tabs.
 *
 * @param fileKey - File key returned from uploadFile
 * @returns URL to access the file
 */
export function getFileUrl(fileKey: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    return `${baseUrl}/storage/file?key=${encodeURIComponent(fileKey)}`;
}

/**
 * Get an authenticated/signed URL for private files.
 * This fetches a URL from the backend that can be used to view files
 * in new tabs or <a> links without requiring auth headers.
 *
 * @param fileKey - File key returned from uploadFile
 * @returns Promise<string> - Signed URL to access the file
 */
export async function getAuthenticatedFileUrl(fileKey: string): Promise<string> {
    try {
        const response = await api.get(`/storage/url?key=${encodeURIComponent(fileKey)}`);
        return response.data.url;
    } catch (error) {
        console.error('Failed to get authenticated file URL:', error);
        // Fallback to basic URL (will fail for private files opened in new tabs)
        return getFileUrl(fileKey);
    }
}

/**
 * Delete a file (admin only).
 * 
 * @param fileKey - File key to delete
 */
export async function deleteFile(fileKey: string): Promise<void> {
    await api.delete(`/storage?key=${encodeURIComponent(fileKey)}`);
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get maximum allowed file size for a folder
 */
export function getMaxFileSize(folder: UploadFolder): number {
    return MAX_FILE_SIZES[folder];
}
