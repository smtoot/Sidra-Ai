import { BadRequestException } from '@nestjs/common';

/**
 * Magic byte signatures for file type validation.
 * These are the first bytes of a file that identify its true type,
 * preventing MIME type spoofing attacks.
 */
const MAGIC_BYTES: Record<string, { signature: number[]; offset?: number }[]> =
  {
    // Images
    'image/jpeg': [
      { signature: [0xff, 0xd8, 0xff] }, // JPEG
    ],
    'image/png': [
      { signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }, // PNG
    ],
    'image/gif': [
      { signature: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] }, // GIF87a
      { signature: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] }, // GIF89a
    ],
    'image/webp': [
      { signature: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // RIFF header
      // WebP has RIFF....WEBP pattern, we check RIFF at start
    ],
    // Documents
    'application/pdf': [
      { signature: [0x25, 0x50, 0x44, 0x46] }, // %PDF
    ],
    // Video
    'video/mp4': [
      { signature: [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70] }, // ftyp at offset 4
      { signature: [0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70] }, // ftyp variant
      { signature: [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70] }, // ftyp variant
      { signature: [0x66, 0x74, 0x79, 0x70], offset: 4 }, // ftyp at offset 4 (generic)
    ],
    'video/webm': [
      { signature: [0x1a, 0x45, 0xdf, 0xa3] }, // EBML header
    ],
    'video/quicktime': [
      {
        signature: [0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70, 0x71, 0x74],
      }, // ftypqt
      { signature: [0x6d, 0x6f, 0x6f, 0x76] }, // moov
      { signature: [0x66, 0x74, 0x79, 0x70, 0x71, 0x74], offset: 4 }, // ftypqt at offset 4
    ],
  };

/**
 * Dangerous file signatures that should NEVER be allowed.
 * These indicate executable or script files that could be malicious.
 */
const DANGEROUS_SIGNATURES: { signature: number[]; description: string }[] = [
  { signature: [0x4d, 0x5a], description: 'Windows executable (MZ)' },
  {
    signature: [0x7f, 0x45, 0x4c, 0x46],
    description: 'Linux executable (ELF)',
  },
  { signature: [0xca, 0xfe, 0xba, 0xbe], description: 'Java class file' },
  {
    signature: [0x50, 0x4b, 0x03, 0x04],
    description: 'ZIP/JAR/Office document',
  },
  {
    signature: [0x3c, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74],
    description: 'HTML script tag',
  },
  { signature: [0x3c, 0x3f, 0x70, 0x68, 0x70], description: 'PHP opening tag' },
];

/**
 * Check if buffer starts with the given signature at the specified offset.
 */
function matchesSignature(
  buffer: Buffer,
  signature: number[],
  offset: number = 0,
): boolean {
  if (buffer.length < offset + signature.length) {
    return false;
  }
  for (let i = 0; i < signature.length; i++) {
    if (buffer[offset + i] !== signature[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Validate that the file's magic bytes match the claimed MIME type.
 * This prevents MIME type spoofing attacks where a malicious file
 * is disguised as an image or document.
 *
 * @param buffer - File content buffer
 * @param claimedMimeType - MIME type claimed by the client
 * @throws BadRequestException if validation fails
 */
export function validateMagicBytes(
  buffer: Buffer,
  claimedMimeType: string,
): void {
  // First, check for dangerous file types
  for (const dangerous of DANGEROUS_SIGNATURES) {
    if (matchesSignature(buffer, dangerous.signature)) {
      throw new BadRequestException(
        `Dangerous file type detected: ${dangerous.description}. Upload rejected.`,
      );
    }
  }

  // Check if we have magic byte definitions for this MIME type
  const signatures = MAGIC_BYTES[claimedMimeType];
  if (!signatures) {
    // No magic byte validation available for this type
    // For security, we only allow types we can validate
    throw new BadRequestException(
      `File type validation not supported for: ${claimedMimeType}`,
    );
  }

  // Check if the buffer matches any of the valid signatures
  const isValid = signatures.some(({ signature, offset = 0 }) =>
    matchesSignature(buffer, signature, offset),
  );

  if (!isValid) {
    throw new BadRequestException(
      `File content does not match claimed type: ${claimedMimeType}. ` +
        `This may indicate a spoofed file type.`,
    );
  }
}

/**
 * Detect the actual MIME type from magic bytes.
 * Returns null if the file type cannot be determined.
 */
export function detectMimeType(buffer: Buffer): string | null {
  for (const [mimeType, signatures] of Object.entries(MAGIC_BYTES)) {
    const matches = signatures.some(({ signature, offset = 0 }) =>
      matchesSignature(buffer, signature, offset),
    );
    if (matches) {
      return mimeType;
    }
  }
  return null;
}

/**
 * Check if a file appears to contain dangerous content.
 * Returns the description of the danger if found, null otherwise.
 */
export function detectDangerousContent(buffer: Buffer): string | null {
  for (const dangerous of DANGEROUS_SIGNATURES) {
    if (matchesSignature(buffer, dangerous.signature)) {
      return dangerous.description;
    }
  }
  return null;
}
