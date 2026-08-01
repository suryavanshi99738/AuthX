# AuthX Implementation Progress

This file serves as the project memory tracking features, authentication flows, modified files, and next implementation steps for **AuthX**.

---

## 📌 Status Summary
- **Current Sprint**: QR Code Authentication, Mobile Approval Workflow, Trusted Devices & Audit Login History
- **Last Updated**: August 1, 2026

---

## ✅ Features Completed

1. **Email OTP Authentication**
   * Server-side OTP generation, hashing, and email sending via Resend API.
   * OTP rate limiting per IP and email.
   * Single-use 6-digit codes with 5-minute TTL and 3-attempt limit.

2. **Existing Account Authentication Flow**
   * Detects existing accounts via `/api/auth/signup/check`.
   * Displays explicit warning: `"Account already exists. Authenticate using available methods."`
   * Dedicated Existing Account Auth Page with method availability badges (`Available`, `Not registered`, `Under Development`).

3. **WebAuthn / Passkey Registration & Hybrid QR Support**
   * Passwordless WebAuthn registration in Dashboard Security Settings (`DashboardContent.tsx`).
   * Configured `origins` array (`http://localhost:3000`, `http://127.0.0.1:3000`) and set `requireUserVerification: false`.
   * Multi-version safe extraction for `@simplewebauthn/server` v13 `registrationInfo` attributes.

4. **QR Code Cross-Device Authentication (New)**
   * **Desktop Generation**: Select QR Login -> Generates one-time 60s expiring QR code containing target URL `http://10.17.87.25:3000/qr-approve?requestId=<id>` (zero sensitive tokens or credentials inside QR).
   * **Desktop Polling**: Polls `/api/auth/qr/status` every 2 seconds with automatic 60s countdown timer. Automatically redirects Desktop to Dashboard upon mobile approval.
   * **Responsive Mobile Scanner**: Camera scanner option visible strictly on mobile layouts (`md:hidden`). Asks for camera permission only after user clicks "Scan QR".
   * **Mobile Approval Flow (`/qr-approve`)**: Displays request details (Windows Laptop, Browser, Time, Local Network) and `[Approve]` / `[Reject]` actions. Requires identity verification (Passkey if registered, else Email OTP).
   * **Device Trust Prompt**: Displays `"Trust this device for future approvals?"` popup after successful mobile approval. Saves fingerprint to database.

5. **Trusted Devices & Login History Dashboard Integration**
   * **Trusted Devices**: Fetches real trusted devices from SQLite via `/api/auth/devices` with `Remove Trust` functionality.
   * **Login History**: Real-time audit logs of laptop QR logins, mobile approvals, passkeys, timestamps, IP addresses, and statuses via `/api/auth/history`.

---

## 🔄 Current Authentication Flow

```
User Enters Email
    │
    ├─► New Email: Sign Up Flow (Name, Email, Phone) -> Email OTP / Passkey Verification -> Account Created -> Dashboard
    │
    └─► Existing Email: Existing Account Auth Page -> Warning: 'Account already exists. Authenticate using available methods.'
            │
            ├─► Email OTP
            ├─► Passkey (Biometrics / Security Key)
            └─► QR Login (Generate QR on Laptop -> Scan on Mobile -> Approve on Mobile -> Desktop Logged In)
```

---

## 📁 Files Changed

- `prisma/schema.prisma` - Added `QRLoginRequest`, `TrustedDevice`, and `LoginHistory` models & relations.
- `src/app/api/auth/qr/generate/route.ts` - Generates 60s one-time QR login request.
- `src/app/api/auth/qr/status/route.ts` - Status polling for desktop auto-login.
- `src/app/api/auth/qr/request-info/route.ts` - Request metadata endpoint for mobile approval page.
- `src/app/api/auth/qr/approve/route.ts` - Mobile approval/rejection endpoint with session generation & audit logging.
- `src/app/api/auth/devices/route.ts` & `trust/route.ts` - Trusted device management APIs.
- `src/app/api/auth/history/route.ts` - Audit login history API.
- `src/services/auth-client.ts` - Client API helpers for QR authentication, trusted devices, and history.
- `src/components/auth/QRAuthForm.tsx` - Desktop QR generation, 60s countdown, and status polling component.
- `src/components/auth/MobileQRScannerModal.tsx` - Mobile-only camera QR scanner modal.
- `src/app/qr-approve/page.tsx` - Mobile Approval Page with laptop metadata, verification, and Trust Device prompt.
- `src/components/auth/AuthPage.tsx` - Integrated QRAuthForm and mobile scanner button.
- `src/components/dashboard/DashboardContent.tsx` - Connected Trusted Devices with `Remove Trust` and Login History tabs.
- `progress.md` - Updated project memory.

---

## ➡️ Next Steps

- Test end-to-end local network flows with `npx next dev -p 3000`.
- Sync and push changes to GitHub repository.
