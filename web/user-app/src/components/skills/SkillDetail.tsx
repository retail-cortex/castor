import React, { useState } from 'react';
import { Icon } from '../common/Icon';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { StatusBadge } from '../common/StatusBadge';
import { useSkillDetail } from '../../hooks/useSkillDetail';
import { useToast } from '../../contexts/ToastContext';

interface SkillDetailProps {
  skillId: string;
  onBack: () => void;
  onEditManual: () => void;
}

type TabType = 'instructions' | 'tools' | 'assets' | 'scenarios' | 'versions' | 'snippets';

export const SkillDetail: React.FC<SkillDetailProps> = ({ skillId, onBack, onEditManual }) => {
  const { skill, isLoading, error } = useSkillDetail(skillId);
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('instructions');
  const [selectedAssetPath, setSelectedAssetPath] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="py-20 text-center text-xs text-outline flex flex-col items-center justify-center gap-2">
        <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span>Loading skill inspection record...</span>
      </div>
    );
  }

  if (error || !skill) {
    return (
      <div className="py-12 text-center text-xs text-error flex flex-col items-center gap-3">
        <Icon name="error" size={32} />
        <span>{error || 'Skill record could not be loaded.'}</span>
        <GlassButton variant="tonal" size="sm" onClick={onBack}>
          Return to Catalog
        </GlassButton>
      </div>
    );
  }

  const copyUri = () => {
    navigator.clipboard.writeText(skill.uri);
    showToast({
      type: 'info',
      title: 'Canonical URI Copied',
      message: skill.uri,
    });
  };

  const tabs: { id: TabType; label: string; icon: string; count?: number }[] = [
    { id: 'instructions', label: 'Instructions (SKILL.md)', icon: 'description' },
    { id: 'tools', label: 'Tools & Schemas', icon: 'data_object', count: skill.tools?.length },
    { id: 'assets', label: 'L3 Asset Explorer', icon: 'folder_open', count: skill.assets?.length },
    { id: 'scenarios', label: 'Behavioral Tests', icon: 'science', count: skill.scenarios?.length },
    { id: 'versions', label: 'Version History', icon: 'history', count: skill.versions?.length },
    { id: 'snippets', label: 'Integration Snippets', icon: 'terminal' },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-16">
      {/* Back and Title Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-lg border border-outline-variant/40 hover:bg-white/[0.05] text-outline hover:text-on-surface transition-colors"
          >
            <Icon name="arrow_back" size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant/40 text-primary">
                {skill.category}
              </span>
              <span className="text-xs font-mono text-outline">v{skill.latestVersion}</span>
              <StatusBadge type="hitl" value={skill.hitlTier} />
            </div>
            <h1 className="text-2xl font-heading font-bold text-on-surface mt-1">{skill.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GlassButton variant="primary" size="sm" icon="edit" onClick={onEditManual}>
            Edit in Studio
          </GlassButton>
        </div>
      </div>

      {/* Overview Card with Canonical URI */}
      <GlassCard elevation={2} className="flex flex-col gap-3">
        <p className="text-sm text-on-surface-variant leading-relaxed">{skill.description}</p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/30 text-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <Icon name="link" size={16} className="text-primary shrink-0" />
            <span className="text-outline font-mono text-[11px] shrink-0">URI:</span>
            <span className="font-mono text-primary truncate select-all">{skill.uri}</span>
          </div>
          <button
            type="button"
            onClick={copyUri}
            className="px-2.5 py-1 rounded bg-white/[0.05] hover:bg-white/[0.1] border border-outline-variant/40 text-on-surface text-[11px] font-mono flex items-center gap-1 shrink-0 transition-colors"
          >
            <Icon name="content_copy" size={13} />
            <span>Copy</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-outline pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            {skill.tags.map((t) => (
              <span key={t} className="px-2 py-0.5 rounded bg-surface-container text-[11px] font-mono text-on-surface-variant">
                #{t}
              </span>
            ))}
          </div>
          <div className="font-mono text-[11px]">
            SHA-256: <span className="text-on-surface">{skill.sha256Hash.substring(0, 12)}...</span>
          </div>
        </div>
      </GlassCard>

      {/* Tabs Header */}
      <div className="flex items-center gap-1 border-b border-outline-variant/30 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-outline hover:text-on-surface hover:bg-white/[0.02]'
            }`}
          >
            <Icon name={tab.icon} size={16} />
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-surface-container text-outline">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[350px]">
        {/* 1. Instructions */}
        {activeTab === 'instructions' && (
          <GlassCard elevation={1}>
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2.5 mb-4">
              <span className="font-mono text-xs text-outline">SKILL.md</span>
              <StatusBadge type="sdlc" value={skill.sdlcStatus?.passed || true} />
            </div>
            <pre className="p-4 rounded-xl bg-surface-container-lowest/80 text-xs font-mono text-on-surface overflow-x-auto whitespace-pre-wrap leading-relaxed border border-outline-variant/30">
              {skill.instructions}
            </pre>
          </GlassCard>
        )}

        {/* 2. Tools & Schemas */}
        {activeTab === 'tools' && (
          <div className="flex flex-col gap-4">
            {skill.tools && skill.tools.length > 0 ? (
              skill.tools.map((tool) => (
                <GlassCard key={tool.name} elevation={1} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon name="terminal" size={18} className="text-primary" />
                      <h3 className="font-heading font-bold text-sm text-on-surface">{tool.name}</h3>
                    </div>
                    <span className="text-[11px] font-mono text-outline">JSON Schema</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">{tool.description}</p>
                  <pre className="p-3 rounded-lg bg-surface-container-lowest/80 text-[11px] font-mono text-cyan-200 overflow-x-auto border border-outline-variant/30">
                    {JSON.stringify(tool.parameters, null, 2)}
                  </pre>
                </GlassCard>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-outline">No tools defined for this skill.</div>
            )}
          </div>
        )}

        {/* 3. L3 Progressive Asset Explorer */}
        {activeTab === 'assets' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* File Tree List */}
            <GlassCard elevation={1} className="flex flex-col gap-2 p-3">
              <span className="text-[11px] font-mono text-outline uppercase tracking-wider mb-1 px-2">
                Staged Assets
              </span>
              {skill.assets && skill.assets.length > 0 ? (
                skill.assets.map((asset) => (
                  <button
                    key={asset.path}
                    type="button"
                    onClick={() => setSelectedAssetPath(asset.path)}
                    className={`flex items-center gap-2.5 p-2 rounded-lg text-left text-xs transition-colors ${
                      (selectedAssetPath || skill.assets![0].path) === asset.path
                        ? 'bg-primary-container/30 border border-primary/40 text-primary font-semibold'
                        : 'hover:bg-white/[0.04] text-on-surface'
                    }`}
                  >
                    <Icon
                      name={asset.category === 'reference' ? 'menu_book' : 'code'}
                      size={16}
                      className="text-primary/70"
                    />
                    <div className="truncate">
                      <div className="truncate">{asset.name}</div>
                      <div className="text-[10px] font-mono text-outline">{asset.path}</div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-xs text-outline">No assets attached.</div>
              )}
            </GlassCard>

            {/* Content Preview */}
            <div className="md:col-span-2">
              <GlassCard elevation={1}>
                {(() => {
                  const currentAsset =
                    skill.assets?.find((a) => a.path === (selectedAssetPath || skill.assets![0]?.path)) ||
                    skill.assets?.[0];
                  if (!currentAsset) return <div className="p-4 text-xs text-outline">Select a file to inspect.</div>;

                  return (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
                        <span className="font-mono text-xs text-primary font-semibold">{currentAsset.path}</span>
                        <span className="text-[10px] font-mono text-outline">{currentAsset.sizeBytes} bytes</span>
                      </div>
                      <pre className="p-3 rounded-lg bg-surface-container-lowest/80 text-xs font-mono text-on-surface overflow-x-auto whitespace-pre-wrap border border-outline-variant/30">
                        {currentAsset.content || '// Content preview unavailable'}
                      </pre>
                    </div>
                  );
                })()}
              </GlassCard>
            </div>
          </div>
        )}

        {/* 4. Behavioral Scenarios */}
        {activeTab === 'scenarios' && (
          <div className="flex flex-col gap-4">
            {skill.scenarios && skill.scenarios.length > 0 ? (
              skill.scenarios.map((sc) => (
                <GlassCard key={sc.name} elevation={1} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
                    <div className="flex items-center gap-2">
                      <Icon name="science" size={18} className="text-primary" />
                      <span className="font-heading font-bold text-sm text-on-surface">{sc.name}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-primary/10 border border-primary/20 text-primary">
                      Pass Threshold: {(sc.threshold * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="text-xs flex flex-col gap-1.5">
                    <span className="text-outline font-mono text-[10px]">Test Prompt:</span>
                    <div className="p-2.5 rounded bg-surface-container-lowest/70 border border-outline-variant/30 font-sans text-on-surface">
                      "{sc.prompt}"
                    </div>
                  </div>

                  <div className="text-xs flex flex-col gap-1.5">
                    <span className="text-outline font-mono text-[10px]">Expected Tool Calls:</span>
                    <div className="flex gap-2">
                      {sc.expectedSkills.map((tool) => (
                        <span key={tool} className="px-2 py-0.5 rounded font-mono text-[11px] bg-primary/10 text-primary border border-primary/30">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-xs flex flex-col gap-1.5">
                    <span className="text-outline font-mono text-[10px]">Reference Outcome:</span>
                    <p className="p-2 rounded bg-surface-container-lowest/50 text-on-surface-variant font-mono text-[11px]">
                      {sc.referenceOutcome}
                    </p>
                  </div>
                </GlassCard>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-outline">No behavioral scenario tests attached.</div>
            )}
          </div>
        )}

        {/* 5. Version History */}
        {activeTab === 'versions' && (
          <GlassCard elevation={1}>
            <div className="flex flex-col gap-3">
              {skill.versions && skill.versions.length > 0 ? (
                skill.versions.map((ver) => (
                  <div
                    key={ver.id}
                    className="p-3 rounded-xl bg-surface-container-lowest/60 border border-outline-variant/30 flex items-center justify-between text-xs"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm font-heading text-on-surface">v{ver.version}</span>
                        {ver.version === skill.latestVersion && (
                          <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            Latest
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-outline mt-0.5">{ver.uri}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono text-outline block">
                        SHA-256: {ver.sha256Hash.substring(0, 16)}...
                      </span>
                      <span className="text-[10px] text-outline">{new Date(ver.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-xs text-outline">Single initial release.</div>
              )}
            </div>
          </GlassCard>
        )}

        {/* 6. Integration Snippets */}
        {activeTab === 'snippets' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlassCard elevation={1}>
              <h3 className="font-heading font-bold text-sm text-on-surface mb-1 flex items-center gap-2">
                <Icon name="terminal" size={18} className="text-primary" />
                <span>Castor Developer CLI (cstr)</span>
              </h3>
              <p className="text-xs text-outline mb-3">Install directly to your local .skills directory:</p>
              <pre className="p-3 rounded-lg bg-black/60 font-mono text-xs text-cyan-200 select-all border border-outline-variant/30">
                cstr add {skill.uri}
              </pre>
            </GlassCard>

            <GlassCard elevation={1}>
              <h3 className="font-heading font-bold text-sm text-on-surface mb-1 flex items-center gap-2">
                <Icon name="code" size={18} className="text-primary" />
                <span>Python ADK Client</span>
              </h3>
              <p className="text-xs text-outline mb-3">Dynamic pre-call JIT retrieval in Python 3.13:</p>
              <pre className="p-3 rounded-lg bg-black/60 font-mono text-xs text-cyan-200 select-all border border-outline-variant/30">
                {`from castor_client import SkillRegistry\nregistry = SkillRegistry()\nskill = registry.get("${skill.name}")`}
              </pre>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
};
