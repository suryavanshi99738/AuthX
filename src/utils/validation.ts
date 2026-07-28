/**
 * Validation Utility Functions - Placeholder
 *
 * Provides validation utility functions for the
 * BankShield Auth application.
 *
 * Implementations will be added in future sprints.
 */

/**
 * Validates an email address format
 * @param email - The email address to validate
 * @returns True if the email is valid
 */
export function isEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates password strength
 * Checks for minimum length, uppercase, lowercase, numbers, and special characters
 * @param password - The password to validate
 * @returns Object with validation result and strength details
 */
export function isStrongPassword(password: string): {
  isValid: boolean;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  strength: 'none' | 'weak' | 'medium' | 'strong';
} {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  const criteriaMet = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecialChar].filter(Boolean).length;

  let strength: 'none' | 'weak' | 'medium' | 'strong';
  if (criteriaMet <= 1) strength = 'none';
  else if (criteriaMet <= 2) strength = 'weak';
  else if (criteriaMet <= 3) strength = 'medium';
  else strength = 'strong';

  return {
    isValid: hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
    strength,
  };
}

/**
 * Validates an OTP code format
 * @param code - The OTP code to validate
 * @param length - Expected OTP length (default: 6)
 * @returns True if the OTP code is valid
 */
export function isValidOTP(code: string, length: number = 6): boolean {
  const otpRegex = new RegExp(`^\\d{${length}}$`);
  return otpRegex.test(code);
}

/**
 * Validates a phone number format
 * @param phone - The phone number to validate
 * @returns True if the phone number is valid
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

/**
 * Validates a device fingerprint hash
 * @param fingerprint - The fingerprint hash to validate
 * @returns True if the fingerprint hash is valid
 */
export function isValidFingerprint(fingerprint: string): boolean {
  const hashRegex = /^[a-f0-9]{64}$/;
  return hashRegex.test(fingerprint);
}

/**
 * Validates an IP address (IPv4 or IPv6)
 * @param ip - The IP address to validate
 * @returns True if the IP address is valid
 */
export function isValidIPAddress(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Validates a session ID format
 * @param sessionId - The session ID to validate
 * @returns True if the session ID is valid
 */
export function isValidSessionId(sessionId: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(sessionId);
}

/**
 * Validates a URL format
 * @param url - The URL to validate
 * @returns True if the URL is valid
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
