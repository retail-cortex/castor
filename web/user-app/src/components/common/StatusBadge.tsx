import React from 'react';
import { Icon } from './Icon';
import { HitlTier, AppRole } from '../../types/security';
import { DomainVerificationStatus } from '../../types/workspace';

interface StatusBadgeProps {
  type: 'hitl' | 'domain' | 'role' | 'sdlc';
  value: HitlTier | DomainVerificationStatus | AppRole | boolean | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value, className = '' }) => {
  if (type === 'hitl') {
    const tier = value as HitlTier;
    switch (tier) {
      case 'TIER_1_AUTO_READ':
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 ${className}`}
          >
            <Icon name="visibility" size={13} />
            <span>TIER 1 (READ)</span>
          </span>
        );
      case 'TIER_2_AUDITED_WRITE':
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-amber-500/10 border border-amber-500/30 text-amber-300 ${className}`}
          >
            <Icon name="edit_note" size={13} />
            <span>TIER 2 (WRITE)</span>
          </span>
        );
      case 'TIER_3_MANDATORY_APPROVAL':
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-rose-500/10 border border-rose-500/30 text-rose-300 font-semibold ${className}`}
          >
            <Icon name="shield" size={13} />
            <span>TIER 3 (APPROVAL)</span>
          </span>
        );
    }
  }

  if (type === 'domain') {
    const status = value as DomainVerificationStatus;
    switch (status) {
      case 'VERIFIED_SSO':
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 ${className}`}
          >
            <Icon name="verified" size={14} className="text-emerald-400" />
            <span>VERIFIED (SSO)</span>
          </span>
        );
      case 'VERIFIED_DNS':
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 ${className}`}
          >
            <Icon name="verified" size={14} className="text-emerald-400" />
            <span>VERIFIED (DNS)</span>
          </span>
        );
      case 'PENDING_DNS':
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-amber-500/15 border border-amber-500/30 text-amber-300 animate-pulse ${className}`}
          >
            <Icon name="warning" size={14} className="text-amber-400" />
            <span>PENDING DNS CHALLENGE</span>
          </span>
        );
      default:
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono bg-rose-500/15 border border-rose-500/30 text-rose-300 ${className}`}
          >
            <Icon name="cancel" size={14} />
            <span>UNVERIFIED</span>
          </span>
        );
    }
  }

  if (type === 'role') {
    const role = value as AppRole;
    switch (role) {
      case 'OWNER':
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-purple-500/15 border border-purple-500/30 text-purple-300 font-semibold ${className}`}
          >
            <Icon name="admin_panel_settings" size={13} />
            <span>OWNER</span>
          </span>
        );
      case 'EDITOR':
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 ${className}`}
          >
            <Icon name="edit" size={13} />
            <span>EDITOR</span>
          </span>
        );
      case 'VIEWER':
      default:
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-500/15 border border-slate-500/30 text-slate-300 ${className}`}
          >
            <Icon name="visibility" size={13} />
            <span>VIEWER</span>
          </span>
        );
    }
  }

  if (type === 'sdlc') {
    const passed = Boolean(value);
    return passed ? (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold ${className}`}
      >
        <Icon name="check_circle" size={14} className="text-emerald-400" />
        <span>SDLC 5/5 PASS</span>
      </span>
    ) : (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-rose-500/15 border border-rose-500/30 text-rose-300 font-semibold ${className}`}
      >
        <Icon name="error" size={14} className="text-rose-400" />
        <span>SDLC AUDIT FAILED</span>
      </span>
    );
  }

  return null;
};
