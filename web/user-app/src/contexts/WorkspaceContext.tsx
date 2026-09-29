import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { RegisteredApp, AppMember, ScopedApiKey, CreateApiKeyResponse } from '../types/workspace';
import { AppRole } from '../types/security';
import { WorkspaceService } from '../services/workspaceService';
import { useAuth } from './AuthContext';
import { useSecurity } from './SecurityContext';
import { useToast } from './ToastContext';

interface WorkspaceContextValue {
  activeApp: RegisteredApp;
  allWorkspaces: RegisteredApp[];
  switchWorkspace: (appId: string) => void;
  members: AppMember[];
  isLoadingMembers: boolean;
  inviteMember: (email: string, role: AppRole) => Promise<AppMember>;
  updateMemberRole: (memberId: string, role: AppRole) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  apiKeys: ScopedApiKey[];
  isLoadingKeys: boolean;
  createApiKey: (name: string, role: AppRole, expiresInDays?: number) => Promise<CreateApiKeyResponse>;
  revokeApiKey: (keyId: string) => Promise<void>;
  verifyDnsChallenge: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const DEFAULT_WORKSPACES: RegisteredApp[] = [
  {
    appId: 'app_prod',
    appName: 'Retail Cortex Production',
    domain: 'retailcortex.com',
    appUrn: 'urn:castor:app:retailcortex.com:prod',
    email: 'admin@retailcortex.com',
    domainVerificationStatus: 'VERIFIED_SSO',
    dnsTxtChallenge: null,
    isActive: true,
    createdAt: '2026-08-01T00:00:00Z',
    verifiedAt: '2026-08-01T00:05:00Z',
  },
  {
    appId: 'app_adk',
    appName: 'Gemini ADK Labs',
    domain: 'retailcortex.com',
    appUrn: 'urn:castor:app:retailcortex.com:gemini-adk',
    email: 'adk-team@retailcortex.com',
    domainVerificationStatus: 'VERIFIED_SSO',
    dnsTxtChallenge: null,
    isActive: true,
    createdAt: '2026-08-20T00:00:00Z',
    verifiedAt: '2026-08-20T00:05:00Z',
  },
  {
    appId: 'app_sandbox',
    appName: 'AI Security Sandbox',
    domain: 'retailcortex.com',
    appUrn: 'urn:castor:app:retailcortex.com:sec-sandbox',
    email: 'sec-team@retailcortex.com',
    domainVerificationStatus: 'PENDING_DNS',
    dnsTxtChallenge: 'castor-domain-verify-8f921e03',
    isActive: true,
    createdAt: '2026-09-01T00:00:00Z',
    verifiedAt: null,
  },
];

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { setEffectiveRole, logAuditEvent } = useSecurity();
  const { showToast } = useToast();

  const [activeApp, setActiveApp] = useState<RegisteredApp>(DEFAULT_WORKSPACES[0]);
  const [allWorkspaces] = useState<RegisteredApp[]>(DEFAULT_WORKSPACES);
  const [members, setMembers] = useState<AppMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState<boolean>(false);
  const [apiKeys, setApiKeys] = useState<ScopedApiKey[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState<boolean>(false);

  const loadWorkspaceData = useCallback(async (appId: string) => {
    setIsLoadingMembers(true);
    setIsLoadingKeys(true);
    try {
      const [fetchedMembers, fetchedKeys] = await Promise.all([
        WorkspaceService.listMembers(appId),
        WorkspaceService.listApiKeys(appId),
      ]);
      setMembers(fetchedMembers);
      setApiKeys(fetchedKeys);
    } catch {
      // Fallback
    } finally {
      setIsLoadingMembers(false);
      setIsLoadingKeys(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadWorkspaceData(activeApp.appId);
    }
  }, [isAuthenticated, activeApp.appId, loadWorkspaceData]);

  const switchWorkspace = (appId: string) => {
    const target = allWorkspaces.find((w) => w.appId === appId);
    if (target) {
      setActiveApp(target);
      // Update effective role based on workspace target (simulated)
      if (appId === 'app_prod') setEffectiveRole('OWNER');
      else if (appId === 'app_adk') setEffectiveRole('EDITOR');
      else setEffectiveRole('VIEWER');

      showToast({
        type: 'info',
        title: 'Workspace Switched',
        message: `Now operating in ${target.appName}`,
      });
    }
  };

  const inviteMember = async (email: string, role: AppRole): Promise<AppMember> => {
    const member = await WorkspaceService.inviteMember(activeApp.appId, email, role);
    setMembers((prev) => [...prev, member]);
    logAuditEvent('MEMBER_INVITED', `Invited ${email} with role ${role}`);
    showToast({
      type: 'success',
      title: 'Invitation Sent',
      message: `Invited ${email} as ${role}`,
    });
    return member;
  };

  const updateMemberRole = async (memberId: string, role: AppRole) => {
    const updated = await WorkspaceService.updateMemberRole(memberId, role);
    setMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)));
    logAuditEvent('ROLE_CHANGED', `Updated member ${memberId} to role ${role}`);
    showToast({
      type: 'success',
      title: 'Role Updated',
      message: `Member role updated to ${role}`,
    });
  };

  const removeMember = async (memberId: string) => {
    await WorkspaceService.removeMember(memberId);
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    logAuditEvent('MEMBER_INVITED', `Revoked member ${memberId}`);
    showToast({
      type: 'info',
      title: 'Member Removed',
      message: 'Collaborator has been removed from this workspace.',
    });
  };

  const createApiKey = async (name: string, role: AppRole, expiresInDays?: number): Promise<CreateApiKeyResponse> => {
    const res = await WorkspaceService.createApiKey(activeApp.appId, name, role, expiresInDays);
    setApiKeys((prev) => [res.key, ...prev]);
    logAuditEvent('KEY_ISSUED', `Created API Key ${name} (${role})`);
    showToast({
      type: 'success',
      title: 'API Key Created',
      message: `Provisioned scoped key '${name}'`,
    });
    return res;
  };

  const revokeApiKey = async (keyId: string) => {
    await WorkspaceService.revokeApiKey(keyId);
    setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
    logAuditEvent('KEY_REVOKED', `Revoked API Key ${keyId}`);
    showToast({
      type: 'info',
      title: 'Key Revoked',
      message: 'API key has been revoked and can no longer authenticate.',
    });
  };

  const verifyDnsChallenge = async () => {
    const verified = await WorkspaceService.verifyDnsChallenge();
    setActiveApp(verified);
    showToast({
      type: 'success',
      title: 'DNS Verified',
      message: `Domain ${verified.domain} ownership verified successfully via TXT challenge!`,
    });
  };

  return (
    <WorkspaceContext.Provider
      value={{
        activeApp,
        allWorkspaces,
        switchWorkspace,
        members,
        isLoadingMembers,
        inviteMember,
        updateMemberRole,
        removeMember,
        apiKeys,
        isLoadingKeys,
        createApiKey,
        revokeApiKey,
        verifyDnsChallenge,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = (): WorkspaceContextValue => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within a WorkspaceProvider');
  return ctx;
};
