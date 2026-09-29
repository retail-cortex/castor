import React, { useEffect } from 'react';
import { Icon } from './Icon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  maxWidth = 'lg',
  children,
  footer,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  let widthClass = 'max-w-lg';
  if (maxWidth === 'sm') widthClass = 'max-w-sm';
  if (maxWidth === 'md') widthClass = 'max-w-md';
  if (maxWidth === 'xl') widthClass = 'max-w-xl';
  if (maxWidth === '2xl') widthClass = 'max-w-2xl';
  if (maxWidth === '4xl') widthClass = 'max-w-4xl';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-surface-dim/80 backdrop-blur-md transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Surface */}
      <div
        className={`relative w-full ${widthClass} glass-panel-overlay rounded-xl border border-outline-variant/60 shadow-2xl p-6 z-10 animate-in zoom-in-95 duration-150 flex flex-col gap-4 my-8`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant/30 pb-3">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-10 h-10 rounded-xl bg-primary-container/20 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                <Icon name={icon} size={22} />
              </div>
            )}
            <div>
              <h2 className="text-lg font-heading font-semibold text-on-surface tracking-tight">{title}</h2>
              {subtitle && <p className="text-xs text-on-surface-variant mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/[0.08] text-outline hover:text-on-surface transition-colors"
            aria-label="Close dialog"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Body Content */}
        <div className="text-sm text-on-surface">{children}</div>

        {/* Footer */}
        {footer && <div className="border-t border-outline-variant/30 pt-3 mt-2 flex justify-end gap-2.5">{footer}</div>}
      </div>
    </div>
  );
};
