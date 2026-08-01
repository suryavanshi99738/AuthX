/**
 * WebAuthn / Passkey server configuration.
 *
 * Centralizes the Relying Party (RP) identity so every passkey route uses the
 * same values. Reads from environment variables so production can point at a
 * real HTTPS domain; falls back to safe localhost defaults for development.
 *
 * WebAuthn requires the RP ID and origin to match what the browser sees:
 *  - rpID:      the domain (no scheme/port). e.g. "localhost" or "app.example.com"
 *  - origin:    full origin with scheme and port. e.g. "http://localhost:3000"
 *               or "https://app.example.com"
 *
 * In development, `localhost` is treated as a secure context by browsers, so
 * passkeys work without HTTPS. Production MUST be HTTPS.
 */

export interface WebAuthnConfig {
  rpName: string;
  rpID: string;
  origin: string;
}

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  return undefined;
}

let cachedConfig: WebAuthnConfig | null = null;

/**
 * Resolve the WebAuthn config. Values are resolved once and cached for the
 * lifetime of the process. Env changes require a server restart.
 */
export function getWebAuthnConfig(): WebAuthnConfig {
  if (cachedConfig) return cachedConfig;

  const rpID = readEnv('WEBAUTHN_RP_ID') ?? 'localhost';
  const origin = readEnv('WEBAUTHN_ORIGIN') ?? 'http://localhost:3000';
  const rpName = readEnv('WEBAUTHN_RP_NAME') ?? 'BankShield Auth';

  // Basic sanity: origin must start with http:// or https://
  if (!/^https?:\/\//i.test(origin)) {
    throw new Error(
      `Invalid WEBAUTHN_ORIGIN "${origin}". Must start with http:// or https://`
    );
  }

  // rpID should be derivable from the origin host (no port). If the user set a
  // mismatched rpID we trust their explicit value, but derive a sensible default
  // from the origin when only the origin is configured.
  const derivedRpID = (() => {
    try {
      return new URL(origin).hostname;
    } catch {
      return rpID;
    }
  })();

  cachedConfig = {
    rpName,
    rpID: readEnv('WEBAUTHN_RP_ID') ?? derivedRpID,
    origin,
  };

  return cachedConfig;
}
