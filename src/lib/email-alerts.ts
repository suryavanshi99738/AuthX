/**
 * Centralized Email Security Alert Service — Server-Side Only.
 *
 * Sends non-blocking security notification emails via Resend HTTP API for:
 *   1. New Login Alert ("AuthX Security Alert — New Login Detected")
 *   2. New Device Alert ("AuthX Security Alert — New Device Detected")
 *   3. Suspicious Login Alert ("AuthX Security Alert — Suspicious Login Detected")
 *
 * Features:
 *   - Checks user settings before sending (loginAlerts, newDeviceAlerts, securityAlerts)
 *   - In-memory anti-spam deduplication cooldown (120s per event key)
 *   - Non-blocking execution: failures never break authentication or throw
 *   - No sensitive data exposed (no OTP, no TOTP secrets, no tokens)
 */

import { db } from '@/lib/db';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export interface SecurityAlertEmailParams {
  userId: string;
  email: string;
  type: 'new_login' | 'new_device' | 'suspicious_login';
  loginMethod: string;
  deviceName: string;
  deviceType?: string;
  os?: string;
  browser?: string;
  location?: string;
  ipAddress?: string;
  riskLevel?: string;
  riskScore?: number;
  riskReasons?: string[];
}

/**
 * In-memory deduplication cooldown map (key -> timestamp in ms)
 * Prevents alert loops or duplicate emails within a 2-minute window.
 */
const alertCooldownMap = new Map<string, number>();

/**
 * Mask IP address for privacy display (e.g. 10.17.87.***)
 */
