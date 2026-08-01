/**
 * In-memory challenge store for WebAuthn registration and authentication.
 *
 * Challenges are short-lived (5 min) and single-use. To prevent unbounded
 * memory growth from abandoned ceremonies, expired entries are swept lazily on
 * every write. The Map is also capped; if it ever exceeds the cap (extreme
 * burst), the oldest entries are evicted.
 *
 * In production at scale, swap this for a distributed cache (e.g. Redis) with
 * a TTL. For this app's load it is sufficient and leak-free.
 */

interface ChallengeEntry {
  challenge: string;
  expiresAt: number;
}

const challenges = new Map<string, ChallengeEntry>();

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const SWEEP_EVERY_N_WRITES = 16; // sweep expired entries every N writes
const HARD_CAP = 5_000; // never hold more than this many entries

let writeCounter = 0;

/** Remove all expired entries from the map. O(n) over current size. */
function sweepExpired(): void {
  const now = Date.now();
  for (const [key, entry] of challenges) {
    if (now > entry.expiresAt) {
      challenges.delete(key);
    }
  }
}

/** Enforce the hard cap by evicting the oldest entries (FIFO via Map order). */
function enforceCap(): void {
  while (challenges.size > HARD_CAP) {
    const oldestKey = challenges.keys().next().value;
    if (oldestKey === undefined) break;
    challenges.delete(oldestKey);
  }
}

/**
 * Store a challenge for a given key (typically a userId or signup token).
 */
export function setChallenge(key: string, challenge: string, ttlMs: number = DEFAULT_TTL_MS): void {
  challenges.set(key, {
    challenge,
    expiresAt: Date.now() + ttlMs,
  });

  writeCounter++;
  if (writeCounter % SWEEP_EVERY_N_WRITES === 0) {
    sweepExpired();
  }
  enforceCap();
}

/**
 * Get and remove a challenge for a given key (one-time use). Returns null if
 * the key is unknown or the challenge has expired.
 */
export function getChallenge(key: string): string | null {
  const entry = challenges.get(key);
  if (!entry) return null;

  // Single-use: always delete on read, whether expired or not.
  challenges.delete(key);

  if (Date.now() > entry.expiresAt) {
    return null;
  }

  return entry.challenge;
}

/**
 * Number of challenges currently held in memory (for diagnostics/testing).
 */
export function challengeStoreSize(): number {
  return challenges.size;
}
