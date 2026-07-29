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
): Promise<ApiResult> {
  return apiCall('/api/auth/passkey/auth-verify', {
    method: 'POST',
    body: JSON.stringify({ userId, credential }),
  });
}

export async function generateOTP(email: string): Promise<ApiResult & { otpId?: string }> {
  return apiCall('/api/auth/otp/generate', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function verifyOTP(email: string, code: string): Promise<ApiResult> {
  return apiCall('/api/auth/otp/verify', {
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

  // Step 2: Browser WebAuthn ceremony
  let credential: RegistrationResponseJSON;
  try {
    credential = await startRegistration(regResult.options as PublicKeyCredentialCreationOptionsJSON);
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

  // Step 2: Browser WebAuthn ceremony
  let credential: AuthenticationResponseJSON;
  try {
    credential = await startAuthentication(authResult.options as PublicKeyCredentialRequestOptionsJSON);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Passkey authentication was cancelled';
    return { success: false, error: msg };
  }

  // Step 3: Verify authentication
  const verifyResult = await verifyPasskeyAuth(userId, credential);
  if (!verifyResult.success) {
    return { success: false, error: verifyResult.error || 'Passkey verification failed' };
  }

  return { success: true };
}
