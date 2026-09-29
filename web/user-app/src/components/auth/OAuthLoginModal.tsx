import React, { useState } from 'react';
import { Icon } from '../common/Icon';
import { useAuth } from '../../contexts/AuthContext';
import { IdentityProviderType } from '../../types/auth';

export const OAuthLoginModal: React.FC = () => {
  const { loginWithProvider, isLoading, authError } = useAuth();
  const [customEmail, setCustomEmail] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const handleProviderLogin = async (provider: IdentityProviderType) => {
    try {
      const email = customEmail.trim() || 'ryan@retailcortex.com';
      const name = email.split('@')[0].replace('.', ' ');
      await loginWithProvider(provider, email, name);
    } catch {
      // Error handled by AuthContext
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-dim/95 backdrop-blur-3xl overflow-y-auto">
      {/* Background Ambient Radial Glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_60%_at_50%_30%,rgba(111,236,254,0.12),rgba(0,0,0,0))]" />

      <div className="relative w-full max-w-md glass-panel-overlay rounded-[28px] border border-outline-variant/60 shadow-2xl p-8 flex flex-col gap-6 text-center z-10 animate-in zoom-in-95 duration-200">
        {/* Logo Glyph */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-on-primary font-bold shadow-xl shadow-primary/30 border border-white/30 mb-2">
            <Icon name="bolt" size={32} />
          </div>
          <h1 className="text-2xl font-heading font-bold text-on-surface tracking-tight">
            CASTOR PLATFORM
          </h1>
          <p className="text-xs text-on-surface-variant max-w-xs">
            Enterprise AI Agent Skills Registry & Governance Hub
          </p>
        </div>

        {/* Security Warning Badge */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container-high/60 border border-outline-variant/40 text-xs text-on-surface-variant text-left">
          <Icon name="lock" size={18} className="text-primary shrink-0" />
          <span>OAuth 2.0 PKCE authentication is required to access this system.</span>
        </div>

        {authError && (
          <div className="p-3 rounded-xl bg-error-container/30 border border-error/40 text-xs text-error text-left flex items-start gap-2">
            <Icon name="error" size={16} className="shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        {/* SSO Provider Buttons */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleProviderLogin('google')}
            className="w-full h-11 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] active:scale-[0.98] border border-white/10 hover:border-primary/40 text-xs font-semibold text-on-surface flex items-center justify-center gap-3 transition-all duration-150 shadow-sm"
          >
            <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-slate-900 font-bold text-xs">
              G
            </span>
            <span>Continue with Google Workspace (SSO)</span>
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleProviderLogin('okta')}
            className="w-full h-11 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] active:scale-[0.98] border border-white/10 hover:border-primary/40 text-xs font-semibold text-on-surface flex items-center justify-center gap-3 transition-all duration-150 shadow-sm"
          >
            <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              O
            </span>
            <span>Continue with Okta Enterprise SSO</span>
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleProviderLogin('microsoft')}
            className="w-full h-11 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] active:scale-[0.98] border border-white/10 hover:border-primary/40 text-xs font-semibold text-on-surface flex items-center justify-center gap-3 transition-all duration-150 shadow-sm"
          >
            <span className="w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center text-white font-bold text-xs">
              M
            </span>
            <span>Continue with Microsoft Entra ID</span>
          </button>
        </div>

        {/* Corporate Domain Validation Notice */}
        <div className="text-[11px] text-outline text-left border-t border-outline-variant/30 pt-3">
          <div className="flex items-center gap-1.5 text-primary mb-1">
            <Icon name="verified" size={14} />
            <span className="font-semibold">Corporate Domain Verification Enforced</span>
          </div>
          <p className="leading-relaxed">
            Only authenticated accounts from verified corporate domains (e.g. <span className="font-mono text-on-surface">@retailcortex.com</span>) are permitted. Public freemail addresses are prohibited.
          </p>
        </div>

        {/* Developer Sandbox Controls */}
        <div className="pt-2 border-t border-outline-variant/20 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-[10px] font-mono text-outline hover:text-primary transition-colors flex items-center justify-center gap-1"
          >
            <span>Developer Sandbox Email Simulation</span>
            <Icon name={showAdvanced ? 'expand_less' : 'expand_more'} size={14} />
          </button>

          {showAdvanced && (
            <div className="flex flex-col gap-2 p-3 rounded-lg bg-surface-container-lowest/60 border border-outline-variant/30 text-left text-xs">
              <label className="text-[10px] font-mono text-outline">Simulate Corporate or Freemail Login:</label>
              <input
                type="email"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="ryan@retailcortex.com"
                className="w-full bg-surface-container/60 border border-outline-variant/40 rounded px-2.5 py-1.5 text-xs text-on-surface font-mono"
              />
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setCustomEmail('sarah@retailcortex.com')}
                  className="text-[10px] text-primary hover:underline font-mono"
                >
                  sarah@retailcortex.com (Editor)
                </button>
                <button
                  type="button"
                  onClick={() => setCustomEmail('test@gmail.com')}
                  className="text-[10px] text-error hover:underline font-mono"
                >
                  test@gmail.com (Freemail test)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
