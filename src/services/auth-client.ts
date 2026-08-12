/* ── BankShield Auth — Client-side API Service ── */

import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import type { RegistrationResponseJSON, AuthenticationResponseJSON } from '@simplewebauthn/browser';
import { getClientHints } from '@/lib/device-id';

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
async function apiCall(url: string, options?: RequestInit, retries = 1): Promise<ApiResult> {
  const mergedHeaders = {
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  };

  try {
    const res = await fetch(url, {
      cache: 'no-store',
      ...options,
      headers: mergedHeaders,
    });

    let data: Record<string, unknown> = {};
    try {
      data = await res.json();
    } catch {
      const text = await res.text().catch(() => '');
      return {
        success: false,
        error: text ? text.slice(0, 100) : `Server error (${res.status}). Please try again.`,
      };
    }

    if (!res.ok && !data.error) {
      data.error = (data.message as string) || `Request failed with status ${res.status}`;
    }

    return data as unknown as ApiResult;
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return apiCall(url, options, retries - 1);
    }
    console.warn(`API call failed: ${url}`, error);
    return {
      success: false,
      error: error instanceof Error && error.message ? error.message : 'Network connection issue. Please try again.',
    };
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
    body: JSON.stringify({ userId, credential, clientHints: getClientHints() }),
  });
}

export async function generateOTP(email: string, isDemo = false): Promise<ApiResult & { userId?: string; isDemo?: boolean; otpCode?: string }> {
  return apiCall('/api/auth/otp/generate', {
    method: 'POST',
    body: JSON.stringify({ email, isDemo }),
  });
}

export async function verifyOTP(email: string, code: string): Promise<ApiResult & { userId?: string; isDemo?: boolean }> {
  return apiCall('/api/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ email, code, clientHints: getClientHints() }),
  });
}

/* ── Authenticator App (TOTP) APIs ── */

