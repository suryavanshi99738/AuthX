/**
 * OTP (One-Time Password) utilities — server-side only.
 *
 * Security properties:
 *  - Uses `crypto.randomInt` (cryptographically secure) to generate 6-digit codes.
 *  - Hashes codes with scrypt + per-code random salt before storage.
 *  - Verifies with `crypto.timingSafeEqual` to prevent timing attacks.
 *  - Never logs, never returns the plaintext code.
 */

import { randomInt, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/** Generate a cryptographically-secure 6-digit OTP code. */
export function generateOtpCode(): string {
  // randomInt(0, 1_000_000) is uniform and CSPRNG-backed.
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

/** Hash an OTP code with a fresh random salt. Returns `saltHex:hashHex`. */
export function hashOtp(code: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(code, salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

/**
 * Verify an OTP code against a stored `salt:hash` string using a
 * constant-time comparison. Returns false on any mismatch or malformed input.
 */
export function verifyOtpHash(code: string, stored: string): boolean {
  const parts = stored.split(':');
  if (parts.length !== 2) return false;
  try {
    const salt = Buffer.from(parts[0], 'hex');
    const expected = Buffer.from(parts[1], 'hex');
    const actual = scryptSync(code, salt, expected.length);
    if (actual.length !== expected.length) return false;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
