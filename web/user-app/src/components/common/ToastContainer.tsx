import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { useToast, ToastItem } from '../../contexts/ToastContext';

const ToastMessage: React.FC<{ toast: ToastItem; onRemove: (id: string) => void }> = ({
  toast,
  onRemove,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number | undefined>(toast.retryAfterSeconds);

  useEffect(() => {
    if (secondsRemaining === undefined || secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev && prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsRemaining]);

  let icon = 'info';
  let borderClass = 'border-primary/40';
  let iconColor = 'text-primary';
  if (toast.type === 'success') {
    icon = 'check_circle';
    borderClass = 'border-emerald-500/40';
    iconColor = 'text-emerald-400';
  } else if (toast.type === 'warning') {
    icon = 'warning';
    borderClass = 'border-amber-500/40';
    iconColor = 'text-amber-400';
  } else if (toast.type === 'error') {
    icon = 'error';
    borderClass = 'border-error/40';
    iconColor = 'text-error';
  }

  return (
    <div
      className={`w-80 sm:w-96 glass-panel-overlay p-4 rounded-xl border ${borderClass} shadow-2xl flex items-start gap-3 text-xs animate-in slide-in-from-bottom-5 duration-200`}
    >
      <Icon name={icon} size={20} className={`${iconColor} shrink-0 mt-0.5`} />
      <div className="flex-1 flex flex-col gap-1">
        <div className="font-semibold text-on-surface">{toast.title}</div>
        {toast.message && <p className="text-on-surface-variant font-sans leading-relaxed">{toast.message}</p>}
        {secondsRemaining !== undefined && secondsRemaining > 0 && (
          <div className="flex items-center gap-1.5 mt-1 font-mono text-[10px] text-amber-300">
            <Icon name="timer" size={12} />
            <span>Retrying in {secondsRemaining}s...</span>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onRemove(toast.id)}
        className="text-outline hover:text-on-surface p-1"
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-auto">
      {toasts.map((toast) => (
        <ToastMessage key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};
