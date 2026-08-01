'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Home,
  Shield,
  ShieldCheck,
  QrCode,
  Clock,
  User,
  Settings,
  LogOut,
  PanelLeft,
  PanelLeftClose,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface SidebarItem {
  id: string;
  icon: React.ElementType;
  label: string;
  mobileOnly?: boolean;
  onClick?: () => void;
  danger?: boolean;
}

interface SidebarProps {
  activeItem: string;
  onItemClick: (id: string) => void;
  isDemo?: boolean;
}

const sidebarItems: SidebarItem[] = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'security', icon: Shield, label: 'Security Center' },
  { id: 'link_device', icon: QrCode, label: 'Link Device', mobileOnly: true },
  { id: 'history', icon: Clock, label: 'Login History' },
  { id: 'profile', icon: User, label: 'Profile' },
  { id: 'settings', icon: Settings, label: 'Settings' },
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
        'flex flex-col h-full bg-card border-r border-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Brand header */}
      <div className={cn('p-4 border-b border-border', collapsed && 'p-3')}>
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
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
        )}
      </div>

      {/* Toggle icon */}
      <div className={cn('px-2 pt-2 pb-1', collapsed ? 'flex justify-center' : 'flex items-center justify-end')}>
        <motion.button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-muted transition-smooth group"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeft className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-smooth" />
          ) : (
            <PanelLeftClose className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-smooth" />
          )}
        </motion.button>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 py-2 px-2 space-y-1">
        {sidebarItems.map((item) => {
          if (item.mobileOnly && !isMobile) return null;
          const isActive = activeItem === item.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className={cn(
                'w-full flex items-center gap-3 rounded-xl transition-smooth group',
                collapsed ? 'justify-center p-3' : 'px-3 py-2.5',
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              whileHover={{ x: collapsed ? 0 : 2 }}
              whileTap={{ scale: 0.98 }}
            >
              <item.icon className={cn('w-5 h-5 shrink-0', isActive && 'text-primary')} />
              {!collapsed && (
                <span className={cn('text-sm font-medium', isActive && 'text-primary')}>
                  {item.label}
                </span>
              )}
              {isActive && !collapsed && (
                <motion.div
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                  layoutId="activeIndicator"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-border">
        <motion.button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 rounded-xl transition-smooth text-muted-foreground hover:bg-danger/10 hover:text-danger',
            collapsed ? 'justify-center p-3' : 'px-3 py-2.5'
          )}
          whileHover={{ x: collapsed ? 0 : 2 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="text-sm font-medium">{isDemo ? 'Exit Demo' : 'Logout'}</span>}
        </motion.button>
      </div>
    </motion.aside>
  );
}
