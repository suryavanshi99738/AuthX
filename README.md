<p align="center">
  <img src="public/logo.svg" alt="AuthX Logo" width="88" height="88" />
  <h1 align="center">AuthX</h1>
  <p align="center">
    <strong>Next-Gen Passwordless Authentication & Session Management Platform</strong>
  </p>
  <p align="center">
    Secure, frictionless passwordless authentication powered by WebAuthn Passkeys, Email OTP, cross-device QR code approval, and intelligent risk assessment.
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/AuthX-v1.0-2563EB?style=for-the-badge&logo=shield&logoColor=white" alt="AuthX Version" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Next.js-16.2-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/WebAuthn-FIDO2-16A34A?style=for-the-badge&logo=fido&logoColor=white" alt="FIDO2 WebAuthn" />
  <img src="https://img.shields.io/badge/Tailwind-CSS%204-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
</p>

---

## ⚡ Overview

**AuthX** is a modern passwordless authentication platform built for enterprise security and frictionless user experiences. It completely eliminates traditional password vulnerabilities (phishing, credential stuffing, brute force) in favor of WebAuthn passkeys, email OTP verification, cross-device desktop QR approvals, and active risk monitoring.

---

## ✨ Key Features

- 🔑 **WebAuthn / FIDO2 Passkeys** — Passwordless login using Touch ID, Face ID, or Windows Hello hardware credentials.
- ✉️ **Email OTP & Recovery** — Secure single-use 6-digit verification codes sent via Resend API.
- 📱 **Cross-Device QR Code Authentication** — Log into desktop browsers by scanning a 60s expiring QR code from an authenticated mobile device.
- 🔍 **Real-Time Camera Scanner** — Built-in mobile camera decoder powered by `jsQR` with animated scanning laser UI.
- 🛡️ **Device Trust & Mobile Device Link** — Link laptop sessions directly from the mobile sidebar with device detection scoping.
- 📊 **Risk Detections & Security Analytics** — Visual risk assessment bar charts, active session tracking, and audit history logging.

---

## 🛠️ Technology Stack

| Category | Technologies |
|----------|--------------|
| **Core Framework** | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| **Authentication** | `@simplewebauthn/browser`, `@simplewebauthn/server`, Resend API (OTP) |
| **Scanner & Visuals** | `jsQR`, Framer Motion, Lucide Icons, Recharts |
| **Styling & UI** | Tailwind CSS 4, shadcn/ui components, CSS Glassmorphism |
| **Database & Storage** | Prisma ORM, SQLite / PostgreSQL |

---

## 📂 Folder Structure

```
AuthX/
├── public/                          # Static assets & SVG logo
│   └── logo.svg                     # Official AuthX Shield Logo
├── prisma/                          # Prisma ORM schema & migrations
│   └── schema.prisma                # User, Passkey, QRRequest, Device schemas
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── api/auth/                # Auth API Endpoints (Passkey, OTP, QR, Devices)
│   │   ├── qr-approve/              # Mobile QR Approval Page
│   │   ├── layout.tsx               # Root Layout with font & metadata
│   │   └── page.tsx                 # Main AuthX App Switcher
│   ├── components/
│   │   ├── auth/                    # Passkey, OTP, QR Form & Scanner Modals
│   │   ├── dashboard/               # Sidebar, Home, Active Logins & Analytics
│   │   ├── landing/                 # AuthX Landing Page
│   │   └── ui/                      # shadcn/ui Component Library
│   ├── hooks/                       # Custom hooks (useAuth, useMobile)
│   └── services/                    # Auth API Client Services
└── progress.md                      # Project Sprint Tracker
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v18+ or v20+
- **npm** or **bun**

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/suryavanshi99738/AuthX.git
cd AuthX
npm install
```

### 2. Environment Setup

Create `.env.local` in the root directory:

```env
RESEND_API_KEY=re_your_resend_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL="file:./dev.db"
```

### 3. Database Setup

```bash
npx prisma db push
npx prisma generate
```

### 4. Run Development Server

To support mobile camera QR testing on your local network:

```bash
npm run dev
# Starts Next.js listening on 0.0.0.0:3000
```

Open `http://localhost:3000` on your desktop or `http://<YOUR_LOCAL_IP>:3000` on your mobile phone.

---

## 🔒 Security Architecture

```
Desktop Login (QR Request) ──▶ Generates 60s Request ID ──▶ Display QR Code
                                                                 │
Mobile Phone (Authenticated) ──▶ Scans QR via jsQR Camera ───────┤
                                                                 ▼
Desktop Session Created ◀─── Mobile Approve Session ◀── Verify WebAuthn / OTP
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.

---

<p align="center">
  Built with ❤️ by the <strong>AuthX Team</strong>
</p>
