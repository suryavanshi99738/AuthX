/* ── BankShield Auth — Client-side API Service ── */

import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import type { RegistrationResponseJSON, AuthenticationResponseJSON } from '@simplewebauthn/browser';

/* ── Types ── */
interface ApiResult {
  success: boolean;
  error?: string;
  [key: string]: unknown;
}

interface UserResult {
  id: string;
  email: string;
  name: string | null;
}

interface SessionResult {
  token: string;
  expiresAt: string;
}

/* ── Helper ── */
async function apiCall(url: string, options?: RequestInit): Promise<ApiResult> {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const data = await res.json();
    return data as ApiResult;
  } catch (error) {
    console.error(`API call failed: ${url}`, error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

/* ── Auth APIs ── */

export async function createUserOrGet(email: string, name?: string): Promise<ApiResult & { user?: UserResult }> {
  return apiCall('/api/auth/user', {
    method: 'POST',
    body: JSON.stringify({ email, name }),
  });
}

export async function registerPasskey(userId: string, email: string): Promise<ApiResult & { options?: unknown }> {
  return apiCall('/api/auth/passkey/register', {
    method: 'POST',
    body: JSON.stringify({ userId, email }),
  });
}

export async function verifyPasskeyRegistration(
  userId: string,
  credential: RegistrationResponseJSON
): Promise<ApiResult> {
  return apiCall('/api/auth/passkey/verify', {
    method: 'POST',
    body: JSON.stringify({ userId, credential }),
  });
}

export async function authenticatePasskey(userId: string): Promise<ApiResult & { options?: unknown }> {
  return apiCall('/api/auth/passkey/authenticate', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export async function verifyPasskeyAuth(
  userId: string,
  credential: AuthenticationResponseJSON
): Promise<ApiResult & { session?: SessionResult }> {
  return apiCall('/api/auth/passkey/auth-verify', {
    method: 'POST',
    body: JSON.stringify({ userId, credential }),
  });
}

export async function generateOTP(email: string): Promise<ApiResult & { userId?: string }> {
  return apiCall('/api/auth/otp/generate', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function verifyOTP(email: string, code: string): Promise<ApiResult & { userId?: string }> {
  return apiCall('/api/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

/* ── Sign Up (Email OTP) APIs ── */

export interface UserMethods {
  otp: boolean;
  passkey: boolean;
  biometric: boolean;
  qr: boolean;
}

export async function signupCheck(
  email: string
): Promise<ApiResult & { exists?: boolean; userId?: string; methods?: UserMethods }> {
  return apiCall('/api/auth/signup/check', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function signupInit(fullName: string, email: string, phone: string): Promise<ApiResult & { expiresAt?: string }> {
  return apiCall('/api/auth/signup/init', {
    method: 'POST',
    body: JSON.stringify({ fullName, email, phone }),
  });
}

export async function signupResend(email: string): Promise<ApiResult & { expiresAt?: string }> {
  return apiCall('/api/auth/signup/resend', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function signupVerify(email: string, code: string): Promise<ApiResult & { user?: UserResult; session?: SessionResult }> {
  return apiCall('/api/auth/signup/verify', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export async function createSession(userId: string): Promise<ApiResult & { session?: SessionResult }> {
  return apiCall('/api/auth/session', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export async function verifySession(token: string): Promise<ApiResult & { userId?: string }> {
  return apiCall(`/api/auth/session?token=${encodeURIComponent(token)}`);
}

export async function deleteSession(token: string): Promise<ApiResult> {
  return apiCall('/api/auth/session', {
    method: 'DELETE',
    body: JSON.stringify({ token }),
  });
}

/* ── Demo APIs ── */

export async function startDemo(): Promise<ApiResult & { demoUser?: UserResult; demoSession?: SessionResult }> {
  return apiCall('/api/demo/start', { method: 'POST' });
}

export async function cleanupDemo(): Promise<ApiResult> {
  return apiCall('/api/demo/cleanup', { method: 'POST' });
}

export async function getDemoDashboard(token: string): Promise<ApiResult> {
  return apiCall(`/api/demo/dashboard?token=${encodeURIComponent(token)}`);
}

export async function demoPasskey(demoUserId: string): Promise<ApiResult> {
  return apiCall('/api/demo/passkey', {
    method: 'POST',
    body: JSON.stringify({ demoUserId }),
  });
}

export async function demoOTP(demoUserId: string): Promise<ApiResult & { otpCode?: string }> {
  return apiCall('/api/demo/otp', {
    method: 'POST',
    body: JSON.stringify({ demoUserId }),
  });
}

/* ── Full Passkey Flow (real) ── */
export async function performPasskeyRegistration(userId: string, email: string) {
  // Step 1: Get registration options
  const regResult = await registerPasskey(userId, email);
  if (!regResult.success || !regResult.options) {
    return { success: false, error: regResult.error || 'Failed to generate registration options' };
  }

  // Step 2: Browser WebAuthn ceremony (v13 expected call structure)
  let credential: RegistrationResponseJSON;
  try {
    credential = await startRegistration({ optionsJSON: regResult.options as PublicKeyCredentialCreationOptionsJSON });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Passkey registration was cancelled';
    return { success: false, error: msg };
  }

  // Step 3: Verify registration
  const verifyResult = await verifyPasskeyRegistration(userId, credential);
  if (!verifyResult.success) {
    return { success: false, error: verifyResult.error || 'Passkey verification failed' };
  }

  return { success: true };
}

export async function performPasskeyAuthentication(userId: string) {
  // Step 1: Get authentication options
  const authResult = await authenticatePasskey(userId);
  if (!authResult.success || !authResult.options) {
    return { success: false, error: authResult.error || 'Failed to generate authentication options' };
  }

  // Step 2: Browser WebAuthn ceremony (v13 expected call structure)
  let credential: AuthenticationResponseJSON;
  try {
    credential = await startAuthentication({ optionsJSON: authResult.options as PublicKeyCredentialRequestOptionsJSON });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Passkey authentication was cancelled';
    return { success: false, error: msg };
  }

  // Step 3: Verify authentication — creates a session on success
  const verifyResult = await verifyPasskeyAuth(userId, credential);
  if (!verifyResult.success || !verifyResult.session) {
    return { success: false, error: verifyResult.error || 'Passkey verification failed' };
  }

  return { success: true, session: verifyResult.session };
}

/* ── Passkey Sign Up APIs ── */

export async function passkeySignupOptions(
  fullName: string,
  email: string,
  phone: string
): Promise<ApiResult & { options?: unknown; prospectiveUserId?: string }> {
  return apiCall('/api/auth/passkey/signup/options', {
    method: 'POST',
    body: JSON.stringify({ fullName, email, phone }),
  });
}

export async function passkeySignupVerify(
  prospectiveUserId: string,
  credential: RegistrationResponseJSON
): Promise<ApiResult & { user?: UserResult; session?: SessionResult }> {
  return apiCall('/api/auth/passkey/signup/verify', {
    method: 'POST',
    body: JSON.stringify({ prospectiveUserId, credential }),
  });
}

/**
 * Full passkey sign-up flow:
 *   1. Request registration options (creates a pending sign-up record).
 *   2. Browser WebAuthn ceremony (create credential on the device).
 *   3. Verify the credential — on success the account + session are created.
 *
 * Returns the new user + session on success.
 */
export async function performPasskeySignup(fullName: string, email: string, phone: string) {
  // Step 1: Get registration options
  const optResult = await passkeySignupOptions(fullName, email, phone);
  if (!optResult.success || !optResult.options || !optResult.prospectiveUserId) {
    return { success: false, error: optResult.error || 'Failed to start passkey sign-up' };
  }

  // Step 2: Browser WebAuthn ceremony (v13 expected call structure)
  let credential: RegistrationResponseJSON;
  try {
    credential = await startRegistration({ optionsJSON: optResult.options as PublicKeyCredentialCreationOptionsJSON });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Passkey creation was cancelled';
    return { success: false, error: msg };
  }

  // Step 3: Verify — creates the account + session atomically
  const verifyResult = await passkeySignupVerify(optResult.prospectiveUserId, credential);
  if (!verifyResult.success || !verifyResult.user || !verifyResult.session) {
    return { success: false, error: verifyResult.error || 'Passkey verification failed' };
  }

  return {
    success: true,
    user: verifyResult.user,
    session: verifyResult.session,
  };
}
