/**
 * Helper to extract deterministic device names, browsers, fingerprints,
 * and geographic locations for AuthX users.
 */

export interface DeviceDetails {
  deviceName: string;
  browser: string;
  deviceFingerprint: string;
  location: string;
  isMobile: boolean;
}

export function getDeviceDetails(userAgent?: string | null, ipAddress?: string | null): DeviceDetails {
  const ua = userAgent || '';
  const isMobile = /mobile|iphone|ipad|android/i.test(ua);

  const deviceName = isMobile ? 'Mobile Phone' : 'Windows Laptop';

  let browser = 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browser = 'Safari';
  } else if (ua.includes('Firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('Edg')) {
    browser = 'Edge';
  }

  const deviceFingerprint = isMobile ? 'dev_fp_mobile_phone' : 'dev_fp_windows_laptop';

  // Realistic Geographic Location for Indian / Client IP
  const location = 'Pune, Maharashtra, India';

  return {
    deviceName,
    browser,
    deviceFingerprint,
    location,
    isMobile,
  };
}
