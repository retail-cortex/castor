import React, { useState } from 'react';
import { Icon } from '../common/Icon';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { GlassInput } from '../common/GlassInput';
import { StatusBadge } from '../common/StatusBadge';
import { useProfile } from '../../contexts/ProfileContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';

export const ProfileManager: React.FC = () => {
  const { profile, updatePreferences, updatePreferredHandle, revokeSession, revokeAllOtherSessions } = useProfile();
  const { switchWorkspace, activeApp } = useWorkspace();

  const [handleInput, setHandleInput] = useState<string>(profile?.preferences.preferredHandle || '@ryan');

  if (!profile) return null;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-on-surface tracking-tight flex items-center gap-2.5">
            <Icon name="manage_accounts" size={26} className="text-primary" />
            <span>User Profile & Governance</span>
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Manage your verified OIDC enterprise claims, group memberships, sessions, and environment settings.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Identity & OIDC Claims */}
        <div className="flex flex-col gap-6">
          <GlassCard elevation={2}>
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3 mb-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-on-surface">
                <Icon name="badge" size={18} className="text-primary" />
                <span>Verified OIDC Identity Claims</span>
              </div>
              <StatusBadge type="domain" value="VERIFIED_SSO" />
            </div>

            <div className="flex items-start gap-4 mb-5">
              <img
                src={profile.claims.picture}
                alt="Profile"
                className="w-16 h-16 rounded-2xl border-2 border-primary/40 object-cover shadow-lg shadow-primary/20 shrink-0"
              />
              <div className="flex flex-col">
                <h2 className="text-lg font-heading font-bold text-on-surface">{profile.displayName}</h2>
                <span className="text-xs text-primary font-mono">{profile.title}</span>
                <span className="text-xs text-outline mt-1">{profile.claims.email}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-surface-container-lowest/50 p-3.5 rounded-xl border border-outline-variant/30">
              <div>
                <span className="text-outline block text-[11px]">Subject ID:</span>
                <span className="font-mono text-on-surface select-all">{profile.claims.sub}</span>
              </div>
              <div>
                <span className="text-outline block text-[11px]">Corporate Domain:</span>
                <span className="font-mono text-primary">{profile.claims.hd || 'retailcortex.com'}</span>
              </div>
              <div>
                <span className="text-outline block text-[11px]">Given Name:</span>
                <span className="text-on-surface">{profile.claims.given_name || 'Ryan'}</span>
              </div>
              <div>
                <span className="text-outline block text-[11px]">Family Name:</span>
                <span className="text-on-surface">{profile.claims.family_name || 'McGuinness'}</span>
              </div>
            </div>

            {/* Custom Handle Editor */}
            <div className="mt-4 pt-4 border-t border-outline-variant/30 flex flex-col gap-2">
              <label className="text-xs font-semibold text-on-surface">Preferred Display Handle</label>
              <div className="flex gap-2">
                <GlassInput
                  value={handleInput}
                  onChange={(e) => setHandleInput(e.target.value)}
                  placeholder="@ryan"
                  className="font-mono text-xs"
                />
                <GlassButton
                  variant="primary"
                  size="sm"
                  onClick={() => updatePreferredHandle(handleInput)}
                >
                  Update
                </GlassButton>
              </div>
            </div>
          </GlassCard>

          {/* Theme & Editor Preferences */}
          <GlassCard elevation={1}>
            <div className="flex items-center gap-2 text-sm font-semibold text-on-surface border-b border-outline-variant/30 pb-3 mb-4">
              <Icon name="tune" size={18} className="text-primary" />
              <span>UI Appearance & Editor Settings</span>
            </div>

            <div className="flex flex-col gap-4 text-xs">
              <div>
                <label className="text-outline block mb-1.5 font-medium">Dark Glassmorphic Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['obsidian', 'oled', 'cyberpunk'] as const).map((theme) => (
                    <button
                      key={theme}
                      type="button"
                      onClick={() => updatePreferences({ theme })}
                      className={`p-2 rounded-lg border text-center capitalize font-mono text-[11px] transition-all ${
                        profile.preferences.theme === theme
                          ? 'bg-primary-container/30 border-primary text-primary font-bold'
                          : 'bg-surface-container/40 border-outline-variant/30 text-outline hover:text-on-surface'
                      }`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-outline block mb-1.5 font-medium">Code Typography</label>
                  <select
                    value={profile.preferences.codeFont}
                    onChange={(e) => updatePreferences({ codeFont: e.target.value })}
                    className="w-full bg-surface-container/60 border border-outline-variant/40 rounded-md p-2 text-xs text-on-surface font-mono"
                  >
                    <option value="JetBrains Mono">JetBrains Mono</option>
                    <option value="Space Mono">Space Mono</option>
                    <option value="Fira Code">Fira Code</option>
                  </select>
                </div>

                <div>
                  <label className="text-outline block mb-1.5 font-medium">Monaco Keybinding</label>
                  <select
                    value={profile.preferences.editorKeymap}
                    onChange={(e) => updatePreferences({ editorKeymap: e.target.value as 'standard' | 'vim' })}
                    className="w-full bg-surface-container/60 border border-outline-variant/40 rounded-md p-2 text-xs text-on-surface font-mono"
                  >
                    <option value="standard">Standard (VS Code)</option>
                    <option value="vim">Vim Mode</option>
                  </select>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Workspaces & Active Sessions */}
        <div className="flex flex-col gap-6">
          {/* Workspace Memberships */}
          <GlassCard elevation={2}>
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3 mb-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-on-surface">
                <Icon name="corporate_fare" size={18} className="text-primary" />
                <span>Group & Workspace Memberships</span>
              </div>
              <span className="text-[11px] font-mono text-outline">{profile.memberships.length} Teams</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {profile.memberships.map((ws) => (
                <div
                  key={ws.appId}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                    ws.appId === activeApp.appId
                      ? 'bg-primary-container/20 border-primary/40 shadow-sm shadow-primary/10'
                      : 'bg-surface-container/40 border-outline-variant/30 hover:border-outline/40'
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-on-surface">{ws.appName}</span>
                      <StatusBadge type="role" value={ws.role} />
                    </div>
                    <span className="text-[10px] font-mono text-outline mt-0.5">{ws.appUrn}</span>
                  </div>

                  {ws.appId === activeApp.appId ? (
                    <span className="text-[11px] font-mono text-primary font-bold px-2 py-1 rounded bg-primary/10 border border-primary/30">
                      ACTIVE
                    </span>
                  ) : (
                    <GlassButton
                      size="sm"
                      variant="tonal"
                      onClick={() => switchWorkspace(ws.appId)}
                    >
                      Switch
                    </GlassButton>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Active Sessions & Remote Logout */}
          <GlassCard elevation={1}>
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3 mb-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-on-surface">
                <Icon name="devices" size={18} className="text-primary" />
                <span>Active Browser & CLI Sessions</span>
              </div>
              <GlassButton
                variant="danger"
                size="sm"
                icon="logout"
                onClick={revokeAllOtherSessions}
              >
                Revoke All Others
              </GlassButton>
            </div>

            <div className="flex flex-col gap-2.5">
              {profile.sessions.map((sess) => (
                <div
                  key={sess.sessionId}
                  className="p-3 rounded-xl bg-surface-container-lowest/60 border border-outline-variant/30 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      name={sess.device.includes('Terminal') ? 'terminal' : 'laptop_mac'}
                      size={20}
                      className={sess.isCurrent ? 'text-primary' : 'text-outline'}
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 font-medium text-on-surface">
                        <span>{sess.device}</span>
                        {sess.isCurrent && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Current
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-outline">
                        {sess.browser} • {sess.ipAddress} • {sess.lastActive}
                      </span>
                    </div>
                  </div>

                  {!sess.isCurrent && (
                    <button
                      type="button"
                      onClick={() => revokeSession(sess.sessionId)}
                      className="p-1 text-outline hover:text-error transition-colors"
                      title="Revoke session"
                    >
                      <Icon name="close" size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
