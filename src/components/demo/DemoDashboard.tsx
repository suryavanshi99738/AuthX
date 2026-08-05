'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, LogOut, PanelLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getDemoDashboard } from '@/services/auth-client';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';

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
        <header className="sticky top-0 z-30 bg-[#FFF4E1] dark:bg-[#0D1513] border-b border-[#E5D7C3] dark:border-[#1A312C] flex items-center justify-between px-4 py-3 h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted/50 transition-smooth text-muted-foreground"
            >
              <PanelLeft className="w-5 h-5" />
            </button>
            <div className="hidden lg:flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <span className="font-heading text-base font-semibold tracking-tight text-foreground">AuthX</span>
            </div>
            {/* Breadcrumb section name */}
            <span className="text-sm text-muted-foreground capitalize lg:ml-4 font-medium">
              {activeItem.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge variant="warning">Demo Mode</StatusBadge>
            <div className="hidden sm:block text-sm bg-muted/50 rounded-full px-3 py-1 text-muted-foreground font-medium">
              <span>{user?.email}</span>
            </div>
            <button
              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition-smooth"
              onClick={handleExitDemo}
            >
              <LogOut className="w-4 h-4" />
              Exit Demo
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
          <DashboardContent dashboardData={dashboardData || undefined} />
        </main>
      </div>
    </div>
  );
}
