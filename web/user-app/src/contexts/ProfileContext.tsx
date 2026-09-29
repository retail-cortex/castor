import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserPreferences, UserActiveSession } from '../types/user';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface ProfileContextValue {
  profile: UserProfile | null;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  updatePreferredHandle: (handle: string) => void;
  revokeSession: (sessionId: string) => void;
  revokeAllOtherSessions: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userClaims, updateUserClaims } = useAuth();
  const { showToast } = useToast();

  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'obsidian',
    preferredHandle: userClaims?.preferred_username || '@ryan',
    editorKeymap: 'standard',
    codeFont: 'JetBrains Mono',
    defaultSearchScope: 'team',
    autoSaveDrafts: true,
  });

  const [sessions, setSessions] = useState<UserActiveSession[]>([
    {
      sessionId: 'sess_curr',
      device: 'MacBook Pro (Apple Silicon)',
      browser: 'Chrome 128 (macOS)',
      ipAddress: '192.0.2.45',
      lastActive: 'Active Now',
      isCurrent: true,
    },
    {
      sessionId: 'sess_cli',
      device: 'Developer Terminal (cstr CLI)',
      browser: 'cstr v1.0.0',
      ipAddress: '192.0.2.45',
      lastActive: '2 days ago',
      isCurrent: false,
    },
    {
      sessionId: 'sess_ci',
      device: 'GitHub Actions Runner (Linux)',
      browser: 'Bazel Build Agent',
      ipAddress: '198.51.100.12',
      lastActive: '5 hours ago',
      isCurrent: false,
    },
  ]);

  useEffect(() => {
    if (userClaims?.preferred_username) {
      setPreferences((prev) => ({ ...prev, preferredHandle: userClaims.preferred_username || '@user' }));
    }
  }, [userClaims?.preferred_username]);

  const updatePreferences = (newPrefs: Partial<UserPreferences>) => {
    setPreferences((prev) => {
      const updated = { ...prev, ...newPrefs };
      localStorage.setItem('castor_user_preferences', JSON.stringify(updated));
      return updated;
    });
    showToast({
      type: 'success',
      title: 'Preferences Saved',
      message: 'Your developer environment settings have been updated.',
    });
  };

  const updatePreferredHandle = (handle: string) => {
    const formatted = handle.startsWith('@') ? handle : `@${handle}`;
    setPreferences((prev) => ({ ...prev, preferredHandle: formatted }));
    updateUserClaims({ preferred_username: formatted });
    showToast({
      type: 'success',
      title: 'Handle Updated',
      message: `Your preferred display handle is now ${formatted}`,
    });
  };

  const revokeSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
    showToast({
      type: 'info',
      title: 'Session Revoked',
      message: 'The selected device session has been terminated.',
    });
  };

  const revokeAllOtherSessions = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    showToast({
      type: 'success',
      title: 'Sessions Terminated',
      message: 'All other remote sessions have been revoked successfully.',
    });
  };

  const profile: UserProfile | null = userClaims
    ? {
        claims: userClaims,
        displayName: userClaims.name || 'Ryan McGuinness',
        title: 'Lead AI Platform Architect',
        memberships: [
          {
            appId: 'app_prod',
            appName: 'Retail Cortex Production',
            appUrn: 'urn:castor:app:retailcortex.com:prod',
            domain: 'retailcortex.com',
            role: 'OWNER',
            joinedAt: '2026-08-15T10:00:00Z',
            isActive: true,
          },
          {
            appId: 'app_adk',
            appName: 'Gemini ADK Labs',
            appUrn: 'urn:castor:app:retailcortex.com:gemini-adk',
            domain: 'retailcortex.com',
            role: 'EDITOR',
            joinedAt: '2026-08-20T14:30:00Z',
            isActive: true,
          },
          {
            appId: 'app_sandbox',
            appName: 'AI Security Sandbox',
            appUrn: 'urn:castor:app:retailcortex.com:sec-sandbox',
            domain: 'retailcortex.com',
            role: 'VIEWER',
            joinedAt: '2026-09-01T09:00:00Z',
            isActive: true,
          },
        ],
        sessions,
        cliKeys: [
          {
            keyId: 'key_cli_1',
            name: 'cstr-local-developer-key',
            prefix: 'cstr_live_8f0a',
            role: 'OWNER',
            expiresAt: '2026-10-05T00:00:00Z',
            createdAt: '2026-09-01T12:00:00Z',
          },
        ],
        preferences,
      }
    : null;

  return (
    <ProfileContext.Provider
      value={{
        profile,
        updatePreferences,
        updatePreferredHandle,
        revokeSession,
        revokeAllOtherSessions,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = (): ProfileContextValue => {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within a ProfileProvider');
  return ctx;
};
