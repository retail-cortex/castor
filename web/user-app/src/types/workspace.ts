import { AppRole } from './security';

export type DomainVerificationStatus = 
  | 'VERIFIED_SSO'
  | 'VERIFIED_DNS'
  | 'PENDING_DNS'
  | 'REJECTED';

export interface RegisteredApp {
  appId: string;
  appName: string;
  domain: string;
  appUrn: string;
  email: string;
  domainVerificationStatus: DomainVerificationStatus;
  dnsTxtChallenge: string | null;
  isActive: boolean;
  createdAt: string;
  verifiedAt: string | null;
}

export interface AppMember {
  id: string;
  appId: string;
  email: string;
  name?: string;
  picture?: string;
  role: AppRole;
  invitedBy: string;
  status: 'ACTIVE' | 'PENDING_INVITE' | 'REVOKED';
  invitationToken?: string;
  createdAt: string;
  acceptedAt?: string | null;
}

export interface ScopedApiKey {
  id: string;
  appId: string;
  name: string;
  prefix: string;
  role: AppRole;
  createdBy: string;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export interface CreateApiKeyResponse {
  apiKey: string; // The one-time raw secret
  key: ScopedApiKey;
}