function maskIpAddress(ip?: string | null): string {
  if (!ip) return '10.17.87.***';
  const parts = ip.trim().split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.***`;
  }
  return '10.17.87.***';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function resolveFromHeader(): string {
  const from = process.env.EMAIL_FROM;
  if (from && from.trim().length > 0) return from.trim();
  return 'AuthX Security <onboarding@resend.dev>';
}

/**
 * Build HTML email template for Security Alerts.
 */
function buildSecurityAlertHtml(params: SecurityAlertEmailParams): { subject: string; html: string } {
  const formattedIp = maskIpAddress(params.ipAddress);
  const dateStr = new Date().toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'medium',
    timeZone: 'Asia/Kolkata',
  });

  let subject = 'AuthX Security Alert';
  let headerTitle = 'Security Alert';
  let headerColor = '#1A312C';
  let badgeColor = '#428475';
  let alertBanner = '';

  if (params.type === 'new_login') {
    subject = 'AuthX Security Alert — New Login Detected';
    headerTitle = 'New Login Detected';
    alertBanner = `
      <div style="background:#F4FAF8;border:1px solid #D1E7E2;border-radius:12px;padding:16px;margin-bottom:20px;">
        <p style="margin:0;color:#1A312C;font-size:14px;line-height:1.5;">
          A new successful login to your AuthX account was completed.
        </p>
      </div>`;
  } else if (params.type === 'new_device') {
    subject = 'AuthX Security Alert — New Device Detected';
    headerTitle = 'New Device Connected';
    badgeColor = '#3B82F6';
    alertBanner = `
      <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:16px;margin-bottom:20px;">
        <p style="margin:0;color:#1E40AF;font-size:14px;line-height:1.5;">
          <strong>New Device Instance:</strong> A physical device instance not previously recognized was bound to your account.
        </p>
      </div>`;
  } else if (params.type === 'suspicious_login') {
    subject = 'AuthX Security Alert — Suspicious Login Detected';
    headerTitle = 'Suspicious Login Flagged';
    headerColor = '#7F1D1D';
    badgeColor = '#EF4444';

    const reasonsList = (params.riskReasons || [])
      .map((r) => `<li style="margin-bottom:4px;">${escapeHtml(r)}</li>`)
      .join('');

    alertBanner = `
      <div style="background:#FEF2F2;border:1px solid #FCA5A5;border-radius:12px;padding:16px;margin-bottom:20px;">
        <p style="margin:0 0 8px;color:#991B1B;font-size:14px;font-weight:700;">
          ⚠️ High-Risk Activity Detected (Risk Score: ${params.riskScore ?? 85}/100)
        </p>
        <p style="margin:0 0 8px;color:#7F1D1D;font-size:13px;line-height:1.5;">
          The Risk Engine flagged this login request due to the following anomalous factors:
        </p>
        <ul style="margin:0;padding-left:20px;color:#7F1D1D;font-size:13px;">
          ${reasonsList || '<li>Anomalous device or location pattern</li>'}
        </ul>
      </div>`;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#FFF4E1;font-family:Inter,Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF4E1;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border:1px solid #E5D7C3;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(26,49,44,0.08);">
            <tr>
              <td style="background:${headerColor};padding:24px 32px;text-align:center;">
                <div style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">AuthX Platform</div>
                <div style="font-size:12px;color:#A8DADC;margin-top:4px;">Security Notification Service</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 32px 24px;">
                <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#1A312C;">${escapeHtml(headerTitle)}</h1>
                
                ${alertBanner}

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5D7C3;border-radius:12px;margin-bottom:24px;font-size:13px;line-height:1.6;">
                  <tr>
                    <td style="padding:10px 16px;border-bottom:1px solid #E5D7C3;color:#5C6E69;width:35%;font-weight:600;">Authentication Method</td>
                    <td style="padding:10px 16px;border-bottom:1px solid #E5D7C3;color:#1A312C;font-weight:700;">${escapeHtml(params.loginMethod)}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 16px;border-bottom:1px solid #E5D7C3;color:#5C6E69;font-weight:600;">Device Name</td>
                    <td style="padding:10px 16px;border-bottom:1px solid #E5D7C3;color:#1A312C;font-weight:600;">${escapeHtml(params.deviceName)}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 16px;border-bottom:1px solid #E5D7C3;color:#5C6E69;font-weight:600;">OS & Browser</td>
                    <td style="padding:10px 16px;border-bottom:1px solid #E5D7C3;color:#1A312C;">${escapeHtml(params.os || 'Unknown OS')} • ${escapeHtml(params.browser || 'Browser')}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 16px;border-bottom:1px solid #E5D7C3;color:#5C6E69;font-weight:600;">Location</td>
                    <td style="padding:10px 16px;border-bottom:1px solid #E5D7C3;color:#1A312C;">${escapeHtml(params.location || 'Pune, Maharashtra, India')}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 16px;border-bottom:1px solid #E5D7C3;color:#5C6E69;font-weight:600;">IP Address</td>
                    <td style="padding:10px 16px;border-bottom:1px solid #E5D7C3;color:#1A312C;font-family:monospace;">${escapeHtml(formattedIp)}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 16px;color:#5C6E69;font-weight:600;">Date & Time</td>
                    <td style="padding:10px 16px;color:#1A312C;">${escapeHtml(dateStr)}</td>
                  </tr>
                </table>

                <div style="background:#FFF4E1;border:1px solid #E5D7C3;border-radius:12px;padding:16px;text-align:center;margin-bottom:24px;">
                  <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#1A312C;">Wasn't you?</p>
                  <p style="margin:0 0 14px;font-size:12px;color:#5C6E69;line-height:1.5;">
                    If you did not perform this login, immediately revoke active sessions or execute Emergency Lockdown in your AuthX Settings.
                  </p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 24px;border-top:1px solid #E5D7C3;">
                <p style="margin:16px 0 0;color:#94a3b8;font-size:11px;text-align:center;line-height:1.5;">
                  You received this security alert based on your notification preferences in AuthX Settings → Alert Notifications.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html };
}

/**
 * Main Async Security Email Dispatcher.
 * NON-BLOCKING: execution errors are caught and logged; never throws to caller.
 */
export async function sendSecurityAlertEmail(params: SecurityAlertEmailParams): Promise<void> {
  try {
    const { userId, email, type, deviceName, loginMethod } = params;

    if (!email || !email.includes('@')) {
      return;
    }

    // 1. Fetch UserSettings from DB to check notification preferences
    const settings = await db.userSettings.findUnique({
      where: { userId },
      select: {
        loginAlerts: true,
        newDeviceAlerts: true,
        securityAlerts: true,
      },
    });

    // Evaluate preference toggles
    if (type === 'new_login' && settings && settings.loginAlerts === false) {
      console.log(`[security-email] Skipping new_login alert for user ${userId} (disabled in settings).`);
      return;
    }
    if (type === 'new_device' && settings && settings.newDeviceAlerts === false) {
      console.log(`[security-email] Skipping new_device alert for user ${userId} (disabled in settings).`);
      return;
    }
    if (type === 'suspicious_login' && settings && settings.securityAlerts === false) {
      console.log(`[security-email] Skipping suspicious_login alert for user ${userId} (disabled in settings).`);
      return;
    }

    // 2. Anti-Spam / Deduplication Cooldown Check (2 minutes per event key)
    const cooldownKey = `${userId}:${type}:${deviceName}:${loginMethod}`;
    const now = Date.now();
    const lastSent = alertCooldownMap.get(cooldownKey);
    if (lastSent && now - lastSent < 120000) {
      console.log(`[security-email] Skipping duplicate alert (cooldown active): ${cooldownKey}`);
      return;
    }
    alertCooldownMap.set(cooldownKey, now);

    // Clean up old cooldown keys if map grows large
    if (alertCooldownMap.size > 500) {
      for (const [k, timestamp] of alertCooldownMap.entries()) {
        if (now - timestamp > 300000) alertCooldownMap.delete(k);
      }
    }

    // 3. Build Email Template
    const { subject, html } = buildSecurityAlertHtml(params);

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('[security-email] RESEND_API_KEY is missing. Alert email skipped.');
      return;
    }

    // 4. Send Email via Resend API
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: resolveFromHeader(),
        to: [email],
        subject,
        html,
      }),
    });

    const resData = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (res.ok) {
      console.log(`[security-email] Alert email (${type}) delivered via Resend! ID: ${resData.id} -> Recipient: ${email}`);
    } else {
      console.warn(`[security-email] Resend API response error (${res.status}):`, resData);
    }
  } catch (err) {
    // Non-blocking catch — email failures must NEVER break authentication
    console.warn('[security-email] Background security email dispatch error:', err);
  }
}
