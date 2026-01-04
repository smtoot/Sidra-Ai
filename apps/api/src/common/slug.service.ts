import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Service for generating and managing teacher profile slugs
 */
@Injectable()
export class SlugService {
  constructor(private prisma: PrismaService) {}

  /**
   * Arabic to English transliteration map
   */
  private readonly arabicToEnglish: Record<string, string> = {
    ا: 'a',
    أ: 'a',
    إ: 'e',
    آ: 'a',
    ب: 'b',
    ت: 't',
    ث: 'th',
    ج: 'j',
    ح: 'h',
    خ: 'kh',
    د: 'd',
    ذ: 'th',
    ر: 'r',
    ز: 'z',
    س: 's',
    ش: 'sh',
    ص: 's',
    ض: 'd',
    ط: 't',
    ظ: 'z',
    ع: 'a',
    غ: 'gh',
    ف: 'f',
    ق: 'q',
    ك: 'k',
    ل: 'l',
    م: 'm',
    ن: 'n',
    ه: 'h',
    ة: 'a',
    و: 'w',
    ي: 'y',
    ى: 'a',
    ئ: 'e',
    ء: '',
    ؤ: 'o',
    لا: 'la',
    'ً': '',
    'ٌ': '',
    'ٍ': '',
    'َ': '',
    'ُ': '',
    'ِ': '',
    'ّ': '',
    'ْ': '',
  };

  /**
   * Generate a URL-safe slug from a display name
   * Transliterates Arabic to English
   */
  generateSlugFromName(displayName: string): string {
    if (!displayName || displayName.trim().length === 0) {
      return '';
    }

    let result = displayName.toLowerCase().trim();

    // Transliterate Arabic characters
    for (const [arabic, english] of Object.entries(this.arabicToEnglish)) {
      result = result.split(arabic).join(english);
    }

    // Replace spaces and special characters with hyphens
    result = result
      .replace(/\s+/g, '-') // spaces to hyphens
      .replace(/[^a-z0-9-]/g, '') // remove non-alphanumeric except hyphens
      .replace(/-+/g, '-') // collapse multiple hyphens
      .replace(/^-|-$/g, ''); // trim hyphens from ends

    // Ensure minimum length
    if (result.length < 4) {
      result = result.padEnd(4, '0');
    }

    // Ensure maximum length
    if (result.length > 40) {
      result = result.substring(0, 40);
    }

    return result;
  }

  /**
   * Validate a slug format
   */
  validateSlug(slug: string): { valid: boolean; error?: string } {
    if (!slug || slug.trim().length === 0) {
      return { valid: false, error: 'Slug cannot be empty' };
    }

    if (slug.length < 4) {
      return { valid: false, error: 'Slug must be at least 4 characters' };
    }

    if (slug.length > 40) {
      return { valid: false, error: 'Slug must be at most 40 characters' };
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return {
        valid: false,
        error: 'Slug can only contain lowercase letters, numbers, and hyphens',
      };
    }

    if (slug.startsWith('-') || slug.endsWith('-')) {
      return { valid: false, error: 'Slug cannot start or end with a hyphen' };
    }

    if (slug.includes('--')) {
      return { valid: false, error: 'Slug cannot contain consecutive hyphens' };
    }

    // Reserved slugs
    const reserved = [
      'admin',
      'api',
      'www',
      'mail',
      'support',
      'help',
      'search',
      'teachers',
      'login',
      'register',
    ];
    if (reserved.includes(slug)) {
      return { valid: false, error: 'This slug is reserved' };
    }

    return { valid: true };
  }

  /**
   * Check if a slug is available (not already taken)
   */
  async isSlugAvailable(
    slug: string,
    excludeTeacherId?: string,
  ): Promise<boolean> {
    const existing = await this.prisma.teacher_profiles.findFirst({
      where: {
        slug,
        ...(excludeTeacherId ? { id: { not: excludeTeacherId } } : {}),
      },
    });
    return !existing;
  }

  /**
   * Generate a unique slug, appending numbers if necessary
   */
  async generateUniqueSlug(
    displayName: string,
    excludeTeacherId?: string,
  ): Promise<string> {
    const baseSlug = this.generateSlugFromName(displayName);

    if (!baseSlug) {
      // Fallback for empty names
      return this.generateUniqueSlug('teacher', excludeTeacherId);
    }

    // Check if base slug is available
    if (await this.isSlugAvailable(baseSlug, excludeTeacherId)) {
      return baseSlug;
    }

    // Try with numeric suffix
    for (let i = 2; i <= 100; i++) {
      const candidateSlug = `${baseSlug}-${i}`;
      if (await this.isSlugAvailable(candidateSlug, excludeTeacherId)) {
        return candidateSlug;
      }
    }

    // Fallback: add random suffix
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    return `${baseSlug}-${randomSuffix}`;
  }

  /**
   * Set or update a teacher's slug (only if not locked)
   */
  async setTeacherSlug(
    teacherId: string,
    newSlug: string,
    confirmAndLock: boolean = false,
  ): Promise<{ slug: string; locked: boolean }> {
    const teacher = await this.prisma.teacher_profiles.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new BadRequestException('Teacher profile not found');
    }

    // Check if slug is already locked
    if (teacher.slugLockedAt) {
      throw new BadRequestException(
        'Slug is already locked and cannot be changed',
      );
    }

    // Validate slug format
    const validation = this.validateSlug(newSlug);
    if (!validation.valid) {
      throw new BadRequestException(validation.error);
    }

    // Check availability
    const available = await this.isSlugAvailable(newSlug, teacherId);
    if (!available) {
      throw new BadRequestException('This slug is already taken');
    }

    // Update the slug
    const updated = await this.prisma.teacher_profiles.update({
      where: { id: teacherId },
      data: {
        slug: newSlug,
        ...(confirmAndLock ? { slugLockedAt: new Date() } : {}),
      },
    });

    return {
      slug: updated.slug!,
      locked: !!updated.slugLockedAt,
    };
  }
}
