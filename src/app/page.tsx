'use client';

import { motion } from 'framer-motion';
import {
  Shield,
  KeyRound,
  Fingerprint,
  QrCode,
  Mail,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  Lock,
  Eye,
  Activity,
  AlertTriangle,
  Cpu,
  Database,
  Server,
  LayoutGrid,
  GitBranch,
  Package,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

/* ── Animation Variants ── */
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

/* ── Data ── */
const AUTH_METHODS = [
  { icon: KeyRound, label: 'Passkeys', desc: 'WebAuthn / FIDO2', color: 'text-primary' },
  { icon: Fingerprint, label: 'Biometrics', desc: 'Fingerprint & Face ID', color: 'text-success' },
  { icon: QrCode, label: 'QR Auth', desc: 'QR Code Login', color: 'text-info' },
  { icon: Mail, label: 'Email OTP', desc: 'One-Time Password', color: 'text-warning' },
  { icon: Smartphone, label: 'Trusted Devices', desc: 'Device Recognition', color: 'text-primary' },
  { icon: AlertTriangle, label: 'Risk-Based', desc: 'Adaptive Auth Engine', color: 'text-danger' },
];

const ARCHITECTURE_ITEMS = [
  { icon: LayoutGrid, label: 'Enterprise Folder Structure', desc: '30+ organized directories across frontend and backend' },
  { icon: Cpu, label: 'Type System Foundation', desc: 'Strict TypeScript with enums, interfaces, and utility types' },
  { icon: GitBranch, label: 'Separation of Concerns', desc: 'Controllers, Services, Models, Utils — clean layered architecture' },
  { icon: Package, label: 'Design System Tokens', desc: 'Colors, typography, spacing, shadows, radius — CSS custom properties' },
  { icon: Server, label: 'Express Backend (Mini-Service)', desc: 'Port 3001 with MongoDB, helmet, CORS, morgan, error handling' },
  { icon: Database, label: '4 Mongoose Schemas Defined', desc: 'User, Session, Device, SecurityEvent models ready' },
];

const FUTURE_PHASES = [
  { icon: Lock, label: 'Sprint 2 — Auth Core', items: ['Passkey Registration', 'Login Flow', 'Session Management', 'JWT Tokens'] },
  { icon: Eye, label: 'Sprint 3 — Security Dashboard', items: ['Login History', 'Security Alerts', 'Device Recognition', 'Risk Engine'] },
  { icon: Activity, label: 'Sprint 4 — Advanced Features', items: ['Emergency Lock', 'Fraud Detection', 'Adaptive MFA', 'Admin Panel'] },
];

const SPRINT1_CHECKLIST = [
  'Next.js 16 + App Router Configured',
  'TypeScript Strict Mode Enabled',
  'Tailwind CSS 4 + Design Tokens',
  'shadcn/ui Component Library',
  'React Router Constants Defined',
  'TanStack Query Client Configured',
  'Framer Motion Animations Ready',
  'Lucide Icons Integrated',
  'Axios API Client with Interceptors',
  'Express Backend with MongoDB',
  'Mongoose Schemas (User, Session, Device, Event)',
  'Health Check & Error Middleware',
  'Path Aliases (@/ → src/)',
  'ESLint + Prettier Configured',
  'Environment Variables (.env + .env.example)',
  'Complete Enterprise Folder Structure',
  'Barrel Export Pattern Applied',
  'Inter Font + BankShield Design System',
  'SOLID Architecture Principles',
  'Production-Ready Configuration',
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ── Hero Section ── */}
      <header className="pt-12 pb-16 px-4">
        <motion.div
          className="max-w-5xl mx-auto text-center"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp} className="flex items-center justify-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary" />
            </div>
          </motion.div>

          <motion.h1 variants={fadeInUp} className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-4">
            BankShield Auth
          </motion.h1>

          <motion.p variants={fadeInUp} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Passwordless Authentication Platform for Banking Systems
          </motion.p>

          <motion.div variants={fadeInUp} className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="text-xs px-3 py-1 border-primary/30 text-primary">
              Sprint 1 — Architecture Foundation
            </Badge>
            <Badge variant="outline" className="text-xs px-3 py-1 border-success/30 text-success">
              ✅ Ready for Sprint 2
            </Badge>
          </motion.div>
        </motion.div>
      </header>

      {/* ── Auth Methods Preview ── */}
      <section className="px-4 pb-16">
        <motion.div
          className="max-w-5xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={staggerContainer}
        >
          <motion.h2 variants={fadeInUp} className="text-2xl font-semibold text-center mb-8">
            Authentication Methods (Future)
          </motion.h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {AUTH_METHODS.map((method) => (
              <motion.div key={method.label} variants={scaleIn}>
                <Card className="shadow-card hover:shadow-card-hover transition-smooth text-center py-6">
                  <CardContent className="pt-0 flex flex-col items-center gap-2">
                    <method.icon className={`w-8 h-8 ${method.color}`} />
                    <span className="text-sm font-medium">{method.label}</span>
                    <span className="text-xs text-muted-foreground">{method.desc}</span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Architecture Highlights ── */}
      <section className="px-4 pb-16">
        <motion.div
          className="max-w-5xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={staggerContainer}
        >
          <motion.h2 variants={fadeInUp} className="text-2xl font-semibold text-center mb-8">
            Architecture Highlights
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ARCHITECTURE_ITEMS.map((item) => (
              <motion.div key={item.label} variants={scaleIn}>
                <Card className="shadow-card hover:shadow-card-hover transition-smooth">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <CardTitle className="text-base">{item.label}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Design System Preview ── */}
      <section className="px-4 pb-16">
        <motion.div
          className="max-w-5xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={staggerContainer}
        >
          <motion.h2 variants={fadeInUp} className="text-2xl font-semibold text-center mb-8">
            Design System Tokens
          </motion.h2>

          <motion.div variants={fadeInUp}>
            <Card className="shadow-card">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {/* Primary */}
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Primary</span>
                    <div className="w-full h-12 rounded-lg bg-primary" />
                    <span className="text-xs text-muted-foreground">#2563EB</span>
                  </div>
                  {/* Success */}
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Success</span>
                    <div className="w-full h-12 rounded-lg bg-success" />
                    <span className="text-xs text-muted-foreground">#16A34A</span>
                  </div>
                  {/* Warning */}
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Warning</span>
                    <div className="w-full h-12 rounded-lg bg-warning" />
                    <span className="text-xs text-muted-foreground">#F59E0B</span>
                  </div>
                  {/* Danger */}
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Danger</span>
                    <div className="w-full h-12 rounded-lg bg-danger" />
                    <span className="text-xs text-muted-foreground">#DC2626</span>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Font</span>
                    <p className="text-sm font-medium">Inter</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Radius</span>
                    <p className="text-sm font-medium">20px</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Spacing</span>
                    <p className="text-sm font-medium">8px Grid</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Animation</span>
                    <p className="text-sm font-medium">Smooth · Minimal</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Sprint 1 Checklist ── */}
      <section className="px-4 pb-16">
        <motion.div
          className="max-w-5xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={staggerContainer}
        >
          <motion.h2 variants={fadeInUp} className="text-2xl font-semibold text-center mb-8">
            Sprint 1 Checklist
          </motion.h2>

          <motion.div variants={fadeInUp}>
            <Card className="shadow-card">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 max-h-96 overflow-y-auto">
                  {SPRINT1_CHECKLIST.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                      <span className="text-sm text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Future Phases ── */}
      <section className="px-4 pb-16">
        <motion.div
          className="max-w-5xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={staggerContainer}
        >
          <motion.h2 variants={fadeInUp} className="text-2xl font-semibold text-center mb-8">
            Future Development Phases
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FUTURE_PHASES.map((phase) => (
              <motion.div key={phase.label} variants={scaleIn}>
                <Card className="shadow-card hover:shadow-card-hover transition-smooth">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <phase.icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <CardTitle className="text-base">{phase.label}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {phase.items.map((item) => (
                        <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <ArrowRight className="w-3 h-3 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Folder Structure ── */}
      <section className="px-4 pb-16">
        <motion.div
          className="max-w-5xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeInUp}
        >
          <h2 className="text-2xl font-semibold text-center mb-8">Project Structure</h2>

          <Card className="shadow-card">
            <CardContent className="pt-6">
              <pre className="text-xs md:text-sm font-mono text-muted-foreground overflow-x-auto leading-relaxed whitespace-pre">
{`src/                          ← Frontend (Next.js 16 App Router)
  assets/                      ← Static assets (images, icons, illustrations)
  components/
    common/                    ← Shared reusable components
    cards/                     ← Card-based components
    charts/                    ← Data visualization components
    feedback/                  ← Alerts, toasts, notifications
    forms/                     ← Form components & inputs
    modals/                    ← Dialog & modal components
    navigation/                ← Nav, sidebar, breadcrumbs
    tables/                    ← Data table components
    ui/                        ← shadcn/ui primitives (50+ components)
  layouts/                     ← Page layout wrappers
  hooks/                       ← Custom React hooks
  contexts/                    ← React context providers
  routes/                      ← Route constants & guards
  services/
    api/                       ← Axios client configuration
    auth/                      ← Auth service (placeholder)
  types/                       ← TypeScript type definitions
  constants/                   ← App constants (auth, api, routes)
  utils/                       ← Utility functions (validation, format)
  styles/                      ← Style utilities
  lib/                         ← Core lib (db, utils, api-client, query-client)

mini-services/auth-service/    ← Backend (Express + MongoDB on port 3001)
  config/                      ← Environment & service configuration
  controllers/                 ← Request handlers (auth, health)
  middlewares/                  ← Express middleware (error, auth, rate-limit)
  models/                      ← Mongoose schemas (User, Session, Device, Event)
  routes/                      ← Express route definitions
  services/                    ← Business logic services (auth, session, OTP)
  utils/                       ← Backend utilities (logger, response, encryption)
  database/                    ← MongoDB connection manager
  types/                       ← Backend TypeScript types`}
              </pre>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="mt-auto bg-card border-t border-border py-8 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold">BankShield Auth</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Passwordless Authentication Platform for Banking Systems · Sprint 1 — Architecture Foundation Complete
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Next.js 16 · TypeScript · Tailwind CSS 4 · shadcn/ui · Express · MongoDB
          </p>
        </div>
      </footer>
    </div>
  );
}
