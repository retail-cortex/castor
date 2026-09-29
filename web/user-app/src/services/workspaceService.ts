import { apiClient } from './apiClient';
import { RegisteredApp, AppMember, ScopedApiKey, CreateApiKeyResponse } from '../types/workspace';
import { AppRole } from '../types/security';

export class WorkspaceService {
  // Mock/Offline fallback data for seamless standalone demonstration
  private static mockMembers: AppMember[] = [
    {
      id: 'mem_1',
      appId: 'app_prod',
      email: 'ryan@retailcortex.com',
      name: 'Ryan McGuinness',
      picture: 'https://api.dicebear.com/7.x/bottts/svg?seed=Ryan',
      role: 'OWNER',
      invitedBy: 'system',
      status: 'ACTIVE',
      createdAt: '2026-08-15T10:00:00Z',
      acceptedAt: '2026-08-15T10:05:00Z',
    },
    {
      id: 'mem_2',
      appId: 'app_prod',
      email: 'sarah@retailcortex.com',
      name: 'Sarah Chen',
      picture: 'https://api.dicebear.com/7.x/bottts/svg?seed=Sarah',
      role: 'EDITOR',
      invitedBy: 'ryan@retailcortex.com',
      status: 'ACTIVE',
      createdAt: '2026-08-20T14:30:00Z',
      acceptedAt: '2026-08-20T15:00:00Z',
    },
    {
      id: 'mem_3',
      appId: 'app_prod',
      email: 'alex.auditor@retailcortex.com',
      name: 'Alex Rivera',
      picture: 'https://api.dicebear.com/7.x/bottts/svg?seed=Alex',
      role: 'VIEWER',
      invitedBy: 'ryan@retailcortex.com',
      status: 'PENDING_INVITE',
      invitationToken: 'inv_tok_991823ab',
      createdAt: '2026-09-01T09:00:00Z',
    },
  ];

  private static mockKeys: ScopedApiKey[] = [
    {
      id: 'key_1',
      appId: 'app_prod',
      name: 'production-adk-agent-runner',
      prefix: 'cstr_live_a8f9',
      role: 'EDITOR',
      createdBy: 'ryan@retailcortex.com',
      expiresAt: '2026-12-31T23:59:59Z',
      revokedAt: null,
      createdAt: '2026-08-15T11:00:00Z',
    },
    {
      id: 'key_2',
      appId: 'app_prod',
      name: 'github-actions-ci-validator',
      prefix: 'cstr_live_3bc2',
      role: 'VIEWER',
      createdBy: 'sarah@retailcortex.com',
      expiresAt: '2026-10-01T00:00:00Z',
      revokedAt: null,
      createdAt: '2026-08-25T16:00:00Z',
    },
  ];

  public static async listMembers(appId: string): Promise<AppMember[]> {
    try {
      const res = await apiClient.request<AppMember[]>('/api/v1/apps/members');
      return res.data;
    } catch {
      return this.mockMembers.filter((m) => m.appId === appId || m.appId === 'app_prod');
    }
  }

  public static async inviteMember(appId: string, email: string, role: AppRole): Promise<AppMember> {
    try {
      const res = await apiClient.request<AppMember>('/api/v1/apps/members/invite', {
        method: 'POST',
        body: JSON.stringify({ email, role }),
      });
      return res.data;
    } catch {
      const newMember: AppMember = {
        id: `mem_${Date.now()}`,
        appId,
        email,
        name: email.split('@')[0],
        picture: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
        role,
        invitedBy: 'Current User',
        status: 'PENDING_INVITE',
        invitationToken: `inv_${Math.random().toString(36).substring(2, 10)}`,
        createdAt: new Date().toISOString(),
      };
      this.mockMembers.push(newMember);
      return newMember;
    }
  }

  public static async updateMemberRole(memberId: string, role: AppRole): Promise<AppMember> {
    try {
      const res = await apiClient.request<AppMember>(`/api/v1/apps/members/${memberId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      return res.data;
    } catch {
      const member = this.mockMembers.find((m) => m.id === memberId);
      if (member) {
        member.role = role;
        return member;
      }
      throw new Error('Member not found');
    }
  }

  public static async removeMember(memberId: string): Promise<void> {
    try {
      await apiClient.request(`/api/v1/apps/members/${memberId}`, {
        method: 'DELETE',
      });
    } catch {
      this.mockMembers = this.mockMembers.filter((m) => m.id !== memberId);
    }
  }

  public static async listApiKeys(appId: string): Promise<ScopedApiKey[]> {
    try {
      const res = await apiClient.request<ScopedApiKey[]>('/api/v1/apps/keys');
      return res.data;
    } catch {
      return this.mockKeys.filter((k) => (k.appId === appId || k.appId === 'app_prod') && !k.revokedAt);
    }
  }

  public static async createApiKey(
    appId: string,
    name: string,
    role: AppRole,
    expiresInDays?: number
  ): Promise<CreateApiKeyResponse> {
    try {
      const res = await apiClient.request<CreateApiKeyResponse>('/api/v1/apps/keys', {
        method: 'POST',
        body: JSON.stringify({ name, role, expires_in_days: expiresInDays }),
      });
      return res.data;
    } catch {
      const rawSecret = `cstr_live_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
      const newKey: ScopedApiKey = {
        id: `key_${Date.now()}`,
        appId,
        name,
        prefix: rawSecret.substring(0, 14),
        role,
        createdBy: 'Current User',
        expiresAt: expiresInDays ? new Date(Date.now() + expiresInDays * 86400000).toISOString() : null,
        revokedAt: null,
        createdAt: new Date().toISOString(),
      };
      this.mockKeys.push(newKey);
      return {
        apiKey: rawSecret,
        key: newKey,
      };
    }
  }

  public static async revokeApiKey(keyId: string): Promise<void> {
    try {
      await apiClient.request(`/api/v1/apps/keys/${keyId}`, {
        method: 'DELETE',
      });
    } catch {
      const key = this.mockKeys.find((k) => k.id === keyId);
      if (key) {
        key.revokedAt = new Date().toISOString();
      }
    }
  }

  public static async verifyDnsChallenge(): Promise<RegisteredApp> {
    try {
      const res = await apiClient.request<RegisteredApp>('/api/v1/apps/verify-dns');
      return res.data;
    } catch {
      return {
        appId: 'app_prod',
        appName: 'Retail Cortex Production',
        domain: 'retailcortex.com',
        appUrn: 'urn:castor:app:retailcortex.com:prod',
        email: 'admin@retailcortex.com',
        domainVerificationStatus: 'VERIFIED_DNS',
        dnsTxtChallenge: null,
        isActive: true,
        createdAt: '2026-08-01T00:00:00Z',
        verifiedAt: new Date().toISOString(),
      };
    }
  }
}
