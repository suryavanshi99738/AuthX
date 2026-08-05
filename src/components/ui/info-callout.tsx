import React from 'react';
import { cn } from '@/lib/utils';
import { Info, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

export interface InfoCalloutProps {
  variant?: 'info' | 'warning' | 'success' | 'danger';
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

const variantStyles = {
  info: 'bg-blue-50/50 dark:bg-blue-950/20 border-l-blue-500 text-blue-800 dark:text-blue-300',
  warning: 'bg-amber-50/50 dark:bg-amber-950/20 border-l-amber-500 text-amber-800 dark:text-amber-300',
  success: 'bg-emerald-50/50 dark:bg-emerald-950/20 border-l-emerald-500 text-emerald-800 dark:text-emerald-300',
  danger: 'bg-red-50/50 dark:bg-red-950/20 border-l-red-500 text-red-800 dark:text-red-300',
};

const iconMap = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
  danger: AlertCircle,
};

export function InfoCallout({ variant = 'info', title, children, icon, className }: InfoCalloutProps) {
  const IconComponent = iconMap[variant];
  const renderedIcon = icon || <IconComponent className="w-4 h-4" />;

  return (
    <div className={cn("rounded-lg p-4 border-l-[3px]", variantStyles[variant], className)}>
      {title && (
        <div className="flex items-center gap-2 mb-1.5 text-sm font-medium">
          {renderedIcon}
          <span>{title}</span>
        </div>
      )}
      <div className={cn("text-sm text-muted-foreground", !title && "flex items-start gap-2")}>
        {!title && <div className="mt-0.5 flex-shrink-0">{renderedIcon}</div>}
        <div>{children}</div>
      </div>
    </div>
  );
}
