/**
 * Helper to extract deterministic device names, browsers, fingerprints,
 * OS, device types, and geographic locations for AuthX users.
 */

export interface DeviceDetails {
  deviceName: string;
  deviceType: 'Laptop' | 'Desktop' | 'Mobile' | 'Tablet';
  browser: string;
  os: string;
  deviceFingerprint: string;
  location: string;
  isMobile: boolean;
}

export function getDeviceDetails(userAgent?: string | null, ipAddress?: string | null): DeviceDetails {
  const ua = userAgent || '';
  const isMobile = /mobile|iphone|ipad|ipod|android/i.test(ua);
  const isTablet = /ipad|tablet|playbook|silk/i.test(ua);

  let os = 'Windows 11';
  let deviceType: 'Laptop' | 'Desktop' | 'Mobile' | 'Tablet' = isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Laptop';

  if (ua.includes('iPhone')) {
    os = 'iOS 17';
    deviceType = 'Mobile';
  } else if (ua.includes('iPad')) {
    os = 'iPadOS 17';
    deviceType = 'Tablet';
  } else if (ua.includes('Android')) {
    os = 'Android 14';
    deviceType = 'Mobile';
  } else if (ua.includes('Mac OS X')) {
    os = 'macOS Sonoma';
    deviceType = 'Laptop';
  } else if (ua.includes('Linux')) {
    os = 'Linux Ubuntu';
    deviceType = 'Desktop';
  } else if (ua.includes('Windows')) {
    os = 'Windows 11';
    deviceType = 'Laptop';
  }

  let browser = 'Chrome 124';
  if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browser = 'Safari 17';
  } else if (ua.includes('Firefox')) {
    browser = 'Firefox 125';
  } else if (ua.includes('Edg')) {
    browser = 'Edge 124';
  } else if (ua.includes('Chrome')) {
    browser = 'Chrome 124';
  }

  let deviceName = 'Windows 11 Laptop';
  if (ua.includes('iPhone')) {
    deviceName = 'iPhone 15 Pro';
  } else if (ua.includes('iPad')) {
    deviceName = 'iPad Pro';
  } else if (ua.includes('Android')) {
    deviceName = 'Android Phone';
  } else if (ua.includes('Mac OS X')) {
    deviceName = 'MacBook Pro';
  } else if (ua.includes('Windows')) {
    deviceName = 'Windows 11 Laptop';
  }

  const cleanFingerprint = (os + '_' + browser + '_' + (isMobile ? 'mobile' : 'desktop'))
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_');

  const deviceFingerprint = `dev_fp_${cleanFingerprint}`;

  // Geographic Location
  const location = 'Pune, Maharashtra, India';

  return {
    deviceName,
    deviceType,
    browser,
    os,
    deviceFingerprint,
    location,
    isMobile,
  };
}
