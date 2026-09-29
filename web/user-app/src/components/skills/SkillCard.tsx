import React from 'react';
import { Icon } from '../common/Icon';
import { GlassCard } from '../common/GlassCard';
import { StatusBadge } from '../common/StatusBadge';
import { SkillItem } from '../../types/skill';
import { useToast } from '../../contexts/ToastContext';

interface SkillCardProps {
  skill: SkillItem;
  onSelect: (skillId: string) => void;
}

export const SkillCard: React.FC<SkillCardProps> = ({ skill, onSelect }) => {
  const { showToast } = useToast();

  const handleCopyUri = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(skill.uri);
    showToast({
      type: 'info',
      title: 'URI Copied',
      message: skill.uri,
    });
  };

  return (
    <GlassCard
      elevation={1}
      hoverEffect
      onClick={() => onSelect(skill.id)}
      className="cursor-pointer flex flex-col justify-between gap-3 group"
    >
      <div className="flex flex-col gap-2">
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider bg-surface-container-high border border-outline-variant/40 text-on-surface">
              {skill.category}
            </span>
            <span className="text-[11px] font-mono text-outline">v{skill.latestVersion}</span>
          </div>
          <StatusBadge type="hitl" value={skill.hitlTier} />
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="text-base font-heading font-bold text-on-surface group-hover:text-primary transition-colors flex items-center gap-1.5">
            <span>{skill.name}</span>
          </h3>
          <p className="text-xs text-on-surface-variant line-clamp-2 mt-1 leading-relaxed">
            {skill.description}
          </p>
        </div>

        {/* Canonical URI */}
        <div className="flex items-center justify-between p-1.5 rounded-md bg-surface-container-lowest/60 border border-outline-variant/30 text-[10px] font-mono text-outline">
          <span className="truncate max-w-[280px] select-all">{skill.uri}</span>
          <button
            type="button"
            onClick={handleCopyUri}
            className="p-1 hover:text-primary transition-colors"
            title="Copy Castor URI"
          >
            <Icon name="content_copy" size={14} />
          </button>
        </div>
      </div>

      {/* Footer Tags & Metadata */}
      <div className="flex items-center justify-between border-t border-outline-variant/20 pt-2.5 mt-1 text-[11px]">
        <div className="flex items-center gap-1.5 flex-wrap">
          {skill.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/[0.03] border border-outline-variant/30 text-on-surface-variant"
            >
              #{tag}
            </span>
          ))}
        </div>
        <span className="text-[10px] font-mono text-outline">
          {skill.author ? `@${skill.author.split(' ')[0].toLowerCase()}` : 'Castor'}
        </span>
      </div>
    </GlassCard>
  );
};
