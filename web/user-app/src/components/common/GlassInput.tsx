import React from 'react';
import { Icon } from './Icon';

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  iconLeading?: string;
  iconTrailing?: string;
  onTrailingIconClick?: () => void;
}

export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ label, error, iconLeading, iconTrailing, onTrailingIconClick, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && <label className="text-xs font-medium text-on-surface-variant">{label}</label>}
        <div className="relative flex items-center w-full">
          {iconLeading && (
            <div className="absolute left-3.5 pointer-events-none text-outline">
              <Icon name={iconLeading} size={18} />
            </div>
          )}
          <input
            ref={ref}
            className={`w-full bg-surface-container-lowest/60 border ${
              error ? 'border-error ring-1 ring-error/40' : 'border-outline-variant/40'
            } rounded-md px-3.5 py-2 text-sm text-on-surface placeholder-outline focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-150 ${
              iconLeading ? 'pl-10' : ''
            } ${iconTrailing ? 'pr-10' : ''} ${className}`}
            {...props}
          />
          {iconTrailing && (
            <button
              type="button"
              onClick={onTrailingIconClick}
              className="absolute right-3 text-outline hover:text-on-surface transition-colors"
            >
              <Icon name={iconTrailing} size={18} />
            </button>
          )}
        </div>
        {error && <span className="text-xs text-error">{error}</span>}
      </div>
    );
  }
);
GlassInput.displayName = 'GlassInput';
