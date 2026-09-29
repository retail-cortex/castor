import React, { createContext, useContext, useMemo, useState } from 'react';
import { AppRole, HitlTier, SecurityPermissions, SecurityAuditEvent } from '../types/security';
import { useAuth } from './AuthContext';

interface SecurityContextValue {
  currentRole: AppRole;
  permissions: SecurityPermissions;
  setEffectiveRole: (role: AppRole) => void;
  canExecuteTier: (tier: HitlTier) => boolean;
  auditEvents: SecurityAuditEvent[];
  logAuditEvent: (eventType: SecurityAuditEvent['eventType'], details: string) => void;
}

const SecurityContext = createContext<SecurityContextValue | null>(null);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userClaims } = useAuth();
  const [currentRole, setEffectiveRole] = useState<AppRole>('OWNER');
  const [auditEvents, setAuditEvents] = useState<SecurityAuditEvent[]>([
    {
      id: 'aud_01',
      timestamp: '2026-09-05T20:30:00Z',
      eventType: 'LOGIN',
      actorEmail: userClaims?.email || 'ryan@retailcortex.com',
      details: 'OAuth 2.0 PKCE authentication succeeded from corporate IdP.',
      workspaceUrn: 'urn:castor:app:retailcortex.com:prod',
    },
  ]);

  const permissions = useMemo<SecurityPermissions>(() => {
    switch (currentRole) {
      case 'OWNER':
        return {
          canViewSkills: true,
          canEditSkill: true,
          canPublishSkill: true,
          canDeleteSkill: true,
          canManageMembers: true,
          canManageApiKeys: true,
          canVerifyDns: true,
          canApproveTier3: true,
        };
      case 'EDITOR':
        return {
          canViewSkills: true,
          canEditSkill: true,
          canPublishSkill: true,
          canDeleteSkill: false,
          canManageMembers: false,
          canManageApiKeys: true,
          canVerifyDns: false,
          canApproveTier3: false,
        };
      case 'VIEWER':
      default:
        return {
          canViewSkills: true,
          canEditSkill: false,
          canPublishSkill: false,
          canDeleteSkill: false,
          canManageMembers: false,
          canManageApiKeys: false,
          canVerifyDns: false,
          canApproveTier3: false,
        };
    }
  }, [currentRole]);

  const canExecuteTier = (tier: HitlTier): boolean => {
    if (tier === 'TIER_1_AUTO_READ') return true;
    if (tier === 'TIER_2_AUDITED_WRITE') return permissions.canEditSkill;
    if (tier === 'TIER_3_MANDATORY_APPROVAL') return permissions.canApproveTier3;
    return false;
  };

  const logAuditEvent = (eventType: SecurityAuditEvent['eventType'], details: string) => {
    const newEvent: SecurityAuditEvent = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString(),
      eventType,
      actorEmail: userClaims?.email || 'unknown@retailcortex.com',
      details,
      workspaceUrn: 'urn:castor:app:retailcortex.com:prod',
    };
    setAuditEvents((prev) => [newEvent, ...prev]);
  };

  return (
    <SecurityContext.Provider
      value={{
        currentRole,
        permissions,
        setEffectiveRole,
        canExecuteTier,
        auditEvents,
        logAuditEvent,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = (): SecurityContextValue => {
  const ctx = useContext(SecurityContext);
  if (!ctx) throw new Error('useSecurity must be used within a SecurityProvider');
  return ctx;
};
