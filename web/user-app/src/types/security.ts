export type AppRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export type HitlTier = 
  | 'TIER_1_AUTO_READ'
  | 'TIER_2_AUDITED_WRITE'
  | 'TIER_3_MANDATORY_APPROVAL';

export interface SecurityPermissions {
  canViewSkills: boolean;
  canEditSkill: boolean;
  canPublishSkill: boolean;
  canDeleteSkill: boolean;
  canManageMembers: boolean;
  canManageApiKeys: boolean;
  canVerifyDns: boolean;
  canApproveTier3: boolean;
}

export interface SecurityAuditEvent {
  id: string;
  timestamp: string;
  eventType: 'LOGIN' | 'KEY_ISSUED' | 'KEY_REVOKED' | 'MEMBER_INVITED' | 'ROLE_CHANGED' | 'SKILL_PUBLISHED' | 'TIER3_APPROVAL';
  actorEmail: string;
  details: string;
  workspaceUrn: string;
}
