import { OIDCClaims } from './auth';
import { AppRole } from './security';

export interface UserWorkspaceMembership {
  appId: string;
  appName: string;
  appUrn: string;
  domain: string;
  role: AppRole;
  joinedAt: string;
  isActive: boolean;
}

export interface UserActiveSession {
  sessionId: string;
  device: string;
  browser: string;
  ipAddress: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface UserCliKey {
  keyId: string;
  name: string;
  prefix: string;
  role: AppRole;
  expiresAt: string | null;
  createdAt: string;
}

export type ThemeAppearance = 'obsidian' | 'oled' | 'cyberpunk';
export type EditorKeymap = 'standard' | 'vim';

export interface UserPreferences {
  theme: ThemeAppearance;
  preferredHandle: string;
  editorKeymap: EditorKeymap;
  codeFont: string;
  defaultSearchScope: 'team' | 'global';
  autoSaveDrafts: boolean;
}

export interface UserProfile {
  claims: OIDCClaims;
  displayName: string;
  title: string;
  memberships: UserWorkspaceMembership[];
  sessions: UserActiveSession[];
  cliKeys: UserCliKey[];
  preferences: UserPreferences;
}
