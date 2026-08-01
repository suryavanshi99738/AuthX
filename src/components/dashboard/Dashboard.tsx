'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, PanelLeft, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getDemoDashboard, verifySession, getTrustedDevices } from '@/services/auth-client';
import { Sidebar } from './Sidebar';
import { DashboardContent } from './DashboardContent';
import { NewDeviceModal } from './NewDeviceModal';
import { Badge } from '@/components/ui/badge';

export function Dashboard() {
  const { user, sessionToken, isDemo, logout } = useAuth();
  const [activeItem, setActiveItem] = useState('home');
  const [dashboardData, setDashboardData] = useState<Record<string, unknown> | null>(null);

  // Mobile sidebar toggle
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // New device verification modal state
  const [newDeviceModalOpen, setNewDeviceModalOpen] = useState(false);
  const [newDeviceInfo, setNewDeviceInfo] = useState<{
    deviceName: string;
    browser: string;
    ipAddress: string;
    location: string;
  }>({
    deviceName: 'Mobile Device',
    browser: 'Mobile Browser',
    ipAddress: '10.17.87.25',
    location: 'Local Network (Wi-Fi)',
  });

  // Fetch dashboard data & check device trust state
  useEffect(() => {
    async function loadDashboard() {
      if (!sessionToken) return;

      if (isDemo) {
        const result = await getDemoDashboard(sessionToken);
        if (result.success) {
          setDashboardData(result as unknown as Record<string, unknown>);
        }
      } else {
        const sessionResult = await verifySession(sessionToken);
        if (!sessionResult.success) {
          logout();
          return;
        }
        setDashboardData(null);

        // Check if device is trusted or new login
        if (user?.id) {
          const devRes = await getTrustedDevices(user.id);
          const isMobile = /mobile|iphone|ipad|android/i.test(navigator.userAgent);
          const devName = isMobile ? 'Mobile Phone' : 'Windows Laptop';
          const browserName = navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Safari') ? 'Safari' : 'Web Browser';

          if (devRes.success && devRes.devices) {
            const isKnown = devRes.devices.some((d) => d.deviceName === devName || d.browser === browserName);
            if (!isKnown) {
              setNewDeviceInfo({
                deviceName: devName,
                browser: browserName,
                ipAddress: '10.17.87.25',
                location: 'Local Network (Wi-Fi)',
              });
              setNewDeviceModalOpen(true);
            }
          }
        }
      }
    }
    loadDashboard();
  }, [sessionToken, isDemo, logout, user?.id]);

  const handleItemClick = (id: string) => {
    setActiveItem(id);
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
        <Sidebar activeItem={activeItem} onItemClick={(id) => { handleItemClick(id); setMobileSidebarOpen(false); }} isDemo={isDemo} />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar activeItem={activeItem} onItemClick={handleItemClick} isDemo={isDemo} />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300">
        {/* Top bar */}
        <header className="flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-smooth"
            >
              <PanelLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <ShieldCheck className="w-4 h-4 text-primary" />
              </div>
              <span className="font-heading text-base font-bold tracking-tight text-foreground">AuthX</span>
              {isDemo && (
                <Badge className="bg-warning/10 text-warning text-xs hover:bg-warning/10">Demo Mode</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <span>{user?.email}</span>
          </div>
        </header>

        {/* Dashboard content */}
        <main className="flex-1 overflow-y-auto">
          <DashboardContent activeSection={activeItem} dashboardData={dashboardData || undefined} />
        </main>
      </div>

      {/* New Login Detected Verification Modal */}
      {user?.id && (
        <NewDeviceModal
          isOpen={newDeviceModalOpen}
          onClose={() => setNewDeviceModalOpen(false)}
          userId={user.id}
          sessionToken={sessionToken || undefined}
          deviceInfo={newDeviceInfo}
          onTrustSuccess={() => setNewDeviceModalOpen(false)}
          onRevokeSuccess={() => {
            setNewDeviceModalOpen(false);
            logout();
          }}
        />
      )}
    </div>
  );
}
