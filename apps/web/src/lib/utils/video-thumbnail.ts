/**
 * Utility functions to extract video thumbnails from YouTube and Vimeo URLs.
 */

// YouTube URL patterns and video ID extraction
const YOUTUBE_PATTERNS = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
    /youtu\.be\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/,
];

// Vimeo URL patterns and video ID extraction
const VIMEO_PATTERNS = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
];

export type VideoInfo = {
    platform: 'youtube' | 'vimeo';
    videoId: string;
    thumbnailUrl: string;
    embedUrl: string;
};

/**
 * Extract video ID from a YouTube URL
 */
function extractYouTubeId(url: string): string | null {
    for (const pattern of YOUTUBE_PATTERNS) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

/**
 * Extract video ID from a Vimeo URL
 */
function extractVimeoId(url: string): string | null {
    for (const pattern of VIMEO_PATTERNS) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

/**
 * Get YouTube thumbnail URL
 * Quality options: default, mqdefault, hqdefault, sddefault, maxresdefault
 */
function getYouTubeThumbnail(videoId: string, quality: 'default' | 'mq' | 'hq' | 'sd' | 'maxres' = 'mq'): string {
    const qualityMap = {
        default: 'default',
        mq: 'mqdefault',
        hq: 'hqdefault',
        sd: 'sddefault',
        maxres: 'maxresdefault',
    };
    return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

/**
 * Get YouTube embed URL for iframe
 */
function getYouTubeEmbedUrl(videoId: string): string {
    return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Get Vimeo thumbnail URL (uses a static thumbnail service)
 * Note: For more accurate thumbnails, use Vimeo's oEmbed API
 */
function getVimeoThumbnail(videoId: string): string {
    // Vimeo thumbnails require API call, but we can use a placeholder approach
    // This returns a URL that attempts to fetch from Vimeo's CDN
    return `https://vumbnail.com/${videoId}.jpg`;
}

/**
 * Get Vimeo embed URL for iframe
 */
function getVimeoEmbedUrl(videoId: string): string {
    return `https://player.vimeo.com/video/${videoId}`;
}

/**
 * Parse a video URL and extract all relevant information
 * @param url - YouTube or Vimeo URL
 * @returns VideoInfo object or null if URL is invalid
 */
export function parseVideoUrl(url: string): VideoInfo | null {
    if (!url || !url.trim()) {
        return null;
    }

    const trimmedUrl = url.trim();

    // Try YouTube
    const youtubeId = extractYouTubeId(trimmedUrl);
    if (youtubeId) {
        return {
            platform: 'youtube',
            videoId: youtubeId,
            thumbnailUrl: getYouTubeThumbnail(youtubeId, 'mq'),
            embedUrl: getYouTubeEmbedUrl(youtubeId),
        };
    }

    // Try Vimeo
    const vimeoId = extractVimeoId(trimmedUrl);
    if (vimeoId) {
        return {
            platform: 'vimeo',
            videoId: vimeoId,
            thumbnailUrl: getVimeoThumbnail(vimeoId),
            embedUrl: getVimeoEmbedUrl(vimeoId),
        };
    }

    return null;
}

/**
 * Check if a URL is a valid video URL (YouTube or Vimeo)
 */
export function isValidVideoUrl(url: string): boolean {
    return parseVideoUrl(url) !== null;
}

/**
 * Get thumbnail URL directly from a video URL
 * @param url - YouTube or Vimeo URL
 * @returns Thumbnail URL or null
 */
export function getVideoThumbnail(url: string): string | null {
    const info = parseVideoUrl(url);
    return info?.thumbnailUrl || null;
}
