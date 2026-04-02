import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || React.useId();
    
    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-primary"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          className={cn(
            'flex h-9 w-full border border-surface-border bg-surface px-3 py-2 text-sm text-text-primary',
            'placeholder:text-text-muted',
            'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-cream',
            error && 'border-danger focus:ring-danger focus:border-danger',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-xs text-danger mt-1">{error}</p>}
        {hint && !error && <p className="text-xs text-text-muted mt-1">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
