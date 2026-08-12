<p align="center">
  <img src="public/logo.svg" alt="AuthX Logo" width="100" height="100" />
  <h1 align="center">AuthX</h1>
  <p align="center">
    <strong>Enterprise-Grade Passwordless Authentication & Adaptive Security Platform</strong>
  </p>
  <p align="center">
    Secure, frictionless passwordless authentication powered by WebAuthn Passkeys, Authenticator App (TOTP), Email OTP, Cross-Device QR Code Approval, Emergency Lockdown Step-Up Auth, and Cryptographic Recovery Kits.
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/AuthX-v2.0-2563EB?style=for-the-badge&logo=shield&logoColor=white" alt="AuthX Version" />
  <img src="https://img.shields.io/badge/Next.js-16.2-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/WebAuthn-FIDO2-16A34A?style=for-the-badge&logo=fido&logoColor=white" alt="FIDO2 WebAuthn" />
  <img src="https://img.shields.io/badge/Tailwind-CSS%204-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma ORM" />
  <img src="https://img.shields.io/badge/License-MIT-green.style=for-the-badge" alt="License" />
</p>

---

## ⚡ Executive Overview

**AuthX** is a next-generation passwordless authentication and session security platform designed for zero-trust environments. Built to eliminate credential-based vulnerabilities (phishing, credential stuffing, brute-force, SIM-swapping), AuthX integrates **FIDO2 WebAuthn Passkeys**, **TOTP Authenticator Apps**, **Cross-Device QR Approvals**, **Cryptographic Recovery Kits**, and an **Emergency Lockdown Engine** protected by short-lived server-verifiable Step-Up Authentication tokens.

---

## ✨ Core Security Capabilities & Architecture

```
                                  ┌─────────────────────────────────────────┐
                                  │             AuthX Platform              │
                                  └────────────────────┬────────────────────┘
                                                       │
         ┌───────────────────┬───────────────────┬─────┴─────────────┬───────────────────┐
         ▼                   ▼                   ▼                   ▼                   ▼
  🔑 WebAuthn          📱 TOTP 2FA         📲 QR Approval      🛡️ Recovery Kit     🚨 Step-Up Lockdown
 (Touch/Face ID)     (Google/Authy)      (Cross-Device)      (12 Backup Codes)    (Emergency Revoke)
```

### 🔑 1. FIDO2 / WebAuthn Passkeys
- **Hardware-Backed Cryptography**: Authenticate using Touch ID, Face ID, Windows Hello, or YubiKeys.
- **Phishing-Resistant**: Origin-bound credentials backed by Public Key Cryptography (`@simplewebauthn`).
- **Counter Synchronization**: Anti-replay detection via WebAuthn sign count updates.

### 📱 2. Authenticator App (TOTP)
- **Time-Based One-Time Passwords**: Compatible with Google Authenticator, Authy, Microsoft Authenticator.
- **AES-256 Encrypted Secrets**: TOTP secrets are stored in encrypted format using server-side master keys.
- **Setup & Verification Ceremony**: Interactive QR code enrollment and 6-digit confirmation protocol.

### 🛡️ 3. Cryptographic Recovery Kit
- **12 Unique Backup Codes**: Cryptographically secure 8-character codes (`8F4K-92LM`) generated via Web Crypto.
- **Atomic Single-Use**: Stored as SHA-256 hashes in DB; consumed atomically on verification (`used: true`).
- **Export & Management**: Download, print, copy, or regenerate backup recovery keys on demand.

### 🚨 4. Emergency Lockdown with Step-Up Authentication
- **High-Privilege Authorization**: Prevents session hijacking by requiring fresh **Step-Up Authentication** before revoking all active sessions.
- **Permitted Verification Methods ONLY**:
  - ✅ **Authenticator App (TOTP)** *(Recommended)*
  - ✅ **Passkey (WebAuthn)**
  - ✅ **Recovery Code**
  - ❌ *Email OTP, QR Login, or Session Tokens are strictly rejected.*
- **Server-Issued Step-Up Tokens**: Short-lived (5-min TTL), single-use 256-bit crypto-random tokens stored in an in-memory token store (`stepup-store.ts`).
- **IDOR Protection & Precise Revocation**: Revokes sessions by unique `Session.id` (never by OS/device category), keeping the current verified session safe.

### 🖥️ 5. Persistent Device Detection & Untrusted Alerts
- **Instance ID Fingerprinting**: Persistent client-hints and device identity tracking.
- **Untrusted Device Detection**: Detects unrecognized devices upon login and triggers interactive dashboard confirmation modals.
- **Security Notification Dispatch**: Non-blocking email alerts via Resend API (`sendSecurityAlertEmail`, `sendLockdownAlertEmail`).

### 📲 6. Cross-Device QR Code Authentication
- **60-Second Expiring QR Session**: Desktop generates single-use QR token; mobile app scans via `jsQR` camera parser to approve login without passwords.

### 🧪 7. Completely Isolated Product Demo Mode
- **Zero Database Side-Effects**: 100% client-side presentation showcase (`DemoAuthPage`, `DemoDashboard`).
- **Web Crypto OTP Generation**: Generates 6-digit OTPs using `crypto.getRandomValues()` with toast notification display.
- **Interactive Visual Showcase**: Simulates all 9 dashboard modules (Analytics, Sessions, Devices, History, Risk Center, Lockdown, Recovery, Settings) in a read-only visual environment.

