import * as React from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface OpticalInputProps {
  label?: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  step?: number;
  min?: number;
  max?: number;
  placeholder?: string;
  error?: string;
  hint?: string;
  showSign?: boolean; // Show + prefix for positive values
  disabled?: boolean;
  className?: string;
}

/**
 * Specialized input for optical values (sphere, cylinder, addition)
 * with +/- buttons that increment by the standard optical step (0.25)
 */
export function OpticalInput({
  label,
  value,
  onChange,
  step = 0.25,
  min = -20,
  max = 20,
  placeholder = '0.00',
  error,
  hint,
  showSign = true,
  disabled = false,
  className,
}: OpticalInputProps) {
  const inputId = React.useId();

  // Format value for display
  const formatValue = (val: number | undefined): string => {
    if (val === undefined || val === null) return '';
    const formatted = val.toFixed(2);
    if (showSign && val > 0) return `+${formatted}`;
    return formatted;
  };

  // Parse input string to number
  const parseInput = (str: string): number | undefined => {
    if (str === '' || str === '-' || str === '+') return undefined;
    const cleaned = str.replace(/[^0-9.\-+]/g, '');
    const num = parseFloat(cleaned);
    if (isNaN(num)) return undefined;
    return num;
  };

  // Round to step
  const roundToStep = (val: number): number => {
    return Math.round(val / step) * step;
  };

  // Clamp value to min/max
  const clamp = (val: number): number => {
    return Math.max(min, Math.min(max, val));
  };

  const handleIncrement = () => {
    if (disabled) return;
    const current = value ?? 0;
    const newVal = clamp(roundToStep(current + step));
    onChange(newVal);
  };

  const handleDecrement = () => {
    if (disabled) return;
    const current = value ?? 0;
    const newVal = clamp(roundToStep(current - step));
    onChange(newVal);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseInput(e.target.value);
    if (parsed !== undefined) {
      onChange(clamp(roundToStep(parsed)));
    } else {
      onChange(undefined);
    }
  };

  const handleBlur = () => {
    if (value !== undefined) {
      onChange(clamp(roundToStep(value)));
    }
  };

  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-text-primary"
        >
          {label}
        </label>
      )}
      <div className="flex items-center">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || (value !== undefined && value <= min)}
          className={cn(
            'flex items-center justify-center w-8 h-9 border border-r-0 border-surface-border bg-cream',
            'hover:bg-surface-border transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'focus:outline-none focus:ring-1 focus:ring-accent'
          )}
          tabIndex={-1}
          aria-label="Décrémenter"
        >
          <Minus className="h-3.5 w-3.5 text-text-secondary" />
        </button>
        <input
          id={inputId}
          type="text"
          inputMode="decimal"
          value={formatValue(value)}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'flex h-9 w-full border-y border-surface-border bg-surface px-2 py-2 text-sm text-center text-text-primary',
            'placeholder:text-text-muted',
            'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent focus:z-10',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-cream',
            error && 'border-danger focus:ring-danger focus:border-danger'
          )}
        />
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || (value !== undefined && value >= max)}
          className={cn(
            'flex items-center justify-center w-8 h-9 border border-l-0 border-surface-border bg-cream',
            'hover:bg-surface-border transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'focus:outline-none focus:ring-1 focus:ring-accent'
          )}
          tabIndex={-1}
          aria-label="Incrémenter"
        >
          <Plus className="h-3.5 w-3.5 text-text-secondary" />
        </button>
      </div>
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
      {hint && !error && <p className="text-xs text-text-muted mt-1">{hint}</p>}
    </div>
  );
}

// Axis input (0-180 degrees, step of 1 or 5)
export interface AxisInputProps {
  label?: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  step?: number;
  error?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
}

export function AxisInput({
  label,
  value,
  onChange,
  step = 5,
  error,
  hint,
  disabled = false,
  className,
}: AxisInputProps) {
  const inputId = React.useId();

  const handleIncrement = () => {
    if (disabled) return;
    const current = value ?? 0;
    let newVal = current + step;
    if (newVal > 180) newVal = 0;
    onChange(newVal);
  };

  const handleDecrement = () => {
    if (disabled) return;
    const current = value ?? 0;
    let newVal = current - step;
    if (newVal < 0) newVal = 180;
    onChange(newVal);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const str = e.target.value.replace(/[^0-9]/g, '');
    if (str === '') {
      onChange(undefined);
      return;
    }
    let num = parseInt(str, 10);
    if (isNaN(num)) return;
    // Clamp to 0-180
    num = Math.max(0, Math.min(180, num));
    onChange(num);
  };

  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-text-primary"
        >
          {label}
        </label>
      )}
      <div className="flex items-center">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled}
          className={cn(
            'flex items-center justify-center w-8 h-9 border border-r-0 border-surface-border bg-cream',
            'hover:bg-surface-border transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'focus:outline-none focus:ring-1 focus:ring-accent'
          )}
          tabIndex={-1}
          aria-label="Décrémenter axe"
        >
          <Minus className="h-3.5 w-3.5 text-text-secondary" />
        </button>
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          value={value !== undefined ? `${value}°` : ''}
          onChange={handleInputChange}
          placeholder="0°"
          disabled={disabled}
          className={cn(
            'flex h-9 w-full border-y border-surface-border bg-surface px-2 py-2 text-sm text-center text-text-primary',
            'placeholder:text-text-muted',
            'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent focus:z-10',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-cream',
            error && 'border-danger focus:ring-danger focus:border-danger'
          )}
        />
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled}
          className={cn(
            'flex items-center justify-center w-8 h-9 border border-l-0 border-surface-border bg-cream',
            'hover:bg-surface-border transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'focus:outline-none focus:ring-1 focus:ring-accent'
          )}
          tabIndex={-1}
          aria-label="Incrémenter axe"
        >
          <Plus className="h-3.5 w-3.5 text-text-secondary" />
        </button>
      </div>
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
      {hint && !error && <p className="text-xs text-text-muted mt-1">{hint}</p>}
    </div>
  );
}
