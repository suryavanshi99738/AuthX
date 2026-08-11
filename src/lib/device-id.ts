/**
 * device-id.ts
 *
 * Client-side persistent device identity.
 *
 * IMPORTANT: This file is client-side only (browser).
 * Do NOT import this in any server/API route file.
 *
 * Architecture:
 *   - getOrCreateDeviceId()  → stable random ID per browser instance, persisted in localStorage
 *   - getClientHints()       → collects browser signals (screen res, timezone, lang, platform, deviceId)
 *
 * The deviceId is the PRIMARY device identity.
 * Browser signals are SUPPORTING SECURITY EVIDENCE only.
 */

const DEVICE_ID_KEY = 'authx_device_id';

/**
 * Generates a cryptographically random 32-byte hex string.
 * Falls back to Math.random if Web Crypto is unavailable.
 */
function generateDeviceId(): string {
  try {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return 'did_' + Array.from(array).map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback (non-crypto): still random enough for device identity
    return 'did_fb_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 18);
  }
}

/**
 * Returns the stable persistent deviceId for this browser/profile.
 * Creates and stores one if not already present.
 * Returns null when called outside of a browser context (SSR).
 */
export function getOrCreateDeviceId(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing && existing.startsWith('did_')) {
      return existing;
    }
    const fresh = generateDeviceId();
    localStorage.setItem(DEVICE_ID_KEY, fresh);
    return fresh;
  } catch {
    // Storage blocked (private mode / security policy) — generate ephemeral id
    return generateDeviceId();
  }
}

/**
 * Collects browser-side signals that are sent alongside every auth request.
 * These are SUPPORTING signals, not the primary device identity.
 *
 * Safe to call in any browser context; returns empty strings on SSR.
 */
export interface ClientHints {
  deviceId: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
}

export function getClientHints(): ClientHints {
  if (typeof window === 'undefined') {
    return {
      deviceId: '',
      screenResolution: '',
      timezone: '',
      language: '',
      platform: '',
    };
  }

  return {
    deviceId: getOrCreateDeviceId() ?? '',
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    language: navigator.language || '',
    platform: navigator.platform || '',
  };
}
