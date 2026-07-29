/**
 * In-memory challenge store for WebAuthn registration and authentication challenges.
 * In production, this should be replaced with a distributed cache (e.g., Redis).
 */

const challenges = new Map<string, { challenge: string; expiresAt: number }>();

/**
 * Store a challenge for a given key (typically userId)
 */
export function setChallenge(key: string, challenge: string, ttlMs: number = 5 * 60 * 1000): void {
  challenges.set(key, {
    challenge,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Get and remove a challenge for a given key (one-time use)
 */
export function getChallenge(key: string): string | null {
  const entry = challenges.get(key);
  if (!entry) return null;

  // Clean up after retrieval (one-time use)
  challenges.delete(key);

  // Check if expired
  if (Date.now() > entry.expiresAt) {
    return null;
  }

  return entry.challenge;
}

/**
 * Clean up expired challenges (can be called periodically)
 */
export function cleanupExpiredChallenges(): void {
  const now = Date.now();
  for (const [key, entry] of challenges.entries()) {
    if (now > entry.expiresAt) {
      challenges.delete(key);
    }
  }
}