export async function setupAuthenticator(userId: string): Promise<ApiResult & { secret?: string; otpauthUri?: string; issuer?: string; accountEmail?: string }> {
  return apiCall('/api/authenticator/setup', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export async function verifyAuthenticator(
  token: string,
  userId?: string,
  email?: string,
  isSetup = false
): Promise<ApiResult & { verified?: boolean; userId?: string }> {
  return apiCall('/api/authenticator/verify', {
    method: 'POST',
    body: JSON.stringify({ token, userId, email, isSetup }),
  });
}

export async function getAuthenticatorStatus(userId: string): Promise<ApiResult & { enabled?: boolean; configuredAt?: string | null; lastUsedAt?: string | null }> {
  return apiCall(`/api/authenticator/status?userId=${encodeURIComponent(userId)}`);
}

export async function disableAuthenticator(userId: string): Promise<ApiResult & { disabled?: boolean }> {
  return apiCall('/api/authenticator/disable', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

/* ── Sign Up (Email OTP) APIs ── */

export interface UserMethods {
  otp: boolean;
  passkey: boolean;
  authenticator?: boolean;
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

export async function signupInit(fullName: string, email: string, phone: string): Promise<ApiResult & { expiresAt?: string; otpCode?: string; emailSent?: boolean }> {
  return apiCall('/api/auth/signup/init', {
    method: 'POST',
    body: JSON.stringify({ fullName, email, phone }),
  });
}

export async function signupResend(email: string): Promise<ApiResult & { expiresAt?: string; otpCode?: string; emailSent?: boolean }> {
  return apiCall('/api/auth/signup/resend', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function signupVerify(email: string, code: string): Promise<ApiResult & { user?: UserResult; session?: SessionResult }> {
  return apiCall('/api/auth/signup/verify', {
    method: 'POST',
    body: JSON.stringify({ email, code, clientHints: getClientHints() }),
  });
}

export async function createSession(userId: string, loginMethod = 'Email OTP', isDemo = false): Promise<ApiResult & { session?: SessionResult }> {
  return apiCall('/api/auth/session', {
    method: 'POST',
    body: JSON.stringify({ userId, loginMethod, isDemo, clientHints: getClientHints() }),
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

const isUserCancellation = (err: unknown): boolean => {
  if (!err) return false;
  const str = (err instanceof Error ? err.message : String(err)).toLowerCase();
  const name = (err as { name?: string })?.name || '';
  return (
    name === 'NotAllowedError' ||
    name === 'AbortError' ||
    str.includes('not allowed') ||
    str.includes('timed out') ||
    str.includes('cancelled') ||
    str.includes('canceled') ||
    str.includes('abort') ||
    str.includes('privacy-considerations-client')
  );
};

/* ── Full Passkey Flow (real) ── */
export async function performPasskeyRegistration(userId: string, email: string) {
  // Step 1: Get registration options
  const regResult = await registerPasskey(userId, email);
  if (!regResult.success || !regResult.options) {
    return { success: false, error: regResult.error || 'Failed to generate registration options', code: regResult.code };
  }

  // Step 2: Browser WebAuthn ceremony (v13 expected call structure)
  let credential: RegistrationResponseJSON;
  try {
    credential = await startRegistration({ optionsJSON: regResult.options as PublicKeyCredentialCreationOptionsJSON });
  } catch (err) {
    const cancelled = isUserCancellation(err);
    const msg = cancelled ? 'Passkey registration was cancelled' : (err instanceof Error ? err.message : 'Passkey registration failed');
    return { success: false, error: msg, isCancelled: cancelled };
  }

  // Step 3: Verify registration
  const verifyResult = await verifyPasskeyRegistration(userId, credential);
  if (!verifyResult.success) {
    return { success: false, error: verifyResult.error || 'Passkey verification failed', code: verifyResult.code };
  }

  return { success: true };
}

export async function performPasskeyAuthentication(userId: string) {
  // Step 1: Get authentication options
  const authResult = await authenticatePasskey(userId);
  if (!authResult.success || !authResult.options) {
    return { success: false, error: authResult.error || 'Failed to generate authentication options', code: authResult.code };
  }

  // Step 2: Browser WebAuthn ceremony (v13 expected call structure)
  let credential: AuthenticationResponseJSON;
  try {
    credential = await startAuthentication({ optionsJSON: authResult.options as PublicKeyCredentialRequestOptionsJSON });
  } catch (err) {
    const cancelled = isUserCancellation(err);
    const msg = cancelled ? 'Passkey authentication was cancelled' : (err instanceof Error ? err.message : 'Passkey authentication failed');
    return { success: false, error: msg, isCancelled: cancelled, code: authResult.code };
  }

  // Step 3: Verify authentication — creates a session on success
  const verifyResult = await verifyPasskeyAuth(userId, credential);
  if (!verifyResult.success || !verifyResult.session) {
    return { success: false, error: verifyResult.error || 'Passkey verification failed', code: verifyResult.code };
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
    body: JSON.stringify({ prospectiveUserId, credential, clientHints: getClientHints() }),
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

/* ── QR Authentication APIs ── */

export async function generateQRRequest(deviceInfo?: string): Promise<ApiResult & { requestId?: string; expiresAt?: string; qrUrl?: string }> {
  return apiCall('/api/auth/qr/generate', {
    method: 'POST',
    body: JSON.stringify({ deviceInfo }),
  });
}

export async function checkQRStatus(requestId: string): Promise<ApiResult & { status?: string; sessionToken?: string; user?: UserResult }> {
  return apiCall(`/api/auth/qr/status?requestId=${encodeURIComponent(requestId)}`);
}

export async function getQRRequestInfo(requestId: string): Promise<ApiResult & { status?: string; deviceInfo?: string; ipAddress?: string; expiresAt?: string }> {
  return apiCall(`/api/auth/qr/request-info?requestId=${encodeURIComponent(requestId)}`);
}

export async function approveQRRequest(
  requestId: string,
  email: string,
  action: 'approve' | 'reject',
  mobileDeviceInfo?: string
): Promise<ApiResult & { status?: string; sessionToken?: string; user?: UserResult }> {
  return apiCall('/api/auth/qr/approve', {
    method: 'POST',
    body: JSON.stringify({ requestId, email, action, mobileDeviceInfo }),
  });
}

/* ── Trusted Devices & History APIs ── */

export async function getTrustedDevices(userId: string): Promise<ApiResult & { devices?: Array<{ id: string; deviceName: string; browser: string; lastActive: string; createdAt: string }> }> {
  return apiCall(`/api/auth/devices?userId=${encodeURIComponent(userId)}`);
}

export async function trustDevice(
  userId: string,
  deviceName: string,
  browser?: string,
  deviceFingerprint?: string
): Promise<ApiResult> {
  return apiCall('/api/auth/devices/trust', {
    method: 'POST',
    body: JSON.stringify({ userId, deviceName, browser, deviceFingerprint }),
  });
}

export async function removeTrustedDevice(deviceId: string): Promise<ApiResult> {
  return apiCall(`/api/auth/devices?deviceId=${encodeURIComponent(deviceId)}`, {
    method: 'DELETE',
  });
}

export async function getLoginHistory(userId: string): Promise<ApiResult & { history?: Array<{ id: string; method: string; device: string; browser: string; status: string; riskLevel?: string; ipAddress: string; createdAt: string }> }> {
  return apiCall(`/api/auth/history?userId=${encodeURIComponent(userId)}`);
}

/* ── Analytics, Risk, Settings & Lockdown APIs ── */

export async function getRiskAssessment(userId: string): Promise<ApiResult & { currentRisk?: { score: number; level: string; reasons: string[]; updatedAt: string; isHighRisk: boolean }; history?: Array<{ id: string; score: number; level: string; reasons: string[]; createdAt: string }> }> {
  return apiCall(`/api/auth/risk?userId=${encodeURIComponent(userId)}`);
}

export async function evaluateRisk(userId: string, ipAddress?: string, userAgent?: string): Promise<ApiResult> {
  const hints = getClientHints();
  return apiCall('/api/auth/risk', {
    method: 'POST',
    body: JSON.stringify({ userId, ipAddress, userAgent, deviceId: hints.deviceId }),
  });
}

export async function getSecurityAnalytics(userId: string): Promise<ApiResult & { analytics?: { totalLogins: number; failedLogins: number; passkeyCount: number; qrRequestsCount: number; authUsagePie: Array<{ name: string; value: number; fill: string }>; riskDistributionBar: Array<{ level: string; count: number; fill: string }>; loginTrendBar: Array<{ day: string; logins: number; fill: string }> } }> {
  return apiCall(`/api/auth/analytics?userId=${encodeURIComponent(userId)}`);
}

export async function getUserSettings(userId: string): Promise<ApiResult & { settings?: { theme: string; deviceLimit: number; sessionTimeout: number; qrExpiry: number; securityAlerts: boolean; loginAlerts: boolean; qrDisabled: boolean; passkeysDisabled: boolean; requireOTPOnly: boolean }; trustedDeviceCount?: number; isDeviceLimitReached?: boolean; deviceLimitMessage?: string }> {
  return apiCall(`/api/auth/settings?userId=${encodeURIComponent(userId)}`);
}

export async function updateUserSettings(userId: string, payload: Record<string, unknown>): Promise<ApiResult> {
  return apiCall('/api/auth/settings', {
    method: 'POST',
    body: JSON.stringify({ userId, ...payload }),
  });
}

export async function executeEmergencyLockdown(userId: string, action: string, currentToken?: string): Promise<ApiResult> {
  return apiCall('/api/auth/lockdown', {
    method: 'POST',
    body: JSON.stringify({ userId, action, currentToken }),
  });
}

/* ── Session Management APIs ── */

export interface SessionItem {
  id: string;
  token: string;
  userId: string;
  deviceName: string;
  deviceType: string;
  browser: string;
  os: string;
  deviceFingerprint: string;
  loginMethod: string;
  status: 'active' | 'idle' | 'expired' | 'revoked';
  isTrusted: boolean;
  isCurrent: boolean;
  ipAddress: string;
  maskedIp: string;
  location: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  userAgent: string;
  networkType: string;
  loginTime: string;
  lastActivity: string;
  lastSeen: string;
  expiresAt: string;
  duration: string;
  authStrength: {
    score: number;
    label: string;
    badgeColor: string;
  };
  isDemo?: boolean;
}

export async function getActiveSessions(userId: string, currentToken?: string): Promise<ApiResult & { summary?: { activeSessionsCount: number; totalSessionsCount: number; currentDeviceName: string; lastLoginTime: string }; sessions?: SessionItem[] }> {
  const url = `/api/auth/sessions?userId=${encodeURIComponent(userId)}${currentToken ? `&currentToken=${encodeURIComponent(currentToken)}` : ''}`;
  return apiCall(url);
}

export async function revokeSession(userId: string, sessionId: string, currentToken?: string): Promise<ApiResult> {
  return apiCall('/api/auth/sessions', {
    method: 'DELETE',
    body: JSON.stringify({ userId, sessionId, action: 'single', currentToken }),
  });
}

export async function revokeAllOtherSessions(userId: string, currentToken?: string): Promise<ApiResult> {
  return apiCall('/api/auth/sessions', {
    method: 'DELETE',
    body: JSON.stringify({ userId, action: 'revoke_others', currentToken }),
  });
}

export async function updateSessionActivity(sessionToken: string, isUserInteraction = true): Promise<ApiResult> {
  return apiCall('/api/auth/sessions/activity', {
    method: 'POST',
    body: JSON.stringify({ sessionToken, isUserInteraction }),
  });
}

/* ── Recovery Kit APIs ── */

export async function getRecoveryStatus(userId: string): Promise<ApiResult & { configured?: boolean; total?: number; remaining?: number }> {
  return apiCall(`/api/recovery/status?userId=${encodeURIComponent(userId)}`);
}

export async function generateRecoveryKit(userId: string): Promise<ApiResult & { codes?: string[]; count?: number; generatedAt?: string }> {
  return apiCall('/api/recovery/generate', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export async function verifyRecoveryCode(
  userId: string,
  recoveryCode: string,
  clientHints?: Record<string, unknown>
): Promise<ApiResult & { verified?: boolean; session?: { token: string; expiresAt: string; deviceName: string | null }; user?: UserResult; remainingCodes?: number }> {
  return apiCall('/api/recovery/verify', {
    method: 'POST',
    body: JSON.stringify({ userId, recoveryCode, clientHints }),
  });
}
