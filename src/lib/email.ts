/**
 * Email service — server-side only.
 *
 * Sends transactional email via the Resend HTTP API.
 * The API key is read from `process.env.RESEND_API_KEY` and is NEVER exposed
 * to the client (no `NEXT_PUBLIC_` prefix, never imported by client code).
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

interface SendEmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

interface VerificationEmailParams {
  to: string;
  code: string;
  recipientName?: string;
}

/**
 * Build a clean, professional HTML email for OTP verification.
 * The code is rendered large and clear. No sensitive data besides the code
 * itself is included.
 */
function buildVerificationHtml({ code, recipientName }: { code: string; recipientName?: string }): string {
  const greeting = recipientName
    ? `<p style="margin:0 0 16px;color:#475569;font-size:15px;">Hi ${escapeHtml(recipientName)},</p>`
    : `<p style="margin:0 0 16px;color:#475569;font-size:15px;">Hello,</p>`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Verify your email</title>
  </head>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="460" cellpadding="0" cellspacing="0" style="max-width:460px;width:100%;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.06);">
            <tr>
              <td style="background:linear-gradient(135deg,#2563EB 0%,#1E40AF 100%);padding:28px 32px;text-align:center;">
                <div style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:0.2px;">BankShield Auth</div>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 16px;">
                <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">Verify your email</h1>
                ${greeting}
                <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">Your verification code is:</p>
                <div style="text-align:center;margin:0 0 24px;">
                  <div style="display:inline-block;font-family:'Courier New',monospace;font-size:34px;font-weight:700;letter-spacing:10px;color:#2563EB;background:#eff6ff;border:1px solid #dbeafe;border-radius:12px;padding:16px 28px;">${escapeHtml(code)}</div>
                </div>
                <p style="margin:0 0 28px;color:#475569;font-size:15px;line-height:1.6;">This code expires in <strong style="color:#0f172a;">5 minutes</strong>.</p>
                <div style="border-top:1px solid #e2e8f0;padding-top:20px;">
                  <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.5;">If you did not request this, you can safely ignore this email — no account will be created.</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 28px;">
                <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;line-height:1.5;">© 2026 BankShield Auth. This is an automated message, please do not reply.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function resolveFrom(): string {
  const from = process.env.EMAIL_FROM;
  if (from && from.trim().length > 0) return from.trim();
  return 'BankShield Auth <onboarding@resend.dev>';
}

/**
 * Send the OTP verification email. Returns a structured result; never throws.
 * The plaintext code is only placed into the email body — it is never logged.
 */
export async function sendVerificationEmail(params: VerificationEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'Email service is not configured.' };
  }

  // Defensive guard: a missing/invalid code must never crash the route. Return
  // a structured failure instead so callers can surface a clean 503.
  if (!params.code || typeof params.code !== 'string' || params.code.length === 0) {
    return { success: false, error: 'Missing verification code.' };
  }

  let html: string;
  try {
    html = buildVerificationHtml({
      code: params.code,
      recipientName: params.recipientName,
    });
  } catch {
    return { success: false, error: 'Failed to build verification email.' };
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: resolveFrom(),
        to: [params.to],
        subject: 'Verify your email',
        html,
      }),
      // Avoid hanging the request indefinitely.
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      // Do not surface the raw upstream message to clients; return a generic error.
      return { success: false, error: 'Failed to send verification email.' };
    }

    const data = (await res.json()) as { id?: string };
    return { success: true, messageId: data.id };
  } catch {
    return { success: false, error: 'Failed to send verification email.' };
  }
}
