import React from 'react';
import { Icon } from './Icon';

interface FilterChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  icon?: string;
  count?: number;
  className?: string;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  selected,
  onClick,
  icon,
  count,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 active:scale-95 ${
        selected
          ? 'bg-primary-container/80 text-on-primary-container border border-primary/50 shadow-sm shadow-primary/20'
          : 'bg-surface-container/60 hover:bg-surface-container-high/80 text-on-surface-variant border border-outline-variant/30 hover:border-outline/40'
      } ${className}`}
    >
      {selected ? (
        <Icon name="check" size={14} className="text-primary font-bold" />
      ) : (
        icon && <Icon name={icon} size={14} className="text-outline" />
      )}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
            selected ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-highest text-outline'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
};
