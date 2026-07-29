import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/* ── WebAuthn Uint8Array ↔ Base64url Conversion Utilities ── */

/**
 * Convert a Uint8Array to a base64url-encoded string for storage in SQLite.
 * Base64url uses no padding and replaces '+' with '-' and '/' with '_'.
 */
export function uint8ArrayToBase64url(buffer: Uint8Array): string {
  const binaryString = Array.from(buffer)
    .map((byte) => String.fromCharCode(byte))
    .join('');
  const base64 = btoa(binaryString);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Convert a base64url-encoded string back to a Uint8Array for WebAuthn operations.
 */
export function base64urlToUint8Array(base64url: string): Uint8Array {
  // Restore padding and convert base64url → base64
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = (4 - (base64.length % 4)) % 4;
  base64 += '='.repeat(padding);
  const binaryString = atob(base64);
  const uint8Array = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    uint8Array[i] = binaryString.charCodeAt(i);
  }
  return uint8Array;
}

/**
 * Check if a value is a Uint8Array
 */
export function isUint8Array(value: unknown): value is Uint8Array {
  return value instanceof Uint8Array;
}
