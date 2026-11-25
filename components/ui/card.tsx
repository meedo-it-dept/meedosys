import React from 'react';
import { cn } from '@/lib/utils';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-slate-200/85 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_6px_16px_-6px_rgba(15,23,42,0.05)] p-6 overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn('flex items-center justify-between pb-4 mb-4 border-b border-slate-100', className)}
      {...props}
    >
      {children}
    </div>
  );
};
