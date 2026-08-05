import React from 'react';
import { cn } from '@/lib/utils';
import { AnimatedCounter } from './animated-counter';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardProps {
  label?: string;
  title?: string;
  value: string | number | React.ReactNode;
  subtitle?: string;
  description?: string;
  icon?: React.ReactNode;
  trend?: { value: number | string; isPositive?: boolean };
  accentColor?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  animate?: boolean;
  className?: string;
}

const accentColors = {
  primary: 'bg-primary/10 text-primary border border-primary/20',
  success: 'bg-success/10 text-success border border-success/20',
  warning: 'bg-warning/10 text-warning border border-warning/20',
  danger: 'bg-danger/10 text-danger border border-danger/20',
  info: 'bg-info/10 text-info border border-info/20',
};

export function StatCard({
  label,
  title,
  value,
  subtitle,
  description,
  icon,
  trend,
  accentColor = 'primary',
  animate = false,
  className,
}: StatCardProps) {
  const displayTitle = title || label || 'Metric';
  const isNumber = typeof value === 'number';
  const numericValue = isNumber ? (value as number) : 0;

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

  // Format trend badge text safely without NaN
  let trendText = '';
  let isPositiveTrend = trend?.isPositive !== false;
  if (trend) {
    if (typeof trend.value === 'number' && !isNaN(trend.value)) {
      trendText = `${Math.abs(trend.value)}%`;
    } else if (typeof trend.value === 'string' && trend.value.trim().length > 0) {
      trendText = trend.value;
    }
  }

  return (
    <div
      className={cn(
        'bg-card text-card-foreground rounded-2xl border border-border/80 shadow-sm transition-all duration-200',
        'hover:shadow-md hover:-translate-y-0.5 p-6 sm:p-7 h-full flex flex-col justify-between min-h-[170px]',
        className
      )}
    >
      {/* Top Row: Icon & Title & Trend Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {icon && (
            <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs mt-0.5', accentColors[accentColor])}>
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold tracking-tight text-foreground font-heading truncate">{displayTitle}</h4>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5 font-sans leading-relaxed line-clamp-1 truncate">
                {description}
              </p>
            )}
          </div>
        </div>

        {trendText && (
          <div
            className={cn(
              'flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0',
              isPositiveTrend
                ? 'text-success bg-success/10 border-success/20'
                : 'text-danger bg-danger/10 border-danger/20'
            )}
          >
            {isPositiveTrend ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            <span>{trendText}</span>
          </div>
        )}
      </div>

      {/* Main Value & Subtitle */}
      <div className="mt-4 pt-2">
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading leading-none truncate">
          {animate && (isNumber || typeof value === 'string') ? (
            <AnimatedCounter value={numForAnimate} prefix={prefix} suffix={suffix} />
          ) : (
            value
          )}
        </div>
        {subtitle && (
          <p className="text-xs font-medium text-muted-foreground mt-2 flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/70 inline-block shrink-0" />
            <span className="truncate">{subtitle}</span>
          </p>
        )}
      </div>
    </div>
  );
}
