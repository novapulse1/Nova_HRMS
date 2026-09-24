import React from 'react';
import { cn } from '../../utils/cn';

export interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode; // Suppressed per design requirement
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  titleClassName?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  badge,
  actions,
  className,
  titleClassName,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-0.5',
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <h2 className={cn('text-xl font-extrabold text-white tracking-tight', titleClassName)}>
          {title}
        </h2>
        {badge && <div>{badge}</div>}
      </div>

      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
};

