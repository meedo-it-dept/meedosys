import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.985] disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-[0_1px_2px_rgba(37,99,235,0.25)]',
    secondary: 'bg-slate-100 text-slate-800 border border-slate-200/80 hover:bg-slate-200/80 focus:ring-slate-400',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-[0_1px_2px_rgba(5,150,105,0.25)]',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-[0_1px_2px_rgba(225,29,72,0.25)]',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-300',
    outline: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus:ring-blue-500 shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      className={cn(baseClasses, variants[variant], sizes[size], className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
