'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, PanelLeft, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getDemoDashboard, verifySession, getTrustedDevices } from '@/services/auth-client';
import { Sidebar } from './Sidebar';
import { DashboardContent } from './DashboardContent';
import { NewDeviceModal } from './NewDeviceModal';
import { StatusBadge } from '@/components/ui/status-badge';

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
        <Sidebar activeItem={activeItem} onItemClick={(id) => { handleItemClick(id); setMobileSidebarOpen(false); }} isDemo={isDemo} />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar activeItem={activeItem} onItemClick={handleItemClick} isDemo={isDemo} />
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
              <ShieldCheck className="w-6 h-6 text-primary" />
              <span className="font-heading text-base font-semibold tracking-tight text-foreground">AuthX</span>
            </div>
            {/* Breadcrumb section name */}
            <span className="text-sm text-muted-foreground capitalize lg:ml-4 font-medium">
              {activeItem.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isDemo && (
              <StatusBadge variant="warning">Demo Mode</StatusBadge>
            )}
            <div className="text-sm bg-muted/50 rounded-full px-3 py-1 text-muted-foreground font-medium">
              <span>{user?.email}</span>
            </div>
          </div>
        </header>

        {/* Demo Mode subtle banner */}
        {isDemo && (
          <div className="bg-[#F4E7D3] dark:bg-[#1F332D] border-b border-[#E5D7C3] dark:border-[#24423C] px-4 py-2 text-center text-xs font-medium text-[#428475] dark:text-[#89D7B7] flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#428475] dark:bg-[#89D7B7] animate-pulse" />
            <span>Demo Mode — Temporary data will be cleared on exit</span>
          </div>
        )}

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
