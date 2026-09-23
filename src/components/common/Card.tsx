import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  headerBorder?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  action,
  headerBorder = true,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-slate-200/90 shadow-sm transition-shadow hover:shadow-md/5 overflow-hidden',
        className
      )}
      {...props}
    >
      {(title || action) && (
        <div
          className={cn(
            'px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5',
            headerBorder && 'border-b border-slate-100'
          )}
        >
          <div>
            {title && (
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                {title}
              </h3>
            )}
          </div>
          {action && <div className="flex items-center gap-2 flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
};
