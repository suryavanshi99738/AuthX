import React from 'react';
import { cn } from '@/lib/utils';
import { AnimatedCounter } from './animated-counter';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  accentColor?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  animate?: boolean;
  className?: string;
}

const accentColors = {
  primary: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400',
  success: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
  warning: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
  danger: 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400',
  info: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
};

export function StatCard({ label, value, icon, trend, accentColor = 'primary', animate = false, className }: StatCardProps) {
  const isNumber = typeof value === 'number';
  const numericValue = isNumber ? value as number : 0;
  
  let prefix = '';
  let suffix = '';
  let numForAnimate = numericValue;
  
  if (!isNumber && animate && typeof value === 'string') {
    const match = value.match(/^([^0-9.-]*)([0-9.-]+)([^0-9.-]*)$/);
    if (match) {
      prefix = match[1];
      numForAnimate = parseFloat(match[2]);
      suffix = match[3];
    } else {
      animate = false;
    }
  }

  return (
    <div className={cn(
      "bg-card text-card-foreground rounded-xl border border-border/50 shadow-sm transition-all duration-200",
      "hover:shadow-md hover:-translate-y-0.5 p-6",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-4 flex-1">
          {icon && (
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", accentColors[accentColor])}>
              {icon}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <h3 className="text-2xl font-semibold tracking-tight mt-1 text-foreground">
              {animate ? (
                <AnimatedCounter value={numForAnimate} prefix={prefix} suffix={suffix} />
              ) : (
                value
              )}
            </h3>
          </div>
        </div>
        {trend && (
          <div className={cn(
            "flex items-center text-xs font-medium px-2 py-1 rounded-md",
            trend.isPositive ? "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/50" : "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/50"
          )}>
            {trend.isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
    </div>
  );
}
