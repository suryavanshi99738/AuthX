'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Home,
  KeyRound,
  BarChart3,
  Laptop,
  Radio,
  Clock,
  ShieldAlert,
  ShieldOff,
  Settings,
  User,
  LogOut,
  PanelLeft,
  PanelLeftClose,
  ShieldCheck,
  QrCode,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface SidebarItem {
  id: string;
  icon: React.ElementType;
  label: string;
  mobileOnly?: boolean;
}

interface SidebarProps {
  activeItem: string;
  onItemClick: (id: string) => void;
  isDemo?: boolean;
}

const mainNavItems: SidebarItem[] = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'auth_methods', icon: KeyRound, label: 'Authentication' },
  { id: 'analytics', icon: BarChart3, label: 'Security Analytics' },
  { id: 'sessions', icon: Radio, label: 'Session Management' },
  { id: 'trusted_devices', icon: Laptop, label: 'Trusted Devices' },
  { id: 'history', icon: Clock, label: 'Login History' },
  { id: 'risk_center', icon: ShieldAlert, label: 'Risk Center' },
  { id: 'lockdown', icon: ShieldOff, label: 'Emergency Lockdown' },
  { id: 'link_device', icon: QrCode, label: 'Link Device', mobileOnly: true },
];

const bottomNavItems: SidebarItem[] = [
  { id: 'settings', icon: Settings, label: 'Settings' },
  { id: 'profile', icon: User, label: 'Profile' },
];

export function Sidebar({ activeItem, onItemClick, isDemo }: SidebarProps) {
  const { logout, cleanupDemo } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgentMobile = /iphone|ipad|ipod|android/i.test(navigator.userAgent);
      const screenMobile = window.innerWidth < 768;
      setIsMobile(userAgentMobile || screenMobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = () => {
    if (isDemo) {
      cleanupDemo();
    } else {
      logout();
    }
  };

  return (
    <motion.aside
      className={cn(
        'flex flex-col h-screen max-h-screen bg-card border-r border-border transition-all duration-300 select-none shrink-0 overflow-hidden sticky top-0',
        collapsed ? 'w-16' : 'w-64'
      )}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Brand header */}
      <div className={cn('p-4 border-b border-border flex items-center justify-between', collapsed && 'p-3 justify-center')}>
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <ShieldCheck className="w-4 h-4 text-primary" />
            </div>
            <span className="font-heading text-base font-bold tracking-tight text-foreground">AuthX</span>
            {isDemo && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-warning/10 text-warning">
                Demo
              </span>
            )}
          </div>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
        )}

        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-smooth"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <div className="py-2 flex justify-center border-b border-border">
          <button
            onClick={() => setCollapsed(false)}
            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-smooth"
            title="Expand sidebar"
          >
            <PanelLeft className="w-4.5 h-4.5" />
          </button>
        </div>
      )}

      {/* Main Navigation Items (Fixed / Non-scrollable layout) */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto scrollbar-none">
        {mainNavItems.map((item) => {
          if (item.mobileOnly && !isMobile) return null;
          const isActive = activeItem === item.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className={cn(
                'w-full flex items-center gap-3 rounded-xl transition-smooth relative group',
                collapsed ? 'justify-center p-3' : 'px-3.5 py-2.5',
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
              )}
              whileHover={{ x: collapsed ? 0 : 2 }}
              whileTap={{ scale: 0.98 }}
            >
              <item.icon className={cn('w-4.5 h-4.5 shrink-0', isActive && 'text-primary')} />
              {!collapsed && (
                <span className={cn('text-xs font-medium tracking-tight', isActive && 'text-primary font-semibold')}>
                  {item.label}
                </span>
              )}
              {isActive && !collapsed && (
                <motion.div
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                  layoutId="sidebarActiveDot"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Bottom Section: Settings & Profile & Logout */}
      <div className="p-2 border-t border-border space-y-1 bg-card/50">
        {bottomNavItems.map((item) => {
          const isActive = activeItem === item.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className={cn(
                'w-full flex items-center gap-3 rounded-xl transition-smooth group',
                collapsed ? 'justify-center p-3' : 'px-3.5 py-2.5',
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
              )}
              whileHover={{ x: collapsed ? 0 : 2 }}
              whileTap={{ scale: 0.98 }}
            >
              <item.icon className={cn('w-4.5 h-4.5 shrink-0', isActive && 'text-primary')} />
              {!collapsed && (
                <span className={cn('text-xs font-medium tracking-tight', isActive && 'text-primary font-semibold')}>
                  {item.label}
                </span>
              )}
              {isActive && !collapsed && (
                <motion.div
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                  layoutId="sidebarBottomActiveDot"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}

        <motion.button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 rounded-xl transition-smooth text-muted-foreground hover:bg-danger/10 hover:text-danger mt-1',
            collapsed ? 'justify-center p-3' : 'px-3.5 py-2.5'
          )}
          whileHover={{ x: collapsed ? 0 : 2 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="w-4.5 h-4.5 shrink-0" />
          {!collapsed && <span className="text-xs font-medium">{isDemo ? 'Exit Demo' : 'Logout'}</span>}
        </motion.button>
      </div>
    </motion.aside>
  );
}
