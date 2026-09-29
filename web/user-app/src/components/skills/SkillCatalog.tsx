import React from 'react';
import { Icon } from '../common/Icon';
import { SkillCard } from './SkillCard';
import { FilterChip } from '../common/FilterChip';
import { PaginationBar } from './PaginationBar';
import { useSkillCatalog } from '../../contexts/SkillCatalogContext';
import { HitlTier } from '../../types/security';

interface SkillCatalogProps {
  onSelectSkill: (skillId: string) => void;
  onCreateWithAi: () => void;
  onCreateManual: () => void;
}

export const SkillCatalog: React.FC<SkillCatalogProps> = ({
  onSelectSkill,
  onCreateWithAi,
  onCreateManual,
}) => {
  const {
    skills,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedTier,
    setSelectedTier,
    selectedScope,
    setSelectedScope,
    pagination,
    setPage,
    setPageSize,
  } = useSkillCatalog();

  const categories = ['python', 'database', 'devops'];
  const hitlTiers: { id: HitlTier; label: string; icon: string }[] = [
    { id: 'TIER_1_AUTO_READ', label: 'Tier 1 (Read)', icon: 'visibility' },
    { id: 'TIER_2_AUDITED_WRITE', label: 'Tier 2 (Write)', icon: 'edit_note' },
    { id: 'TIER_3_MANDATORY_APPROVAL', label: 'Tier 3 (Approval)', icon: 'shield' },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-12">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-on-surface tracking-tight flex items-center gap-2.5">
            <Icon name="extension" size={26} className="text-primary" />
            <span>Skills Registry Catalog</span>
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Discover, inspect, and evaluate enterprise AI agent skills accelerated by multi-modal pgvector HNSW search.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onCreateManual}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-on-surface flex items-center gap-1.5 transition-all"
          >
            <Icon name="edit_note" size={16} />
            <span>Manual Studio</span>
          </button>

          <button
            type="button"
            onClick={onCreateWithAi}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 flex items-center gap-1.5 transition-all"
          >
            <Icon name="auto_awesome" size={16} />
            <span>New Skill with AI</span>
          </button>
        </div>
      </div>

      {/* Search Omnibar & Filter Chips Row */}
      <div className="glass-panel p-4 rounded-xl flex flex-col gap-3.5 border border-outline-variant/30">
        {/* Search Input */}
        <div className="relative flex items-center">
          <Icon name="search" size={20} className="absolute left-3.5 text-primary pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search skills semantically (e.g. 'Query sales from BigQuery', 'Kubernetes canary rollout')..."
            className="w-full bg-surface-container-lowest/60 border border-outline-variant/40 rounded-xl pl-11 pr-4 py-2.5 text-sm text-on-surface placeholder-outline focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-sans"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 text-outline hover:text-on-surface"
            >
              <Icon name="close" size={16} />
            </button>
          )}
        </div>

        {/* Filter Chips Toolbar */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-outline-variant/20">
          <span className="text-[11px] font-mono text-outline mr-1">Scope:</span>
          <FilterChip
            label="All Enterprise"
            selected={selectedScope === 'all'}
            onClick={() => setSelectedScope('all')}
          />
          <FilterChip
            label="Active Workspace"
            selected={selectedScope === 'team'}
            onClick={() => setSelectedScope('team')}
          />

          <div className="h-4 w-[1px] bg-outline-variant/40 mx-1 hidden sm:block" />

          <span className="text-[11px] font-mono text-outline mr-1">Category:</span>
          <FilterChip
            label="All Categories"
            selected={selectedCategory === null}
            onClick={() => setSelectedCategory(null)}
          />
          {categories.map((cat) => (
            <FilterChip
              key={cat}
              label={cat.toUpperCase()}
              selected={selectedCategory === cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            />
          ))}

          <div className="h-4 w-[1px] bg-outline-variant/40 mx-1 hidden sm:block" />

          <span className="text-[11px] font-mono text-outline mr-1">HITL Tier:</span>
          {hitlTiers.map((tier) => (
            <FilterChip
              key={tier.id}
              label={tier.label}
              icon={tier.icon}
              selected={selectedTier === tier.id}
              onClick={() => setSelectedTier(selectedTier === tier.id ? null : tier.id)}
            />
          ))}
        </div>
      </div>

      {/* Skills Card Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-outline flex flex-col items-center justify-center gap-3">
          <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Searching skills across vector index...</span>
        </div>
      ) : skills.length === 0 ? (
        <div className="py-16 text-center glass-panel rounded-2xl p-8 border border-outline-variant/30 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-outline">
            <Icon name="search_off" size={26} />
          </div>
          <h3 className="text-base font-heading font-semibold text-on-surface">No Skills Found</h3>
          <p className="text-xs text-outline max-w-sm">
            No registered skills matched your query and filters. Try adjusting search terms or generate a new skill using the AI Architect.
          </p>
          <button
            type="button"
            onClick={onCreateWithAi}
            className="mt-2 px-4 py-2 rounded-lg text-xs font-semibold bg-primary-container text-on-primary-container hover:bg-primary transition-all flex items-center gap-1.5"
          >
            <Icon name="auto_awesome" size={16} />
            <span>Generate with AI Copilot</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {skills.map((skill) => (
            <SkillCard key={skill.id} skill={skill} onSelect={onSelectSkill} />
          ))}
        </div>
      )}

      {/* Bounded Pagination Controls */}
      {skills.length > 0 && (
        <PaginationBar
          pagination={pagination}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
};
