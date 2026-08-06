/**
 * Email service — server-side only.
 *
 * Sends transactional email via the Resend HTTP API.
 * The API key is read from `process.env.RESEND_API_KEY` and is NEVER exposed
 * to the client.
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

function buildVerificationHtml({ code, recipientName }: { code: string; recipientName?: string }): string {
  const greeting = recipientName
    ? `<p style="margin:0 0 16px;color:#1A312C;font-size:15px;">Hi ${escapeHtml(recipientName)},</p>`
    : `<p style="margin:0 0 16px;color:#1A312C;font-size:15px;">Hello,</p>`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>AuthX Verification Code</title>
  </head>
  <body style="margin:0;padding:0;background:#FFF4E1;font-family:Inter,Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF4E1;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="460" cellpadding="0" cellspacing="0" style="max-width:460px;width:100%;background:#ffffff;border:1px solid #E5D7C3;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(26,49,44,0.08);">
            <tr>
              <td style="background:#1A312C;padding:28px 32px;text-align:center;">
                <div style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">AuthX Platform</div>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 16px;">
                <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1A312C;">Verify your email</h1>
                ${greeting}
                <p style="margin:0 0 24px;color:#5C6E69;font-size:15px;line-height:1.6;">Your single-use login verification code is:</p>
                <div style="text-align:center;margin:0 0 24px;">
                  <div style="display:inline-block;font-family:'Courier New',monospace;font-size:36px;font-weight:700;letter-spacing:12px;color:#428475;background:#FFF4E1;border:1px solid #E5D7C3;border-radius:12px;padding:16px 28px;">${escapeHtml(code)}</div>
                </div>
                <p style="margin:0 0 28px;color:#5C6E69;font-size:15px;line-height:1.6;">This verification code expires in <strong style="color:#1A312C;">5 minutes</strong>.</p>
                <div style="border-top:1px solid #E5D7C3;padding-top:20px;">
                  <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.5;">If you did not request this code, please ignore this email.</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 28px;">
                <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;line-height:1.5;">© 2026 AuthX Platform. Real-time security authentication service.</p>
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
  return 'AuthX Platform <onboarding@resend.dev>';
}

/**
 * Send the OTP verification email via Resend API.
 */
export async function sendVerificationEmail(params: VerificationEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY is missing.');
    return { success: false, error: 'Email service key missing.' };
  }

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
        subject: 'Your AuthX Verification Code',
        html,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    const resData = (await res.json().catch(() => ({}))) as { id?: string; message?: string; statusCode?: number };

    if (!res.ok) {
      console.warn('[email] Resend API Error Response:', res.status, resData);
      return { success: false, error: resData.message || 'Resend email delivery failed.' };
    }

    console.log(`[email] Real-time email delivered via Resend! ID: ${resData.id} -> Recipient: ${params.to}`);
    return { success: true, messageId: resData.id };
  } catch (err) {
    console.warn('[email] Resend fetch error:', err);
    return { success: false, error: 'Failed to connect to email delivery service.' };
  }
}
