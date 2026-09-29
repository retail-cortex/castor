import React from 'react';

export type GlassElevation = 0 | 1 | 2 | 3;

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: GlassElevation;
  hoverEffect?: boolean;
  glowColor?: 'cyan' | 'purple' | 'none';
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  elevation = 1,
  hoverEffect = false,
  glowColor = 'none',
  className = '',
  children,
  ...props
}) => {
  let elevationClass = 'glass-panel';
  if (elevation === 0) elevationClass = 'bg-surface/50 border border-outline-variant/30';
  if (elevation === 2) elevationClass = 'glass-panel-elevated';
  if (elevation === 3) elevationClass = 'glass-panel-overlay';

  const hoverClass = hoverEffect
    ? 'transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:bg-surface-container/80'
    : '';

  let glowClass = '';
  if (glowColor === 'cyan') glowClass = 'specular-glow-cyan';
  if (glowColor === 'purple') glowClass = 'specular-glow-purple';

  return (
    <div
      className={`rounded-xl p-5 ${elevationClass} ${hoverClass} ${glowClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
