import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from '../common/Icon';
import { useSkillCatalog } from '../../contexts/SkillCatalogContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string, detailId?: string) => void;
}

interface CommandItem {
  id: string;
  label: string;
  subtitle?: string;
  category: string;
  icon: string;
  view?: string;
  detailId?: string;
  action?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate }) => {
  const { skills, setSearchQuery } = useSkillCatalog();
  const { allWorkspaces, switchWorkspace } = useWorkspace();
  const [query, setQuery] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const items: CommandItem[] = useMemo(() => {
    const q = query.toLowerCase().trim();
    const actionItems: CommandItem[] = [
      { id: 'act_ai', label: 'Create Skill with AI Architect Copilot', category: 'Actions', icon: 'auto_awesome', view: 'agent' },
      { id: 'act_manual', label: 'Open Manual Skill Authoring Studio', category: 'Actions', icon: 'edit_note', view: 'manual' },
      { id: 'act_workspaces', label: 'Manage Team Members & API Keys', category: 'Actions', icon: 'group', view: 'workspaces' },
      { id: 'act_profile', label: 'View Profile & OIDC Identity Claims', category: 'Actions', icon: 'account_circle', view: 'profile' },
    ];

    const matchedSkills = skills
      .filter((s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.tags.some((t) => t.toLowerCase().includes(q)))
      .slice(0, 5)
      .map((s) => ({
        id: `skill_${s.id}`,
        label: s.name,
        subtitle: s.description,
        category: 'Skills Catalog',
        icon: 'extension',
        view: 'skill-detail',
        detailId: s.id,
      }));

    const matchedWorkspaces = allWorkspaces
      .filter((w) => w.appName.toLowerCase().includes(q) || w.domain.toLowerCase().includes(q))
      .map((w) => ({
        id: `ws_${w.appId}`,
        label: `Switch to ${w.appName}`,
        subtitle: w.domain,
        category: 'Workspaces',
        icon: 'corporate_fare',
        action: () => switchWorkspace(w.appId),
      }));

    if (!q) {
      return [...actionItems, ...matchedSkills];
    }

    return [
      ...matchedSkills,
      ...actionItems.filter((a) => a.label.toLowerCase().includes(q)),
      ...matchedWorkspaces,
    ];
  }, [query, skills, allWorkspaces, switchWorkspace]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  const handleSelect = (item: (typeof items)[0]) => {
    if (item.action) {
      item.action();
    } else if (item.view) {
      onNavigate(item.view, item.detailId);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 sm:p-6 overflow-y-auto">
      <div className="fixed inset-0 bg-surface-dim/80 backdrop-blur-md transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-xl glass-panel-overlay rounded-2xl border border-primary/40 shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150 flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-outline-variant/30">
          <Icon name="search" size={20} className="text-primary" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchQuery(e.target.value);
            }}
            placeholder="Type a command or search skills..."
            className="flex-1 bg-transparent border-none text-sm text-on-surface placeholder-outline focus:outline-none"
          />
          <kbd className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-container-high text-outline">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 flex flex-col gap-1">
          {items.length === 0 ? (
            <div className="py-8 text-center text-xs text-outline">
              No matching skills, commands, or workspaces found.
            </div>
          ) : (
            items.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs transition-colors ${
                  selectedIndex === idx
                    ? 'bg-primary-container/25 text-primary border border-primary/30'
                    : 'text-on-surface hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center ${
                      selectedIndex === idx ? 'bg-primary/20 text-primary' : 'bg-surface-container text-outline'
                    }`}
                  >
                    <Icon name={item.icon} size={16} />
                  </div>
                  <div>
                    <div className="font-medium text-on-surface">{item.label}</div>
                    {'subtitle' in item && item.subtitle && (
                      <div className="text-[10px] text-outline truncate max-w-sm">{item.subtitle}</div>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-mono text-outline uppercase">{item.category}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
