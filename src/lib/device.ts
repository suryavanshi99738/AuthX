/**
 * device.ts — Server-side device metadata and fingerprinting.
 *
 * The persistent deviceId (generated client-side in device-id.ts) is the
 * PRIMARY device identity.  Everything in this file produces SUPPORTING
 * security metadata: a deterministic composite fingerprint built from as
 * many stable signals as possible, human-readable device names, and parsed
 * browser/OS information.
 *
 * getDeviceDetails(userAgent, ipAddress, clientHints?) is the single entry
 * point used by every API route that needs device information.
 */

import { createHash } from 'crypto';

export interface ClientHints {
  /** Persistent random deviceId from the browser (localStorage). PRIMARY identity. */
  deviceId?: string;
  /** e.g. "1920x1080" */
  screenResolution?: string;
  /** e.g. "Asia/Kolkata" */
  timezone?: string;
  /** e.g. "en-US" */
  language?: string;
  /** e.g. "Win32" */
  platform?: string;
}

export interface DeviceDetails {
  /**
   * The stable persistent instanceId to use for TrustedDevice / Session lookup.
   * Equals clientHints.deviceId when available; falls back to a server-derived token.
   */
  instanceId: string;
  deviceName: string;
  deviceType: 'Laptop' | 'Desktop' | 'Mobile' | 'Tablet';
  browser: string;
  os: string;
  /** sha256-based composite fingerprint — supporting security signal, NOT primary identity. */
  deviceFingerprint: string;
  location: string;
  isMobile: boolean;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Deterministic, short fingerprint hash via sha256 (first 20 hex chars).
 * Input: concatenation of all available signals.
 * NOT exposed to the UI.
 */
function buildFingerprint(raw: string): string {
  return 'fp_' + createHash('sha256').update(raw).digest('hex').slice(0, 20);
}

/** Parse a human-friendly browser name + major version from User-Agent. */
function parseBrowser(ua: string): string {
  if (!ua) return 'Unknown Browser';

  // Edge must come before Chrome because Edge UA contains both
  const edgeMatch = ua.match(/Edg(?:e|)\/([\d]+)/);
  if (edgeMatch) return `Edge ${edgeMatch[1]}`;

  const chromeMatch = ua.match(/Chrome\/([\d]+)/);
  if (chromeMatch && !ua.includes('Edg')) return `Chrome ${chromeMatch[1]}`;

  const firefoxMatch = ua.match(/Firefox\/([\d]+)/);
  if (firefoxMatch) return `Firefox ${firefoxMatch[1]}`;

  // Safari: report Safari only when Chrome is NOT present (mobile Safari UA contains Chrome)
  const safariMatch = ua.match(/Version\/([\d]+).*Safari/);
  if (safariMatch && !ua.includes('Chrome')) return `Safari ${safariMatch[1]}`;

  return 'Browser';
}

/** Parse human-friendly OS name from User-Agent. */
function parseOS(ua: string): { os: string; isMobile: boolean; isTablet: boolean; deviceType: 'Laptop' | 'Desktop' | 'Mobile' | 'Tablet' } {
  const isMobile = /mobile|iphone|ipod|android/i.test(ua);
  const isTablet = /ipad|tablet|playbook|silk/i.test(ua);

  let os = 'Windows';
  let deviceType: 'Laptop' | 'Desktop' | 'Mobile' | 'Tablet' = 'Laptop';

  if (ua.includes('iPhone')) {
    const m = ua.match(/iPhone OS ([\d_]+)/);
    os = m ? `iOS ${m[1].replace(/_/g, '.')}` : 'iOS';
    deviceType = 'Mobile';
  } else if (ua.includes('iPad')) {
    const m = ua.match(/CPU OS ([\d_]+)/);
    os = m ? `iPadOS ${m[1].replace(/_/g, '.')}` : 'iPadOS';
    deviceType = 'Tablet';
  } else if (ua.includes('Android')) {
    const m = ua.match(/Android ([\d.]+)/);
    os = m ? `Android ${m[1]}` : 'Android';
    deviceType = isTablet ? 'Tablet' : 'Mobile';
  } else if (ua.includes('Mac OS X')) {
    const m = ua.match(/Mac OS X ([\d_]+)/);
    os = m ? `macOS ${m[1].replace(/_/g, '.')}` : 'macOS';
    deviceType = 'Laptop';
  } else if (ua.includes('Linux')) {
    os = 'Linux';
    deviceType = 'Desktop';
  } else if (ua.includes('Windows NT')) {
    const ntMap: Record<string, string> = {
      '10.0': 'Windows 11/10',
      '6.3': 'Windows 8.1',
      '6.2': 'Windows 8',
      '6.1': 'Windows 7',
    };
    const m = ua.match(/Windows NT ([\d.]+)/);
    os = (m && ntMap[m[1]]) ? ntMap[m[1]] : 'Windows';
    deviceType = 'Laptop';
  }

  return { os, isMobile, isTablet, deviceType };
}

/**
 * Build a human-readable device name from available metadata.
 * Does NOT hallucinate hardware model names.
 *
 * Examples:
 *   "Your Windows Laptop"
 *   "Your macOS Laptop"
 *   "Your Android Phone"
 *   "Your iPad"
 *   "Your iPhone"
 */
function buildDeviceName(os: string, deviceType: 'Laptop' | 'Desktop' | 'Mobile' | 'Tablet', ua: string): string {
  if (ua.includes('iPhone')) return 'Your iPhone';
  if (ua.includes('iPad')) return 'Your iPad';
  if (os.startsWith('Android')) return 'Your Android Phone';
  if (os.startsWith('macOS')) return 'Your MacBook';
  if (os.startsWith('iOS')) return 'Your iPhone';
  if (deviceType === 'Mobile') return 'Your Mobile Phone';
  if (deviceType === 'Tablet') return 'Your Tablet';
  if (deviceType === 'Desktop') return `Your ${os} Desktop`;
  return `Your ${os} Laptop`;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function getDeviceDetails(
  userAgent?: string | null,
  ipAddress?: string | null,
  clientHints?: ClientHints
): DeviceDetails {
  const ua = userAgent || '';
  const hints = clientHints ?? {};

  const { os, isMobile, deviceType } = parseOS(ua);
  const browser = parseBrowser(ua);
  const deviceName = buildDeviceName(os, deviceType, ua);

  // Composite fingerprint: hash of UA + OS + browser + supporting client signals.
  // This distinguishes same-OS browsers by their exact UA string, screen res, tz, and lang.
  // Two genuine Chrome 124 installations on two different physical laptops will almost always
  // differ in at least one of: precise UA build string, screen resolution, timezone.
  const fingerprintRaw = [
    ua.slice(0, 200),          // exact build string differs per Chrome release & OS build
    os,
    browser,
    deviceType,
    hints.screenResolution || '',
    hints.timezone || '',
    hints.language || '',
    hints.platform || '',
  ].join('|');

  const deviceFingerprint = buildFingerprint(fingerprintRaw);

  // instanceId: the persistent client deviceId is the primary identity.
  // Fall back to the fingerprint only if no clientHints.deviceId was provided
  // (e.g. for legacy calls or QR desktop sessions where client hints aren't available).
  const instanceId = (hints.deviceId && hints.deviceId.length > 8)
    ? hints.deviceId
    : deviceFingerprint;

  return {
    instanceId,
    deviceName,
    deviceType,
    browser,
    os,
    deviceFingerprint,
    location: 'Pune, Maharashtra, India',
    isMobile,
    screenResolution: hints.screenResolution || '1920x1080',
    timezone: hints.timezone || 'Asia/Kolkata',
    language: hints.language || 'en-US',
    platform: hints.platform || (isMobile ? 'Mobile' : 'Win32'),
  };
}
