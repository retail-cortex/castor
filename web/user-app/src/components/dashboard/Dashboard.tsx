import React from 'react';
import { Icon } from '../common/Icon';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { StatusBadge } from '../common/StatusBadge';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useSkillCatalog } from '../../contexts/SkillCatalogContext';
import { useSecurity } from '../../contexts/SecurityContext';
import { useProfile } from '../../contexts/ProfileContext';

interface DashboardProps {
  onNavigate: (view: string, skillId?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { activeApp, members, apiKeys } = useWorkspace();
  const { skills } = useSkillCatalog();
  const { auditEvents, currentRole } = useSecurity();
  const { profile } = useProfile();

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-16">
      {/* Welcome Banner */}
      <div className="glass-panel-elevated p-6 rounded-2xl border border-primary/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex flex-col gap-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-primary font-semibold tracking-wide uppercase">
              Operational Workspace
            </span>
            <span className="text-outline text-xs">•</span>
            <StatusBadge type="role" value={currentRole} />
          </div>
          <h1 className="text-2xl font-heading font-bold text-on-surface tracking-tight">
            Welcome back, {profile?.displayName || 'Ryan'}
          </h1>
          <p className="text-xs text-on-surface-variant max-w-xl">
            You are operating in <span className="font-semibold text-primary">{activeApp.appName}</span> (
            <code className="font-mono text-outline text-[11px]">{activeApp.appUrn}</code>). All tool registrations,
            vector embeddings, and collaborator access are scoped to this domain.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 shrink-0">
          <GlassButton
            variant="tonal"
            size="sm"
            icon="edit_note"
            onClick={() => onNavigate('manual')}
          >
            Manual Studio
          </GlassButton>
          <GlassButton
            variant="fab"
            size="md"
            icon="auto_awesome"
            onClick={() => onNavigate('agent')}
          >
            New Skill with AI
          </GlassButton>
        </div>

        {/* Ambient Underlay Glow */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard elevation={1} className="flex flex-col gap-1 p-4">
          <div className="flex items-center justify-between text-outline">
            <span className="text-xs font-medium">Registered Skills</span>
            <Icon name="extension" size={18} className="text-primary" />
          </div>
          <span className="text-2xl font-heading font-bold text-on-surface font-tnum mt-1">
            {skills.length}
          </span>
          <span className="text-[11px] text-outline">pgvector HNSW Indexed</span>
        </GlassCard>

        <GlassCard elevation={1} className="flex flex-col gap-1 p-4">
          <div className="flex items-center justify-between text-outline">
            <span className="text-xs font-medium">Active Collaborators</span>
            <Icon name="group" size={18} className="text-primary" />
          </div>
          <span className="text-2xl font-heading font-bold text-on-surface font-tnum mt-1">
            {members.length}
          </span>
          <span className="text-[11px] text-outline">RBAC Governed</span>
        </GlassCard>

        <GlassCard elevation={1} className="flex flex-col gap-1 p-4">
          <div className="flex items-center justify-between text-outline">
            <span className="text-xs font-medium">Scoped API Keys</span>
            <Icon name="vpn_key" size={18} className="text-primary" />
          </div>
          <span className="text-2xl font-heading font-bold text-on-surface font-tnum mt-1">
            {apiKeys.length}
          </span>
          <span className="text-[11px] text-outline">Automated Agents & CI</span>
        </GlassCard>

        <GlassCard elevation={1} className="flex flex-col gap-1 p-4">
          <div className="flex items-center justify-between text-outline">
            <span className="text-xs font-medium">Domain Security</span>
            <Icon name="verified" size={18} className="text-emerald-400" />
          </div>
          <div className="mt-1.5">
            <StatusBadge type="domain" value={activeApp.domainVerificationStatus} />
          </div>
          <span className="text-[11px] font-mono text-outline truncate">{activeApp.domain}</span>
        </GlassCard>
      </div>

      {/* Main Sections: Recent Skills + Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Skills (2/3) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <GlassCard elevation={1}>
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Icon name="history" size={20} className="text-primary" />
                <h2 className="text-base font-heading font-semibold text-on-surface">Registered Skills Catalog</h2>
              </div>
              <GlassButton variant="tonal" size="sm" onClick={() => onNavigate('skills')}>
                View Full Catalog
              </GlassButton>
            </div>

            <div className="flex flex-col gap-3">
              {skills.slice(0, 4).map((skill) => (
                <div
                  key={skill.id}
                  onClick={() => onNavigate('skill-detail', skill.id)}
                  className="p-3.5 rounded-xl bg-surface-container/50 hover:bg-surface-container-high/80 border border-outline-variant/30 hover:border-primary/40 cursor-pointer flex items-center justify-between gap-4 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                      <Icon name="terminal" size={20} />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-on-surface group-hover:text-primary transition-colors">
                          {skill.name}
                        </span>
                        <span className="text-xs font-mono text-outline">v{skill.latestVersion}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant line-clamp-1 mt-0.5">{skill.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge type="hitl" value={skill.hitlTier} />
                    <Icon name="arrow_forward" size={16} className="text-outline group-hover:text-primary transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Security Telemetry & Audit Stream (1/3) */}
        <div className="flex flex-col gap-4">
          <GlassCard elevation={1}>
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Icon name="security" size={18} className="text-primary" />
                <h2 className="text-sm font-heading font-semibold text-on-surface">Security & Governance Audit</h2>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">LIVE</span>
            </div>

            <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
              {auditEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 rounded-xl bg-surface-container-lowest/60 border border-outline-variant/30 flex flex-col gap-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-primary-container/30 text-cyan-200 border border-primary/30">
                      {evt.eventType}
                    </span>
                    <span className="text-[10px] text-outline font-mono">
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface font-sans mt-0.5 leading-relaxed">{evt.details}</p>
                  <span className="text-[10px] font-mono text-outline mt-1 truncate">Actor: {evt.actorEmail}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
