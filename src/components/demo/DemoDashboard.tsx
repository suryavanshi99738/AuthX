'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  LogOut,
  PanelLeft,
  ShieldCheck,
  Home,
  KeyRound,
  BarChart3,
  Radio,
  Laptop,
  Clock,
  ShieldAlert,
  Lock,
  Settings as SettingsIcon,
  User,
  QrCode,
  Mail,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getDemoDashboard } from '@/services/auth-client';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { StatusBadge } from '@/components/ui/status-badge';

const SECTION_ICONS: Record<string, React.ReactNode> = {
  home: <Home className="w-4 h-4 text-primary" />,
  auth_methods: <KeyRound className="w-4 h-4 text-primary" />,
  analytics: <BarChart3 className="w-4 h-4 text-primary" />,
  sessions: <Radio className="w-4 h-4 text-primary" />,
  trusted_devices: <Laptop className="w-4 h-4 text-primary" />,
  history: <Clock className="w-4 h-4 text-primary" />,
  risk_center: <ShieldAlert className="w-4 h-4 text-primary" />,
  lockdown: <Lock className="w-4 h-4 text-primary" />,
  settings: <SettingsIcon className="w-4 h-4 text-primary" />,
  profile: <User className="w-4 h-4 text-primary" />,
  link_device: <QrCode className="w-4 h-4 text-primary" />,
};

export function DemoDashboard() {
  const { user, sessionToken, cleanupDemo } = useAuth();
  const [activeItem, setActiveItem] = useState('home');
  const [dashboardData, setDashboardData] = useState<Record<string, unknown> | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Fetch demo dashboard data
  useEffect(() => {
    async function loadDashboard() {
      if (!sessionToken) return;
      const result = await getDemoDashboard(sessionToken);
      if (result.success) {
        setDashboardData(result as unknown as Record<string, unknown>);
      }
    }
    loadDashboard();
  }, [sessionToken]);

  const handleItemClick = (id: string) => {
    setActiveItem(id);
  };

  const handleExitDemo = () => {
    cleanupDemo();
  };

  return (
    <div className="min-h-screen flex bg-[#FFF4E1] dark:bg-[#0D1513]">
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <motion.div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar activeItem={activeItem} onItemClick={(id) => { handleItemClick(id); setMobileSidebarOpen(false); }} isDemo />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar activeItem={activeItem} onItemClick={handleItemClick} isDemo />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-[#FFF4E1] dark:bg-[#0D1513] border-b border-[#E5D7C3] dark:border-[#1A312C] flex items-center justify-between px-5 py-3.5 h-16 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl hover:bg-muted/60 transition-smooth text-muted-foreground border border-border/50"
            >
              <PanelLeft className="w-5 h-5" />
            </button>
            <div className="hidden lg:flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-primary" />
              <span className="font-heading text-lg font-bold tracking-tight text-foreground">AuthX</span>
            </div>
            
            {/* Breadcrumb section name with Icon */}
            <div className="flex items-center gap-2 text-sm text-foreground capitalize lg:ml-4 font-semibold bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
              {SECTION_ICONS[activeItem] || <ShieldCheck className="w-4 h-4 text-primary" />}
              <span>{activeItem.replace('_', ' ')}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge variant="warning">Demo Mode</StatusBadge>
            
            {/* User Email Pill with Mail Icon */}
            <div className="hidden sm:flex text-xs sm:text-sm bg-card border border-border/80 rounded-full px-3.5 py-1.5 text-foreground font-medium items-center gap-2 shadow-xs">
              <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>{user?.email || 'demo@authx.com'}</span>
            </div>

            <button
              className="text-xs sm:text-sm text-red-600 hover:text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl px-3.5 py-1.5 flex items-center gap-1.5 transition-smooth font-medium"
              onClick={handleExitDemo}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit Demo</span>
            </button>
          </div>
        </header>

        {/* Demo banner */}
        <div className="bg-[#F4E7D3] dark:bg-[#1F332D] border-b border-[#E5D7C3] dark:border-[#24423C] px-4 py-2 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#428475] dark:bg-[#89D7B7] animate-pulse" />
          <span className="text-xs font-medium text-[#428475] dark:text-[#89D7B7]">
            Demo Mode — Temporary data will be cleared on exit
          </span>
        </div>

        {/* Dashboard content */}
        <main className="flex-1 overflow-y-auto">
          <DashboardContent activeSection={activeItem} dashboardData={dashboardData || undefined} />
        </main>
      </div>
    </div>
  );
}
