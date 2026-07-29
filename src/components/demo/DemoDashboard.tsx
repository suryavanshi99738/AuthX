'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, LogOut, PanelLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getDemoDashboard } from '@/services/auth-client';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { Badge } from '@/components/ui/badge';
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
    <div className="min-h-screen flex bg-background">
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <motion.div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
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
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-smooth"
            >
              <PanelLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <span className="font-heading text-sm font-semibold">BankShield Auth</span>
              <Badge className="bg-warning/10 text-warning text-xs hover:bg-warning/10">Demo Mode</Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block">{user?.email}</span>
            <Button
              variant="outline"
              size="sm"
              className="text-xs rounded-lg text-danger border-danger/30 hover:bg-danger/10 hover:text-danger"
              onClick={handleExitDemo}
            >
              <LogOut className="w-3 h-3 mr-1" />
              Exit Demo
            </Button>
          </div>
        </header>

        {/* Demo banner */}
        <div className="bg-warning/5 border-b border-warning/20 px-6 py-2 flex items-center justify-center gap-2">
          <Badge className="bg-warning/10 text-warning text-xs hover:bg-warning/10">Demo</Badge>
          <span className="text-xs text-muted-foreground">
            You are viewing demo data. All data will be cleaned up when you exit.
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
