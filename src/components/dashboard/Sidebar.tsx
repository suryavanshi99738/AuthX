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
import { StatusBadge } from '@/components/ui/status-badge';
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
        'h-screen flex flex-col bg-card border-r border-border transition-all duration-300 select-none shrink-0 overflow-hidden sticky top-0 z-20',
        collapsed ? 'w-16' : 'w-64'
      )}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Brand header */}
      <div className={cn('p-4 flex items-center justify-between', collapsed && 'p-3 flex-col justify-center gap-4')}>
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-primary" />
            <span className="font-heading text-lg font-semibold tracking-tight text-foreground">AuthX</span>
            {isDemo && (
              <StatusBadge variant="warning">Demo</StatusBadge>
            )}
          </div>
        ) : (
          <ShieldCheck className="w-7 h-7 text-primary" />
        )}

        {!collapsed ? (
          <button
            onClick={() => setCollapsed(true)}
            className="w-8 h-8 rounded-lg hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-smooth"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed(false)}
            className="w-8 h-8 rounded-lg hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-smooth"
            title="Expand sidebar"
          >
            <PanelLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Navigation Items (Fixed / Non-scrollable layout) */}
      {/* Main Navigation Items (Fixed / Non-scrollable layout) */}
      <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1 scrollbar-none">
        {mainNavItems.map((item) => {
          if (item.mobileOnly && !isMobile) return null;
          const isActive = activeItem === item.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              title={collapsed ? item.label : undefined}
              className={cn(
                'w-full flex items-center gap-3 rounded-lg transition-smooth relative group cursor-pointer',
                collapsed ? 'justify-center p-2' : 'px-3 py-2 text-sm',
                isActive
                  ? 'bg-primary/10 text-primary font-medium border-l-[3px] border-primary'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground border-l-[3px] border-transparent'
              )}
              whileHover={{ x: collapsed ? 0 : 2 }}
              whileTap={{ scale: 0.98 }}
            >
              <item.icon className={cn('w-5 h-5 shrink-0', isActive && 'text-primary')} />
              {!collapsed && (
                <span className={cn('font-medium tracking-tight', isActive && 'text-primary font-medium')}>
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
      <div className="mt-auto border-t border-border px-3 py-3 space-y-1">
        {bottomNavItems.map((item) => {
          const isActive = activeItem === item.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              title={collapsed ? item.label : undefined}
              className={cn(
                'w-full flex items-center gap-3 rounded-lg transition-smooth group cursor-pointer',
                collapsed ? 'justify-center p-2' : 'px-3 py-2 text-sm',
                isActive
                  ? 'bg-primary/10 text-primary font-medium border-l-[3px] border-primary'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground border-l-[3px] border-transparent'
              )}
              whileHover={{ x: collapsed ? 0 : 2 }}
              whileTap={{ scale: 0.98 }}
            >
              <item.icon className={cn('w-5 h-5 shrink-0', isActive && 'text-primary')} />
              {!collapsed && (
                <span className={cn('font-medium tracking-tight', isActive && 'text-primary font-medium')}>
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

        <div className="border-b border-border my-2" />

        <motion.button
          onClick={handleLogout}
          title={collapsed ? (isDemo ? 'Exit Demo' : 'Logout') : undefined}
          className={cn(
            'w-full flex items-center gap-3 rounded-lg transition-smooth cursor-pointer text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400 border-l-[3px] border-transparent',
            collapsed ? 'justify-center p-2' : 'px-3 py-2 text-sm'
          )}
          whileHover={{ x: collapsed ? 0 : 2 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="font-medium">{isDemo ? 'Exit Demo' : 'Logout'}</span>}
        </motion.button>
      </div>
    </motion.aside>
  );
}
