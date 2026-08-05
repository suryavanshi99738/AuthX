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
  info: 'bg-info/10 border-l-info text-info',
  warning: 'bg-warning/10 border-l-warning text-warning',
  success: 'bg-success/10 border-l-success text-success',
  danger: 'bg-danger/10 border-l-danger text-danger',
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
