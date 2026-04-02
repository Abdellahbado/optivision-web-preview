import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium',
        {
          'bg-cream text-text-secondary border border-surface-border': variant === 'default',
          'bg-accent-light text-accent border border-accent/20': variant === 'primary',
          'bg-success-light text-success border border-success/20': variant === 'success',
          'bg-warning-light text-warning border border-warning/20': variant === 'warning',
          'bg-danger-light text-danger border border-danger/20': variant === 'danger',
          'bg-info-light text-info border border-info/20': variant === 'info',
        },
        className
      )}
    >
      {children}
    </span>
  );
}
