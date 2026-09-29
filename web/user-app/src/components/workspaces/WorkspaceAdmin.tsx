import React, { useState } from 'react';
import { Icon } from '../common/Icon';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { GlassInput } from '../common/GlassInput';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useSecurity } from '../../contexts/SecurityContext';
import { AppRole } from '../../types/security';

export const WorkspaceAdmin: React.FC = () => {
  const {
    activeApp,
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
  } = useWorkspace();
  const { permissions } = useSecurity();

  // Modals state
  const [inviteModalOpen, setInviteModalOpen] = useState<boolean>(false);
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<AppRole>('EDITOR');

  const [keyModalOpen, setKeyModalOpen] = useState<boolean>(false);
  const [keyName, setKeyName] = useState<string>('');
  const [keyRole, setKeyRole] = useState<AppRole>('EDITOR');
  const [keyDays, setKeyDays] = useState<number>(30);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    await inviteMember(inviteEmail.trim(), inviteRole);
    setInviteEmail('');
    setInviteModalOpen(false);
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;
    const res = await createApiKey(keyName.trim(), keyRole, keyDays);
    setCreatedSecret(res.apiKey);
    setKeyName('');
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-12">
      {/* Workspace Header & Domain Governance Card */}
      <GlassCard elevation={2}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <Icon name="corporate_fare" size={26} />
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold text-on-surface">{activeApp.appName}</h1>
              <div className="text-xs font-mono text-outline">{activeApp.appUrn}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge type="domain" value={activeApp.domainVerificationStatus} />
          </div>
        </div>

        {/* DNS Challenge Alert if Pending */}
        {activeApp.domainVerificationStatus === 'PENDING_DNS' && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Icon name="dns" size={20} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-semibold text-amber-300">DNS Ownership TXT Challenge Pending</div>
                <div className="text-on-surface-variant mt-0.5">
                  Set DNS TXT on <span className="font-mono text-amber-200">_castor-challenge.{activeApp.domain}</span>:
                </div>
                <code className="inline-block mt-1 font-mono text-[11px] bg-black/40 px-2 py-0.5 rounded text-amber-200 select-all">
                  {activeApp.dnsTxtChallenge || 'castor-domain-verify-8f921e03'}
                </code>
              </div>
            </div>
            <GlassButton
              variant="primary"
              size="sm"
              icon="sync"
              onClick={verifyDnsChallenge}
            >
              Verify TXT Record
            </GlassButton>
          </div>
        )}
      </GlassCard>

      {/* Collaborator Members Section */}
      <GlassCard elevation={1}>
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Icon name="group" size={20} className="text-primary" />
            <h2 className="text-base font-heading font-semibold text-on-surface">Team Collaborators</h2>
            <span className="text-xs font-mono text-outline ml-2">({members.length})</span>
          </div>

          {permissions.canManageMembers && (
            <GlassButton
              variant="primary"
              size="sm"
              icon="group_add"
              onClick={() => setInviteModalOpen(true)}
            >
              Invite Collaborator
            </GlassButton>
          )}
        </div>

        {isLoadingMembers ? (
          <div className="py-8 text-center text-xs text-outline flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Loading members...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/30 text-[11px] font-mono text-outline">
                  <th className="py-2.5 px-3">Collaborator</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3 flex items-center gap-2.5">
                      <img
                        src={m.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${m.email}`}
                        alt="Avatar"
                        className="w-7 h-7 rounded-full border border-primary/30 object-cover"
                      />
                      <span className="font-semibold text-on-surface">{m.name || m.email.split('@')[0]}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-outline">{m.email}</td>
                    <td className="py-3 px-3">
                      {permissions.canManageMembers ? (
                        <select
                          value={m.role}
                          onChange={(e) => updateMemberRole(m.id, e.target.value as AppRole)}
                          className="bg-surface-container/60 border border-outline-variant/40 rounded px-2 py-1 text-xs text-on-surface font-mono"
                        >
                          <option value="OWNER">OWNER</option>
                          <option value="EDITOR">EDITOR</option>
                          <option value="VIEWER">VIEWER</option>
                        </select>
                      ) : (
                        <StatusBadge type="role" value={m.role} />
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono ${
                          m.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {permissions.canManageMembers && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => removeMember(m.id)}
                            className="p-1 rounded text-outline hover:text-error hover:bg-error-container/20 transition-colors"
                            title="Remove collaborator"
                          >
                            <Icon name="person_remove" size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Scoped API Keys Section */}
      <GlassCard elevation={1}>
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Icon name="vpn_key" size={20} className="text-primary" />
            <h2 className="text-base font-heading font-semibold text-on-surface">Scoped API Credentials</h2>
            <span className="text-xs font-mono text-outline ml-2">({apiKeys.length})</span>
          </div>

          {permissions.canManageApiKeys && (
            <GlassButton
              variant="tonal"
              size="sm"
              icon="add"
              onClick={() => {
                setCreatedSecret(null);
                setKeyModalOpen(true);
              }}
            >
              Generate API Key
            </GlassButton>
          )}
        </div>

        {isLoadingKeys ? (
          <div className="py-8 text-center text-xs text-outline">Loading credentials...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/30 text-[11px] font-mono text-outline">
                  <th className="py-2.5 px-3">Key Name</th>
                  <th className="py-2.5 px-3">Prefix</th>
                  <th className="py-2.5 px-3">Scope</th>
                  <th className="py-2.5 px-3">Expires</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {apiKeys.map((k) => (
                  <tr key={k.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3 font-semibold text-on-surface">{k.name}</td>
                    <td className="py-3 px-3 font-mono text-primary text-xs">{k.prefix}***</td>
                    <td className="py-3 px-3">
                      <StatusBadge type="role" value={k.role} />
                    </td>
                    <td className="py-3 px-3 font-mono text-outline">
                      {k.expiresAt ? new Date(k.expiresAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {permissions.canManageApiKeys && (
                        <button
                          type="button"
                          onClick={() => revokeApiKey(k.id)}
                          className="px-2 py-1 rounded text-[11px] font-mono text-error hover:bg-error-container/20 border border-error/30 transition-colors"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Invite Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite Collaborator"
        subtitle={`Add a team member to ${activeApp.appName}`}
        icon="group_add"
      >
        <form onSubmit={handleInvite} className="flex flex-col gap-4">
          <GlassInput
            label="Corporate Email Address"
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="collaborator@retailcortex.com"
          />

          <div>
            <label className="text-xs font-medium text-on-surface-variant block mb-1">Assigned Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as AppRole)}
              className="w-full bg-surface-container/60 border border-outline-variant/40 rounded-md p-2.5 text-xs text-on-surface font-mono"
            >
              <option value="EDITOR">EDITOR (Author, test & register skills)</option>
              <option value="VIEWER">VIEWER (Read-only catalog & search)</option>
              <option value="OWNER">OWNER (Full administrative governance)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <GlassButton type="button" variant="outlined" size="sm" onClick={() => setInviteModalOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary" size="sm">
              Send Invitation
            </GlassButton>
          </div>
        </form>
      </Modal>

      {/* API Key Modal */}
      <Modal
        isOpen={keyModalOpen}
        onClose={() => setKeyModalOpen(false)}
        title={createdSecret ? 'API Key Provisioned' : 'Generate Scoped API Key'}
        subtitle={createdSecret ? 'Copy your secret now. It will not be shown again.' : 'For automated agents, CLI, and CI/CD pipelines'}
        icon="vpn_key"
      >
        {createdSecret ? (
          <div className="flex flex-col gap-4">
            <div className="p-3 rounded-xl bg-surface-container-lowest/80 border border-primary/40 text-xs flex flex-col gap-1.5">
              <span className="text-outline font-mono text-[10px]">Secret Key:</span>
              <code className="text-primary font-mono select-all break-all">{createdSecret}</code>
            </div>

            <div className="p-3 rounded-xl bg-surface-container/40 border border-outline-variant/30 text-xs">
              <span className="text-outline block mb-1 font-mono text-[11px]">Add to ~/.castor/.env.toml:</span>
              <pre className="p-2 rounded bg-black/50 text-[11px] font-mono text-on-surface select-all">
                {`CASTOR_SERVER_URL = "http://localhost:8080"\nCASTOR_API_KEY = "${createdSecret}"`}
              </pre>
            </div>

            <div className="flex justify-end">
              <GlassButton variant="primary" size="sm" onClick={() => setKeyModalOpen(false)}>
                Done
              </GlassButton>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateKey} className="flex flex-col gap-4">
            <GlassInput
              label="Key Description / Identifier"
              required
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="e.g. adk-prod-runner"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-on-surface-variant block mb-1">Scope</label>
                <select
                  value={keyRole}
                  onChange={(e) => setKeyRole(e.target.value as AppRole)}
                  className="w-full bg-surface-container/60 border border-outline-variant/40 rounded-md p-2 text-xs text-on-surface font-mono"
                >
                  <option value="EDITOR">EDITOR</option>
                  <option value="VIEWER">VIEWER</option>
                  {permissions.canManageMembers && <option value="OWNER">OWNER</option>}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-on-surface-variant block mb-1">Expiration</label>
                <select
                  value={keyDays}
                  onChange={(e) => setKeyDays(parseInt(e.target.value, 10))}
                  className="w-full bg-surface-container/60 border border-outline-variant/40 rounded-md p-2 text-xs text-on-surface font-mono"
                >
                  <option value={30}>30 Days</option>
                  <option value={60}>60 Days</option>
                  <option value={90}>90 Days</option>
                  <option value={365}>1 Year</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <GlassButton type="button" variant="outlined" size="sm" onClick={() => setKeyModalOpen(false)}>
                Cancel
              </GlassButton>
              <GlassButton type="submit" variant="primary" size="sm">
                Provision Key
              </GlassButton>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
