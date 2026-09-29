import React, { useState } from 'react';
import { Icon } from '../common/Icon';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { StatusBadge } from '../common/StatusBadge';

interface TopAppBarProps {
  onOpenCommandPalette: () => void;
  onNavigate: (view: string) => void;
  currentView: string;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  onOpenCommandPalette,
  onNavigate,
  currentView,
}) => {
  const { userClaims, logout } = useAuth();
  const { activeApp, allWorkspaces, switchWorkspace } = useWorkspace();
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState<boolean>(false);
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-surface-dim/80 backdrop-blur-2xl border-b border-outline-variant/30 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Brand & Workspace Switcher */}
      <div className="flex items-center gap-4 shrink-0">
        <div
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-on-primary font-bold shadow-md shadow-primary/25 border border-white/20 group-hover:scale-105 transition-transform">
            <Icon name="bolt" size={20} />
          </div>
          <div className="hidden md:flex flex-col">
            <span className="font-heading font-bold text-base tracking-tight text-on-surface">
              CASTOR<span className="text-primary text-xs ml-1 font-mono uppercase px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">Studio</span>
            </span>
          </div>
        </div>

        <div className="h-5 w-[1px] bg-outline-variant/50 hidden sm:block" />

        {/* Workspace Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container/60 hover:bg-surface-container-high/80 border border-outline-variant/40 hover:border-outline/50 transition-all text-left text-xs"
          >
            <Icon name="corporate_fare" size={16} className="text-primary" />
            <div className="flex flex-col">
              <span className="font-semibold text-on-surface line-clamp-1">{activeApp.appName}</span>
              <span className="text-[10px] font-mono text-outline line-clamp-1">{activeApp.domain}</span>
            </div>
            <Icon name={workspaceMenuOpen ? 'expand_less' : 'expand_more'} size={16} className="text-outline ml-1" />
          </button>

          {workspaceMenuOpen && (
            <div className="absolute left-0 mt-2 w-72 glass-panel-overlay rounded-xl border border-outline-variant/50 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[11px] font-mono text-outline uppercase tracking-wider border-b border-outline-variant/30 mb-1">
                Switch Workspace Group
              </div>
              {allWorkspaces.map((ws) => (
                <button
                  key={ws.appId}
                  type="button"
                  onClick={() => {
                    switchWorkspace(ws.appId);
                    setWorkspaceMenuOpen(false);
                  }}
                  className={`w-full flex items-start justify-between p-2.5 rounded-lg text-left text-xs transition-colors ${
                    ws.appId === activeApp.appId
                      ? 'bg-primary-container/20 border border-primary/40 text-primary'
                      : 'hover:bg-white/[0.05] text-on-surface'
                  }`}
                >
                  <div>
                    <div className="font-semibold">{ws.appName}</div>
                    <div className="text-[10px] font-mono text-outline truncate max-w-[170px]">{ws.appUrn}</div>
                  </div>
                  <StatusBadge type="domain" value={ws.domainVerificationStatus} className="scale-90 origin-right" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center: M3 Search Bar Trigger */}
      <div className="flex-1 max-w-xl mx-2">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="w-full h-10 rounded-full bg-surface-container-high/50 hover:bg-surface-container-highest/60 border border-outline-variant/40 hover:border-primary/40 px-4 flex items-center justify-between text-xs text-outline transition-all duration-150 group shadow-inner"
        >
          <div className="flex items-center gap-2.5">
            <Icon name="search" size={18} className="text-primary/70 group-hover:text-primary transition-colors" />
            <span className="group-hover:text-on-surface transition-colors font-sans">
              Search skills, tools, schemas...
            </span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-full bg-surface-container-lowest/80 border border-outline-variant/40 text-outline">
            <span>⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right: Quick Action & User Menu */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => onNavigate('agent')}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-md shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Icon name="auto_awesome" size={15} />
          <span>New AI Skill</span>
        </button>

        {/* Profile Avatar Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-white/[0.08] transition-colors"
          >
            {userClaims?.picture ? (
              <img
                src={userClaims.picture}
                alt="Avatar"
                className="w-8 h-8 rounded-full border border-primary/40 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary">
                <Icon name="account_circle" size={20} />
              </div>
            )}
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 glass-panel-overlay rounded-xl border border-outline-variant/50 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 flex flex-col gap-2">
              <div className="border-b border-outline-variant/30 pb-2">
                <div className="text-sm font-semibold text-on-surface">{userClaims?.name || 'Ryan McGuinness'}</div>
                <div className="text-xs text-outline font-mono truncate">{userClaims?.email || 'ryan@retailcortex.com'}</div>
                <div className="text-[10px] font-mono text-primary mt-1">
                  {userClaims?.preferred_username || '@ryan'}
                </div>
              </div>

              <div className="flex flex-col gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('profile');
                    setUserMenuOpen(false);
                  }}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-white/[0.06] transition-colors ${
                    currentView === 'profile' ? 'bg-primary-container/20 text-primary font-semibold' : 'text-on-surface'
                  }`}
                >
                  <Icon name="manage_accounts" size={16} />
                  <span>Profile & Governance</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onNavigate('workspaces');
                    setUserMenuOpen(false);
                  }}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-white/[0.06] transition-colors ${
                    currentView === 'workspaces' ? 'bg-primary-container/20 text-primary font-semibold' : 'text-on-surface'
                  }`}
                >
                  <Icon name="group" size={16} />
                  <span>Team & Collaborators</span>
                </button>
              </div>

              <div className="border-t border-outline-variant/30 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs text-error hover:bg-error-container/20 transition-colors"
                >
                  <Icon name="logout" size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
