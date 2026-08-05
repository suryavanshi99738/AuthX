import React from 'react';
import { cn } from '@/lib/utils';

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, subtitle, children, className }: ChartCardProps) {
  return (
    <div className={cn("bg-card text-card-foreground rounded-xl border border-border/50 shadow-sm overflow-hidden flex flex-col", className)}>
      <div className="p-6 pb-4">
        <h3 className="text-base font-medium text-foreground">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      <div className="px-6 pb-6 pt-2 flex-1 w-full min-h-[300px]">
        {children}
      </div>
    </div>
  );
}
