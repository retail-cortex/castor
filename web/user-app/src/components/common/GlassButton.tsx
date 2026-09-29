import React from 'react';
import { Icon } from './Icon';

export type ButtonVariant = 'primary' | 'tonal' | 'tertiary' | 'outlined' | 'danger' | 'fab';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  iconTrailing?: string;
  isLoading?: boolean;
  children: React.ReactNode;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  variant = 'tonal',
  size = 'md',
  icon,
  iconTrailing,
  isLoading = false,
  className = '',
  disabled,
  children,
  ...props
}) => {
  let sizeClass = 'px-4 py-2 text-sm gap-2';
  let iconSize: 16 | 18 | 20 | 24 = 18;
  if (size === 'sm') {
    sizeClass = 'px-3 py-1.5 text-xs gap-1.5 rounded-sm';
    iconSize = 16;
  } else if (size === 'lg') {
    sizeClass = 'px-6 py-3 text-base gap-2.5 rounded-xl';
    iconSize = 20;
  } else {
    sizeClass = 'px-4 py-2.5 text-sm gap-2 rounded-md';
    iconSize = 18;
  }

  let variantClass = '';
  switch (variant) {
    case 'primary':
      variantClass =
        'bg-gradient-to-r from-primary to-primary-container hover:from-primary-fixed-dim hover:to-primary text-on-primary font-semibold shadow-lg shadow-primary/20 border-t border-white/30';
      break;
    case 'tonal':
      variantClass =
        'bg-surface-container hover:bg-surface-container-high text-primary border border-outline-variant/50 hover:border-primary/40 hover:shadow-sm hover:shadow-primary/10';
      break;
    case 'tertiary':
      variantClass =
        'bg-tertiary-container/40 hover:bg-tertiary-container/60 text-tertiary border border-tertiary/30';
      break;
    case 'outlined':
      variantClass =
        'bg-transparent hover:bg-white/[0.05] text-on-surface border border-outline/40 hover:border-on-surface-variant';
      break;
    case 'danger':
      variantClass =
        'bg-error-container/40 hover:bg-error-container/70 text-error border border-error/40';
      break;
    case 'fab':
      variantClass =
        'bg-gradient-to-r from-primary to-secondary-container hover:from-primary-fixed hover:to-secondary-container text-on-primary font-semibold rounded-full shadow-2xl shadow-primary/30 border border-white/20';
      break;
  }

  return (
    <button
      className={`inline-flex items-center justify-center font-sans tracking-wide transition-all duration-150 active:scale-[0.98] disabled:opacity-45 disabled:pointer-events-none disabled:active:scale-100 ${sizeClass} ${variantClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon && <Icon name={icon} size={iconSize} />
      )}
      <span>{children}</span>
      {iconTrailing && !isLoading && <Icon name={iconTrailing} size={iconSize} />}
    </button>
  );
};
