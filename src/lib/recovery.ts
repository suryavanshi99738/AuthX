/**
 * Recovery Kit utilities — server-side only.
 *
 * Security properties:
 *  - Uses crypto.randomBytes (CSPRNG) for code generation.
 *  - Hashes codes with scrypt + per-code random salt.
 *  - Verifies with timingSafeEqual to prevent timing attacks.
 *  - Never logs, never returns plaintext codes after initial generation.
 */

import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const RECOVERY_CODE_BYTES = 4; // 4 bytes = 8 hex chars split into two 4-char groups
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Unambiguous: no 0/O/1/I

/**
 * Generate a single cryptographically-secure recovery code in XXXX-XXXX format.
 * Uses rejection sampling to ensure uniform distribution across the charset.
 */
function generateSingleCode(): string {
  const chars: string[] = [];
  while (chars.length < 8) {
    const byte = randomBytes(1)[0];
    // Rejection sampling: only accept values that map uniformly into charset
    const maxAcceptable = Math.floor(256 / CHARSET.length) * CHARSET.length;
    if (byte < maxAcceptable) {
      chars.push(CHARSET[byte % CHARSET.length]);
    }
  }
  return `${chars.slice(0, 4).join('')}-${chars.slice(4, 8).join('')}`;
}

/**
 * Generate exactly 12 unique cryptographically-secure recovery codes.
 * Returns plaintext codes — caller must hash before storage.
 */
export function generateRecoveryCodes(): string[] {
  const codes = new Set<string>();
  while (codes.size < 12) {
    codes.add(generateSingleCode());
  }
  return Array.from(codes);
}

/**
 * Normalize a recovery code: strip whitespace and dashes, uppercase.
 * Handles user input variations like "a7kp29qf", "A7KP 29QF", "A7KP-29QF".
 */
export function normalizeRecoveryCode(raw: string): string {
  return raw.replace(/[\s\-]/g, '').toUpperCase();
}

/**
 * Hash a recovery code with a fresh random salt.
 * Returns `saltHex:hashHex` — same format as OTP hashing.
 */
export function hashRecoveryCode(code: string): string {
  const normalized = normalizeRecoveryCode(code);
  const salt = randomBytes(16);
  const hash = scryptSync(normalized, salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

/**
 * Verify a recovery code against a stored `salt:hash` using constant-time
 * comparison. Returns false on any mismatch or malformed input.
 */
export function verifyRecoveryCode(rawInput: string, stored: string): boolean {
  const normalized = normalizeRecoveryCode(rawInput);
  const parts = stored.split(':');
  if (parts.length !== 2) return false;
  try {
    const salt = Buffer.from(parts[0], 'hex');
    const expected = Buffer.from(parts[1], 'hex');
    const actual = scryptSync(normalized, salt, expected.length);
    if (actual.length !== expected.length) return false;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