---

## 🔒 Security Matrix — Emergency Lockdown Step-Up Auth

| Authentication Method | Allowed for Lockdown Step-Up? | Authorization Mechanism |
| :--- | :---: | :--- |
| **Authenticator App (TOTP)** | ✅ **ALLOWED** (Recommended) | 6-digit TOTP code + decrypted secret validation |
| **Passkey (WebAuthn)** | ✅ **ALLOWED** | WebAuthn assertion challenge/response ceremony |
| **Recovery Code** | ✅ **ALLOWED** | SHA-256 hash match + atomic single-use mark |
| **Email OTP** | ❌ **REJECTED** | Blocked at server route layer (`401 STEPUP_REQUIRED`) |
| **QR Code Approval** | ❌ **REJECTED** | Blocked at server route layer |
| **Active Session Alone** | ❌ **REJECTED** | Requires fresh explicit step-up token verification |

---

## 🛠️ Technology Stack

```
   FRONTEND                          BACKEND                             SECURITY & DB
┌──────────────┐                  ┌──────────────┐                    ┌────────────────┐
│ Next.js 16   │ ── API Routes ──▶│ Node.js 20   │ ── Prisma ORM ───▶│ SQLite / Postgres│
│ React 19     │                  │ Next Server  │                    │ In-Memory Token│
│ Tailwind 4   │                  │ WebAuthn SDK │                    │ Resend Email   │
└──────────────┘                  └──────────────┘                    └────────────────┘
```

- **Core Framework**: Next.js 16 (App Router, Turbopack), React 19, TypeScript 5
- **Authentication Protocols**: FIDO2 / WebAuthn (`@simplewebauthn`), TOTP (HMAC-SHA1), Web Crypto API
- **State & Theme Management**: Zustand (local state hydration), Custom Dark/Light/System theme engine
- **UI & Animations**: Tailwind CSS 4, shadcn/ui components, Framer Motion, Lucide Icons, Recharts
- **Database & Storage**: Prisma ORM, PostgreSQL / SQLite, Ephemeral Challenge & Step-Up Stores

---

## 📂 Project Architecture

```
AuthX/
├── public/                               # Brand logos & static assets
├── prisma/
│   └── schema.prisma                     # User, Session, Passkey, TOTP, RecoveryCode schemas
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/                     # Passkey, Session, Device Trust, OTP APIs
│   │   │   ├── authenticator/            # TOTP Setup, Status, Verification APIs
│   │   │   ├── recovery/                 # Recovery Kit Generation & Verification APIs
│   │   │   ├── lockdown/                 # Emergency Lockdown Execution & Step-Up APIs
│   │   │   │   ├── execute/              # POST /api/lockdown/execute
│   │   │   │   └── stepup/               # Step-Up endpoints (totp, passkey, recovery)
│   │   │   └── demo/                     # Demo cleanup endpoints
│   │   ├── qr-approve/                   # Mobile QR scanning approval route
│   │   └── page.tsx                      # Root App Controller
│   ├── components/
│   │   ├── auth/                         # Passkey, OTP, QR Scanner Modals
│   │   ├── dashboard/                    # Dashboard, Session Mgmt, LockdownStepUpModal
│   │   ├── demo/                         # Isolated DemoAuthPage & DemoDashboard
│   │   └── ui/                           # Design System (StatCard, PageHeader, Badges)
│   ├── lib/
│   │   ├── stepup-store.ts               # In-Memory 256-bit Step-Up Authorization Store
│   │   ├── totp.ts                       # AES-256 Secret Encryption & TOTP Verification
│   │   ├── recovery.ts                   # Recovery Code Generation & Hash Verification
│   │   ├── email-alerts.ts               # Security Alert & Lockdown Email Dispatcher
│   │   ├── challenge-store.ts            # WebAuthn Ephemeral Challenge Manager
│   │   └── device.ts                     # Instance ID & Client Hints Fingerprinter
│   ├── services/
│   │   └── auth-client.ts                # Client API Service Abstractions
│   └── hooks/
│       ├── useAuth.ts                    # Global Auth State Manager
│       └── useDashboardTheme.ts          # Theme Switcher Hook
└── AuthX_Project_Documentation.docx      # Comprehensive Project Documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm** or **bun**

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/suryavanshi99738/AuthX.git

# Navigate to project directory
cd AuthX

# Install dependencies
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the project root:

```env
# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Resend API Key for Security Email Alerts
RESEND_API_KEY="re_your_resend_api_key"
EMAIL_FROM="AuthX Security <onboarding@resend.dev>"

# Encryption Master Key for TOTP Secret Encryption
TOTP_ENCRYPTION_KEY="your_32_byte_hex_encryption_key_here"

# Database URL
DATABASE_URL="file:./dev.db"
```

### 4. Database Setup

```bash
# Push schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛡️ License & Acknowledgments

- **License**: Released under the MIT License.
- **Developed by**: Google DeepMind Agentic Coding Pair Programmer & AuthX Security Engineering.
