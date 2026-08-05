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
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Derived effective collapsed state: collapsed if NOT pinned AND NOT hovered
  const collapsed = !isPinned && !isHovered;

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

  const togglePin = () => {
    setIsPinned((prev) => !prev);
  };

  return (
    <motion.aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'h-screen flex flex-col bg-[#1A312C] border-r border-[#24423C] text-[#E2E8F0] transition-all duration-300 select-none shrink-0 overflow-hidden sticky top-0 z-20 shadow-lg',
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
            <ShieldCheck className="w-7 h-7 text-[#89D7B7]" />
            <span className="font-heading text-lg font-semibold tracking-tight text-[#E2E8F0]">AuthX</span>
            {isDemo && (
              <StatusBadge variant="warning">Demo</StatusBadge>
            )}
          </div>
        ) : (
          <ShieldCheck className="w-7 h-7 text-[#89D7B7]" />
        )}

        <button
          onClick={togglePin}
          className="w-8 h-8 rounded-lg hover:bg-[#24423C] flex items-center justify-center text-[#E2E8F0]/70 hover:text-[#E2E8F0] transition-smooth cursor-pointer"
          title={isPinned ? 'Unpin sidebar (Auto-collapse on exit)' : 'Pin sidebar expanded'}
        >
          {!collapsed ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Main Navigation Items */}
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
                  ? 'bg-[#428475] text-white font-medium border-l-4 border-[#89D7B7]'
                  : 'text-[#E2E8F0]/70 hover:bg-[#24423C] hover:text-[#E2E8F0] border-l-4 border-transparent'
              )}
              whileHover={{ x: collapsed ? 0 : 2 }}
              whileTap={{ scale: 0.98 }}
            >
              <item.icon className={cn('w-5 h-5 shrink-0', isActive && 'text-white')} />
              {!collapsed && (
                <span className={cn('font-medium tracking-tight whitespace-nowrap', isActive && 'text-white font-medium')}>
                  {item.label}
                </span>
              )}
              {isActive && !collapsed && (
                <motion.div
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-[#89D7B7]"
                  layoutId="sidebarActiveDot"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Bottom Section: Settings & Profile & Logout */}
      <div className="mt-auto border-t border-[#24423C] px-3 py-3 space-y-1">
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
                  ? 'bg-[#428475] text-white font-medium border-l-4 border-[#89D7B7]'
                  : 'text-[#E2E8F0]/70 hover:bg-[#24423C] hover:text-[#E2E8F0] border-l-4 border-transparent'
              )}
              whileHover={{ x: collapsed ? 0 : 2 }}
              whileTap={{ scale: 0.98 }}
            >
              <item.icon className={cn('w-5 h-5 shrink-0', isActive && 'text-white')} />
              {!collapsed && (
                <span className={cn('font-medium tracking-tight whitespace-nowrap', isActive && 'text-white font-medium')}>
                  {item.label}
                </span>
              )}
              {isActive && !collapsed && (
                <motion.div
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-[#89D7B7]"
                  layoutId="sidebarBottomActiveDot"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}

        <div className="border-b border-[#24423C] my-2" />

        <motion.button
          onClick={handleLogout}
          title={collapsed ? (isDemo ? 'Exit Demo' : 'Logout') : undefined}
          className={cn(
            'w-full flex items-center gap-3 rounded-lg transition-smooth cursor-pointer text-[#E2E8F0]/70 hover:bg-[#24423C] hover:text-[#E2E8F0] border-l-4 border-transparent',
            collapsed ? 'justify-center p-2' : 'px-3 py-2 text-sm'
          )}
          whileHover={{ x: collapsed ? 0 : 2 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="font-medium whitespace-nowrap">{isDemo ? 'Exit Demo' : 'Logout'}</span>}
        </motion.button>
      </div>
    </motion.aside>
  );
}
