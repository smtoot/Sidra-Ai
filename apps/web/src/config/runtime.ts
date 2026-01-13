/**
 * Runtime configuration that gets loaded from the server
 * This avoids issues with build-time environment variable embedding
 */

interface RuntimeConfig {
  apiUrl: string;
  jitsiEnabled: boolean;
  jitsiDomain: string;
}

let cachedConfig: RuntimeConfig | null = null;

/**
 * Get runtime configuration
 * On server-side: reads from process.env
 * On client-side: returns cached config loaded from /api/config endpoint
 */
export function getRuntimeConfig(): RuntimeConfig {
  // Server-side: read directly from environment
  if (typeof window === 'undefined') {
    return {
      apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
      jitsiEnabled: process.env.NEXT_PUBLIC_JITSI_ENABLED === 'true',
      jitsiDomain: process.env.NEXT_PUBLIC_JITSI_DOMAIN || '',
    };
  }

  // Client-side: return cached config
  if (!cachedConfig) {
    throw new Error(
      'Runtime config not loaded. Make sure to call loadRuntimeConfig() before using the app.'
    );
  }

  return cachedConfig;
}

/**
 * Load runtime configuration from the server
 * Should be called once when the app initializes
 */
export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  if (typeof window === 'undefined') {
    // Server-side: return directly
    return getRuntimeConfig();
  }

  // Client-side: fetch from API endpoint
  try {
    const response = await fetch('/api/config');
    if (!response.ok) {
      throw new Error(`Failed to load config: ${response.status}`);
    }

    const config: RuntimeConfig = await response.json();
    cachedConfig = config;
    return config;
  } catch (error) {
    console.error('Failed to load runtime config:', error);

    // Fallback to localhost for development
    const fallbackConfig: RuntimeConfig = {
      apiUrl: 'http://localhost:4000',
      jitsiEnabled: false,
      jitsiDomain: '',
    };
    cachedConfig = fallbackConfig;

    return fallbackConfig;
  }
}

/**
 * Check if runtime config is loaded
 */
export function isRuntimeConfigLoaded(): boolean {
  return cachedConfig !== null;
}
