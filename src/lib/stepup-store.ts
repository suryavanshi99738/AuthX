/**
 * Step-Up Authorization Store — server-side only, in-memory.
 *
 * Issues short-lived (5-minute), scoped, single-use step-up tokens
 * for Emergency Lockdown authorization.
 *
 * Each token is:
 *  - Tied to a specific userId
 *  - Scoped to 'emergency_lockdown'
 *  - Tied to the verification method used
 *  - Expires in 5 minutes
 *  - Consumed on first use (non-reusable)
 *  - Contains a cryptographically random nonce to prevent replay attacks
 *
 * Design: mirrors challenge-store.ts pattern. In production at scale,
 * replace with a distributed cache (Redis) with TTL.
 */

import { randomBytes } from 'node:crypto';

export const STEPUP_SCOPE = 'emergency_lockdown';
const STEPUP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const HARD_CAP = 1_000;
const SWEEP_EVERY_N_WRITES = 16;

export interface StepUpEntry {
  userId: string;
  scope: string;
  method: string; // 'totp' | 'passkey' | 'recovery_code'
  issuedAt: number;
  expiresAt: number;
}

const store = new Map<string, StepUpEntry>();
let writeCounter = 0;

function sweepExpired(): void {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.expiresAt) store.delete(key);
  }
}

function enforceCap(): void {
  while (store.size > HARD_CAP) {
    const oldestKey = store.keys().next().value;
    if (oldestKey === undefined) break;
    store.delete(oldestKey);
  }
}

/**
 * Issue a step-up authorization token tied to a userId and scope.
 * Returns the opaque token string — caller must return it to the client.
 */
export function issueStepUpToken(userId: string, method: string, scope = STEPUP_SCOPE): string {
  // Prune + cap on every write
  writeCounter++;
  if (writeCounter % SWEEP_EVERY_N_WRITES === 0) sweepExpired();
  enforceCap();

  // Revoke any existing step-up for this user+scope (one at a time)
  for (const [key, entry] of store) {
    if (entry.userId === userId && entry.scope === scope) store.delete(key);
  }

  const token = randomBytes(32).toString('hex'); // 256 bits of entropy
  store.set(token, {
    userId,
    scope,
    method,
    issuedAt: Date.now(),
    expiresAt: Date.now() + STEPUP_TTL_MS,
  });
  return token;
}

/**
 * Consume and validate a step-up token.
 * Returns the entry if valid; null if expired, wrong user, or already consumed.
 * Always deletes the token (single-use).
 */
export function consumeStepUpToken(
  token: string,
  userId: string,
  scope = STEPUP_SCOPE
): StepUpEntry | null {
  const entry = store.get(token);
  store.delete(token); // always delete — single use

  if (!entry) return null;
  if (Date.now() > entry.expiresAt) return null;
  if (entry.userId !== userId) return null;
  if (entry.scope !== scope) return null;

  return entry;
}
