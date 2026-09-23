import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 
    | 'default'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'purple'
    | 'outline'
    | 'present'
    | 'absent'
    | 'halfday'
    | 'late'
    | 'leave'
    | 'wfh';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
}) => {
  const baseStyles = 'inline-flex items-center font-semibold rounded-full tracking-wide';

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200/80',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200/80',
    info: 'bg-sky-50 text-sky-700 border border-sky-200/80',
    purple: 'bg-brand-50 text-brand-800 border border-brand-200',
    outline: 'bg-transparent text-slate-600 border border-slate-300',
    
    // HRMS Status Specials
    present: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold',
    absent: 'bg-rose-100 text-rose-800 border border-rose-300 font-bold',
    halfday: 'bg-amber-100 text-amber-800 border border-amber-300 font-bold',
    late: 'bg-orange-100 text-orange-800 border border-orange-300 font-bold',
    leave: 'bg-purple-100 text-purple-800 border border-purple-300 font-bold',
    wfh: 'bg-indigo-100 text-indigo-800 border border-indigo-300 font-bold',
  };

  return (
    <span className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}>
      {children}
    </span>
  );
};
