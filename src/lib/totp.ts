import crypto from 'crypto';

/**
 * RFC 4648 Base32 Alphabet
 */
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Generate a cryptographically random Base32 TOTP secret.
 * Default 20 random bytes -> 32 Base32 characters.
 */
export function generateTotpSecret(length = 20): string {
  const buffer = crypto.randomBytes(length);
  let base32 = '';
  for (let i = 0; i < buffer.length; i++) {
    base32 += BASE32_ALPHABET[buffer[i] % 32];
  }
  return base32;
}

/**
 * Decode a Base32 string into a Buffer.
 */
export function base32Decode(base32: string): Buffer {
  const cleaned = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (let i = 0; i < cleaned.length; i++) {
    const val = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

/**
 * Generate RFC 6238 TOTP code (HMAC-SHA1, 6 digits, 30s time step).
 */
export function generateTotpCode(secret: string, windowOffset = 0, timeStepSeconds = 30): string {
  const key = base32Decode(secret);
  if (key.length === 0) return '000000';

  const epoch = Math.floor(Date.now() / 1000);
  const timeStep = Math.floor(epoch / timeStepSeconds) + windowOffset;

  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(timeStep));

  const hmac = crypto.createHmac('sha1', key);
  hmac.update(buf);
  const digest = hmac.digest();

  const offset = digest[digest.length - 1] & 0x0f;
  const codeInt =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const code = (codeInt % 1000000).toString().padStart(6, '0');
  return code;
}

/**
 * Verify a 6-digit TOTP token against secret with ±1 time step tolerance (clock drift).
 */
export function verifyTotpCode(secret: string, token: string, window = 1): boolean {
  if (!token || !/^\d{6}$/.test(token.trim())) {
    return false;
  }
  const normalizedToken = token.trim();

  for (let errorWindow = -window; errorWindow <= window; errorWindow++) {
    const expectedCode = generateTotpCode(secret, errorWindow);
    if (crypto.timingSafeEqual(Buffer.from(expectedCode), Buffer.from(normalizedToken))) {
      return true;
    }
  }
  return false;
}

/**
 * Build standard otpauth:// URI for authenticator app setup QR.
 */
export function generateTotpUri(secret: string, accountEmail: string, issuer = 'AuthX'): string {
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(accountEmail)}`;
  const params = `secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
  return `otpauth://totp/${label}?${params}`;
}

/**
 * AES-256-GCM Secret Encryption Key Derivation
 */
function getEncryptionKey(): Buffer {
  const rawKey = process.env.ENCRYPTION_KEY || process.env.DATABASE_URL || 'authx_totp_default_aes256_gcm_secret_key_32_bytes';
  return crypto.scryptSync(rawKey, 'authx_totp_salt_2026', 32);
}

/**
 * Encrypt TOTP secret before storing in PostgreSQL database.
 */
export function encryptSecret(secret: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt TOTP secret retrieved from PostgreSQL database.
 */
export function decryptSecret(encryptedData: string): string {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      // Fallback for unencrypted legacy format if any
      return encryptedData;
    }
    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Failed to decrypt TOTP secret:', err);
    throw new Error('Could not decrypt TOTP secret key.');
  }
}
