import React from 'react';
import { Icon } from '../common/Icon';

interface NavigationRailProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: string;
  isAi?: boolean;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({ currentView, onNavigate }) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'skills', label: 'Catalog', icon: 'extension' },
    { id: 'agent', label: 'AI Architect', icon: 'auto_awesome', isAi: true },
    { id: 'manual', label: 'Studio', icon: 'edit_note' },
    { id: 'workspaces', label: 'Workspaces', icon: 'corporate_fare' },
    { id: 'profile', label: 'Profile', icon: 'account_circle' },
  ];

  return (
    <aside className="w-16 sm:w-20 bg-surface-dim/90 backdrop-blur-xl border-r border-outline-variant/30 flex flex-col items-center py-4 justify-between shrink-0 select-none z-30">
      {/* Top Nav Icons */}
      <div className="flex flex-col items-center gap-3 w-full">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`group relative flex flex-col items-center justify-center w-12 h-14 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'text-primary'
                  : 'text-outline hover:text-on-surface hover:bg-white/[0.04]'
              }`}
            >
              {/* Active Indicator Pill */}
              <div
                className={`w-10 h-7 rounded-full flex items-center justify-center transition-all ${
                  isActive
                    ? item.isAi
                      ? 'bg-gradient-to-r from-primary-container/40 to-tertiary-container/50 border border-primary/40 shadow-sm shadow-primary/30'
                      : 'bg-primary-container/30 border border-primary/30'
                    : 'group-hover:bg-white/[0.06]'
                }`}
              >
                <Icon
                  name={item.icon}
                  size={20}
                  fill={isActive}
                  className={item.isAi && isActive ? 'text-cyan-300' : ''}
                />
              </div>

              {/* Label */}
              <span className="text-[10px] font-medium tracking-tight mt-1 truncate max-w-[56px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom Status Indicator */}
      <div className="flex flex-col items-center gap-2">
        <div
          title="Castor Registry: Online"
          className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse"
        />
        <span className="text-[9px] font-mono text-outline">v1.0</span>
      </div>
    </aside>
  );
};
