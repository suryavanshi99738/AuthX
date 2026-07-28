<p align="center">
  <img src="public/logo.svg" alt="BankShield Auth" width="80" height="80" />
  <h1 align="center">BankShield Auth</h1>
  <p align="center">
    <strong>Passwordless Banking Authentication Platform</strong>
  </p>
  <p align="center">
    A secure, modern authentication platform designed for banking-grade security<br/>
    with passwordless OTP-based login, device trust management, and real-time risk assessment.
  </p>
</p>

---

## Badges

![Sprint 1](https://img.shields.io/badge/Sprint-1%20Architecture%20Only-blue?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7.x-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

---

## Table of Contents

- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Folder Structure](#folder-structure)
- [Installation](#installation)
- [Run Commands](#run-commands)
- [Design System](#design-system)
- [Architecture Principles](#architecture-principles)
- [Sprint 1 Checklist](#sprint-1-checklist)
- [Future Development Phases](#future-development-phases)
- [API Architecture](#api-architecture)
- [Contributing Guidelines](#contributing-guidelines)
- [License](#license)

---

## Project Overview

**BankShield Auth** is a passwordless banking authentication platform built with a modern full-stack architecture. It eliminates traditional password-based authentication in favor of OTP (One-Time Password) verification, device trust scoring, and real-time risk assessment — providing a secure yet frictionless experience for banking customers.

### Key Features

- **Passwordless Authentication** — OTP-based login via email and SMS
- **Device Trust Management** — Fingerprint-based device recognition with trust levels
- **Risk Assessment Engine** — Real-time risk scoring for login attempts
- **Session Management** — Secure, trackable sessions with device binding
- **Security Event Logging** — Comprehensive audit trail for compliance
- **Banking-Grade Security** — Helmet, CORS, rate limiting, and encrypted tokens

---

## Technology Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Frontend** | Next.js | 16 | React framework with App Router |
| | TypeScript | 5 | Type-safe development |
| | Tailwind CSS | 4 | Utility-first styling |
| | shadcn/ui | Latest | Pre-built UI component library |
| | Framer Motion | 12 | Animation and transitions |
| | Lucide React | 0.525+ | Icon library |
| | Axios | 1.18+ | HTTP client for API requests |
| | TanStack Query | 5 | Server state management |
| | Zustand | 5 | Client state management |
| **Backend** | Express.js | 4.x | REST API framework |
| | MongoDB / Mongoose | 7.x | Database and ODM |
| | Helmet | 7.x | Security headers middleware |
| | CORS | 2.8+ | Cross-origin resource sharing |
| | Morgan | 1.10+ | HTTP request logging |
| | Dotenv | 16.x | Environment variable management |
| **Database** | Prisma (SQLite) | 6.x | Frontend ORM for local data |
| | MongoDB | 7.x | Backend auth service database |
| **Tools** | ESLint | 9 | Code linting |
| | Prettier | — | Code formatting |
| | Bun | Latest | JavaScript runtime and package manager |

---

## Folder Structure

```
bankshield-auth/
├── public/                          # Static assets
│   ├── logo.svg                     # BankShield logo
│   └── robots.txt                   # SEO crawler rules
│
├── prisma/                          # Prisma ORM schema
│   └── schema.prisma                # SQLite database schema
│
├── db/                              # SQLite database files
│   └── custom.db                    # Local development database
│
├── src/                             # Frontend (Next.js 16)
│   ├── app/                         # Next.js App Router
│   │   ├── layout.tsx               # Root layout component
│   │   ├── page.tsx                 # Home page
│   │   ├── globals.css              # Global styles
│   │   └── api/                     # API route handlers
│   │       └── route.ts             # Next.js API route
│   │
│   ├── components/                  # React components
│   │   ├── ui/                      # shadcn/ui base components
│   │   ├── cards/                   # Card-based UI components
│   │   ├── common/                  # Shared/common components
│   │   ├── charts/                  # Data visualization charts
│   │   ├── feedback/                # Feedback components (toasts, alerts)
│   │   ├── forms/                   # Form components and inputs
│   │   ├── modals/                  # Modal/dialog components
│   │   ├── navigation/              # Navigation and menu components
│   │   └── tables/                  # Data table components
│   │
│   ├── contexts/                    # React context providers
│   ├── hooks/                       # Custom React hooks
│   │   ├── use-toast.ts             # Toast notification hook
│   │   └── use-mobile.ts            # Mobile detection hook
│   │
│   ├── layouts/                     # Layout components and wrappers
│   ├── lib/                         # Core library utilities
│   │   ├── api-client.ts            # Axios API client configuration
│   │   ├── db.ts                    # Prisma client instance
│   │   ├── query-client.ts          # TanStack Query client
│   │   └── utils.ts                 # General utility functions (cn, etc.)
│   │
│   ├── routes/                      # Route definitions and guards
│   ├── services/                    # Service layer
│   │   ├── api/                     # API service layer
│   │   └── auth/                    # Authentication service client
│   │
│   ├── styles/                      # Style definitions and tokens
│   ├── types/                       # TypeScript type definitions
│   │   ├── api.ts                   # API-related types
│   │   ├── auth.ts                  # Auth-related types
│   │   └── common.ts                # Shared/common types
│   │
│   ├── utils/                       # Utility functions
│   │   ├── format.ts                # Data formatting utilities
│   │   └── validation.ts            # Validation helper functions
│   │
│   └── constants/                   # Application constants
│       ├── api.ts                   # API endpoint constants
│       ├── auth.ts                  # Auth configuration constants
│       └── routes.ts                # Route path constants
│
├── mini-services/                   # Backend microservices
│   └── auth-service/                # Authentication service
│       ├── index.ts                 # Entry point (Express + MongoDB startup)
│       ├── app.ts                   # Express app configuration
│       ├── package.json             # Service dependencies
│       ├── tsconfig.json            # TypeScript configuration
│       ├── .env.example             # Environment variable template
│       │
│       ├── config/                  # Configuration layer
│       │   ├── index.ts             # Central config aggregator
│       │   ├── database.ts          # MongoDB connection config
│       │   ├── server.ts            # Server port/host config
│       │   └── cors.ts              # CORS policy config
│       │
│       ├── controllers/             # Request handlers
│       │   ├── health.controller.ts # Health check endpoint
│       │   ├── auth.controller.ts   # Auth route handlers
│       │   └── index.ts             # Barrel export
│       │
│       ├── services/                # Business logic layer
│       │   ├── auth.service.ts      # Authentication logic
│       │   ├── session.service.ts   # Session management logic
│       │   ├── device.service.ts    # Device management logic
│       │   ├── otp.service.ts       # OTP generation/verification
│       │   ├── risk.service.ts      # Risk assessment logic
│       │   └── index.ts             # Barrel export
│       │
│       ├── models/                  # Mongoose schemas
│       │   ├── User.model.ts        # User schema
│       │   ├── Session.model.ts     # Session schema
│       │   ├── Device.model.ts      # Device schema
│       │   ├── SecurityEvent.model.ts # Security event schema
│       │   └── index.ts             # Barrel export
│       │
│       ├── routes/                  # Express route definitions
│       │   ├── index.ts             # Route aggregator
│       │   ├── health.routes.ts     # Health check routes
│       │   └── auth.routes.ts       # Auth endpoint routes
│       │
│       ├── middlewares/             # Express middlewares
│       │   ├── error.middleware.ts  # Global error handler
│       │   ├── validate.middleware.ts # Request validation
│       │   ├── auth.middleware.ts   # Authentication guard
│       │   ├── rateLimit.middleware.ts # Rate limiting
│       │   ├── asyncHandler.middleware.ts # Async error wrapper
│       │   └── index.ts             # Barrel export
│       │
│       ├── utils/                   # Utility functions
│       │   ├── logger.ts            # Console logger
│       │   ├── response.ts          # API response helpers
│       │   ├── encryption.ts        # Encryption utilities
│       │   ├── token.ts             # JWT token utilities
│       │   ├── validators.ts        # Input validators
│       │   └── index.ts             # Barrel export
│       │
│       ├── types/                   # TypeScript definitions
│       │   ├── auth.types.ts        # Auth request/response types
│       │   ├── api.types.ts         # API response types
│       │   ├── user.types.ts        # User document types
│       │   ├── session.types.ts     # Session types
│       │   ├── device.types.ts      # Device types
│       │   ├── express.d.ts         # Express request extensions
│       │   └── index.ts             # Barrel export
│       │
│       └── database/                # Database connection
│           └── index.ts             # MongoDB connection manager
│
├── Caddyfile                        # Gateway/reverse proxy config
├── next.config.ts                   # Next.js configuration
├── tailwind.config.ts               # Tailwind CSS configuration
├── tsconfig.json                    # Root TypeScript config
├── postcss.config.mjs               # PostCSS configuration
├── eslint.config.mjs                # ESLint configuration
├── components.json                  # shadcn/ui configuration
└── package.json                     # Frontend dependencies
```

---

## Installation

### Prerequisites

| Requirement | Version | Installation |
|-------------|---------|-------------|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| Bun | Latest | [bun.sh](https://bun.sh) |
| MongoDB | 7.x+ | [mongodb.com](https://www.mongodb.com) |

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/bankshield-auth.git
   cd bankshield-auth
   ```

2. **Install frontend dependencies**

   ```bash
   bun install
   ```

3. **Install backend dependencies**

   ```bash
   cd mini-services/auth-service
   bun install
   cd ../..
   ```

4. **Set up environment variables**

   ```bash
   # Frontend — copy and edit as needed
   cp .env.example .env

   # Backend
   cp mini-services/auth-service/.env.example mini-services/auth-service/.env
   ```

   Edit `mini-services/auth-service/.env` with your configuration:

   ```env
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/bankshield-auth
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:3000
   JWT_SECRET=your-jwt-secret-here
   JWT_EXPIRES_IN=24h
   OTP_EXPIRES_IN=5m
   LOG_LEVEL=debug
   ```

5. **Initialize the database**

   ```bash
   bun run db:push
   ```

6. **Start the development servers**

   ```bash
   # Terminal 1 — Frontend (port 3000)
   bun run dev

   # Terminal 2 — Backend auth service (port 3001)
   cd mini-services/auth-service && bun run dev
   ```

---

## Run Commands

| Command | Description | Port |
|---------|-------------|------|
| `bun run dev` | Start Next.js frontend development server | 3000 |
| `bun run lint` | Run ESLint to check code quality | — |
| `bun run db:push` | Push Prisma schema to SQLite database | — |
| `bun run db:generate` | Generate Prisma client | — |
| `bun run db:migrate` | Run Prisma migrations | — |
| `bun run db:reset` | Reset database and re-run migrations | — |
| `cd mini-services/auth-service && bun run dev` | Start auth service backend | 3001 |
| `bun run build` | Build Next.js for production | — |

---

## Design System

### Typography

| Property | Value |
|----------|-------|
| Font Family | Inter |
| Font Source | Google Fonts / Next.js built-in |
| Weight Scale | 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold) |

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#2563EB` | Buttons, links, active states |
| Success | `#16A34A` | Confirmations, verified states |
| Warning | `#F59E0B` | Alerts, pending actions |
| Danger | `#DC2626` | Errors, destructive actions |
| Background | `#F8FAFC` | Page background |
| Cards | `#FFFFFF` | Card and surface backgrounds |
| Text Primary | `#0F172A` | Headings and primary text |
| Text Secondary | `#64748B` | Supporting text and descriptions |

### Spacing & Layout

| Property | Value |
|----------|-------|
| Base Unit | 8px Grid |
| Border Radius | 20px (cards and containers) |
| Card Padding | 24px (`p-6`) |
| Section Gap | 24px (`gap-6`) |
| Component Gap | 16px (`gap-4`) |

### Shadows

| Level | Value | Usage |
|-------|-------|-------|
| Soft Professional | `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)` | Cards, elevated surfaces |
| Medium | `0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)` | Modals, dropdowns |
| Elevated | `0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)` | Popovers, tooltips |

### Animation

| Principle | Guideline |
|-----------|----------|
| Style | Minimal, Professional, Smooth |
| Duration | 200–300ms for transitions |
| Easing | `ease-out` for entrances, `ease-in` for exits |
| Library | Framer Motion for complex animations |
| CSS | Tailwind `transition` utilities for simple state changes |

---

## Architecture Principles

### Core Principles

| Principle | Description |
|-----------|-------------|
| **SOLID** | Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion |
| **Separation of Concerns** | Clear boundaries between UI, business logic, data access, and infrastructure |
| **Modular Architecture** | Each feature is self-contained with its own types, services, and components |
| **Barrel Exports** | Every module uses `index.ts` barrel files for clean, centralized imports |
| **Type Safety** | End-to-end TypeScript with strict mode enabled; no `any` types |
| **Error Handling** | Centralized error middleware with standardized API response format |
| **Security First** | Helmet headers, CORS policies, input validation, rate limiting, encrypted tokens |

### Design Patterns

- **Layered Architecture** — Controller → Service → Model separation in the backend
- **Repository Pattern** — Data access abstracted through Mongoose models
- **Adapter Pattern** — API client layer abstracts backend communication
- **Observer Pattern** — React context and Zustand for state propagation
- **Factory Pattern** — Standardized response builder via utility helpers

### Data Flow

```
User Action → React Component → Zustand/TanStack Query → API Client (Axios)
    → Gateway (Caddy) → Auth Service (Express) → Controller → Service → Model → MongoDB
```

---

## Sprint 1 Checklist

> **Sprint 1 Focus**: Architecture Only — All foundational structure, placeholder files, and core infrastructure.

| # | Item | Status |
|---|------|--------|
| 1 | Next.js 16 project initialization with App Router | ✅ |
| 2 | Tailwind CSS 4 configuration with design tokens | ✅ |
| 3 | shadcn/ui component library integration (40+ components) | ✅ |
| 4 | TypeScript strict mode configuration | ✅ |
| 5 | Express.js backend service scaffolded as mini-service | ✅ |
| 6 | MongoDB/Mongoose database connection with graceful handling | ✅ |
| 7 | Mongoose User model schema defined | ✅ |
| 8 | Mongoose Session model schema defined | ✅ |
| 9 | Mongoose Device model schema defined | ✅ |
| 10 | Mongoose SecurityEvent model schema defined | ✅ |
| 11 | Auth service entry point with dotenv and startup logging | ✅ |
| 12 | Express app configuration (Helmet, CORS, Morgan, body parsing) | ✅ |
| 13 | Global error handling middleware implemented | ✅ |
| 14 | Async handler middleware for Express route handlers | ✅ |
| 15 | Health check endpoint (GET /health) fully implemented | ✅ |
| 16 | Auth route definitions (login, register, verify-otp, logout, refresh, sessions) | ✅ |
| 17 | Barrel export pattern applied across all modules | ✅ |
| 18 | Centralized configuration layer (database, server, CORS) | ✅ |
| 19 | TypeScript type definitions for auth, API, user, session, device | ✅ |
| 20 | Utility layer (logger, response helpers, encryption, token, validators) | ✅ |

---

## Future Development Phases

### Sprint 2 — Authentication Implementation

- Implement OTP generation and verification logic
- Build email and SMS delivery integration
- Implement JWT access/refresh token management
- Create login and registration API endpoints
- Build device fingerprinting and trust scoring
- Implement session management with token rotation
- Add rate limiting middleware
- Create authentication middleware (protect routes)

### Sprint 3 — Frontend UI & Integration

- Build login flow UI (email input → OTP verification)
- Build registration flow UI
- Build dashboard with session and device management
- Implement risk assessment visualization
- Connect frontend to backend API endpoints
- Add real-time security event notifications
- Build admin panel for user management
- Implement responsive mobile layouts

### Sprint 4 — Security Hardening & Production

- Implement refresh token rotation
- Add brute-force protection with exponential backoff
- Set up security event alerting and webhooks
- Implement audit log export for compliance
- Add end-to-end encryption for sensitive data
- Performance optimization and caching
- Load testing and security audit
- CI/CD pipeline and deployment automation

---

## API Architecture

### Gateway Pattern

BankShield Auth uses a **mini-service gateway pattern** where a Caddy reverse proxy routes requests between the frontend and backend services.

```
┌─────────────────────────────────────────────────────────┐
│                    Caddy Gateway                         │
│                   (Reverse Proxy)                        │
│                                                          │
│  ┌──────────────┐              ┌──────────────────┐     │
│  │   Frontend   │              │   Auth Service   │     │
│  │  Next.js 16  │              │   Express.js     │     │
│  │  Port 3000   │─── API ────▶│   Port 3001      │     │
│  │              │              │                  │     │
│  │  SSR + CSR   │              │  REST + MongoDB  │     │
│  └──────────────┘              └──────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

### How Frontend Communicates with Backend

All API requests from the frontend to the auth service use the **`XTransformPort` query parameter** to route through the Caddy gateway:

```typescript
// ✅ Correct — uses relative path with XTransformPort
fetch('/api/auth/login?XTransformPort=3001', {
  method: 'POST',
  body: JSON.stringify({ email: 'user@example.com' }),
});

// ❌ Incorrect — never use absolute URLs with ports
fetch('http://localhost:3001/api/auth/login');
```

### API Endpoints

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| `GET` | `/health` | Root health check | ✅ Implemented |
| `GET` | `/api/health` | API health check with DB status | ✅ Implemented |
| `POST` | `/api/auth/login` | Passwordless login (email/phone) | 🔜 Sprint 2 |
| `POST` | `/api/auth/register` | New user registration | 🔜 Sprint 2 |
| `POST` | `/api/auth/verify-otp` | OTP verification | 🔜 Sprint 2 |
| `POST` | `/api/auth/logout` | Session termination | 🔜 Sprint 2 |
| `POST` | `/api/auth/refresh` | Token refresh | 🔜 Sprint 2 |
| `GET` | `/api/auth/sessions` | List active sessions | 🔜 Sprint 2 |

### Health Check Response

```json
{
  "status": "OK",
  "uptime": 12345.67,
  "environment": "development",
  "database": "connected"
}
```

---

## Contributing Guidelines

### Code Style

- **TypeScript Strict Mode** — All code must pass strict TypeScript checks
- **ESLint** — Follow the project ESLint configuration
- **Barrel Exports** — Use `index.ts` files for all module exports

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Components | PascalCase | `LoginForm`, `OtpInput`, `SessionCard` |
| Hooks | camelCase with `use` prefix | `useAuth`, `useSession`, `useDevice` |
| Interfaces / Types | PascalCase | `AuthResponse`, `UserProfile`, `DeviceInfo` |
| Variables | camelCase | `isLoading`, `userEmail`, `sessionToken` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL`, `MAX_RETRY_COUNT`, `OTP_LENGTH` |
| Files (components) | PascalCase | `LoginForm.tsx`, `OtpInput.tsx` |
| Files (utilities) | kebab-case | `api-client.ts`, `use-mobile.ts` |
| Directories | kebab-case | `auth-service/`, `api-client/` |

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
feat: add OTP verification endpoint
fix: resolve session token rotation issue
docs: update API architecture documentation
refactor: extract risk assessment into service layer
chore: update dependencies
```

### Pull Request Process

1. Create a feature branch from `main`
2. Implement changes with appropriate test coverage
3. Ensure all lint checks pass (`bun run lint`)
4. Submit PR with a clear description of changes
5. Request review from at least one team member

---

## License

```
MIT License

Copyright (c) 2026 BankShield Auth

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<p align="center">
  Built with ❤️ for secure banking authentication
</p>
