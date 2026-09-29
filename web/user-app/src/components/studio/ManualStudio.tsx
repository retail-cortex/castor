import React, { useState } from 'react';
import { Icon } from '../common/Icon';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { GlassInput } from '../common/GlassInput';
import { StatusBadge } from '../common/StatusBadge';
import { useSkillEdit } from '../../contexts/SkillEditContext';
import { useSecurity } from '../../contexts/SecurityContext';
import { HitlTier } from '../../types/security';

interface ManualStudioProps {
  onBackToCatalog: () => void;
  onSkillPublished: (skillId: string) => void;
}

export const ManualStudio: React.FC<ManualStudioProps> = ({ onBackToCatalog, onSkillPublished }) => {
  const {
    draft,
    updateDraftField,
    syncFromYamlInstructions,
    addAsset,
    removeAsset,
    sdlcAudit,
    isPublishing,
    publishSkill,
    resetDraft,
  } = useSkillEdit();
  const { permissions } = useSecurity();

  const [activeTab, setActiveTab] = useState<'editor' | 'assets' | 'preview'>('editor');
  const [newAssetPath, setNewAssetPath] = useState<string>('');
  const [newAssetContent, setNewAssetContent] = useState<string>('');
  const [newAssetCategory, setNewAssetCategory] = useState<'reference' | 'example'>('reference');
  const [showAssetModal, setShowAssetModal] = useState<boolean>(false);

  const handlePublish = async () => {
    try {
      const skill = await publishSkill();
      onSkillPublished(skill.id);
    } catch {
      // Error handled by ToastContext
    }
  };

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetPath.trim()) return;

    let path = newAssetPath.trim();
    if (newAssetCategory === 'reference' && !path.startsWith('references/')) {
      path = `references/${path}`;
    } else if (newAssetCategory === 'example' && !path.startsWith('examples/')) {
      path = `examples/${path}`;
    }

    addAsset({
      path,
      name: path.split('/').pop() || path,
      category: newAssetCategory,
      content: newAssetContent,
      sizeBytes: newAssetContent.length,
    });

    setNewAssetPath('');
    setNewAssetContent('');
    setShowAssetModal(false);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-16">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToCatalog}
            className="p-2 rounded-lg border border-outline-variant/40 hover:bg-white/[0.05] text-outline hover:text-on-surface transition-colors"
          >
            <Icon name="arrow_back" size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant/40 text-primary">
                Authoring Studio
              </span>
              <StatusBadge type="sdlc" value={sdlcAudit.passed} />
            </div>
            <h1 className="text-xl font-heading font-bold text-on-surface mt-1">
              Editing: {draft.name} (v{draft.version})
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <GlassButton variant="outlined" size="sm" onClick={resetDraft}>
            Reset Draft
          </GlassButton>
          <GlassButton
            variant="primary"
            size="sm"
            icon="cloud_upload"
            isLoading={isPublishing}
            disabled={!sdlcAudit.passed || !permissions.canPublishSkill}
            onClick={handlePublish}
          >
            Publish to Registry
          </GlassButton>
        </div>
      </div>

      {/* Editor Grid: Left Form Metadata + Right Code & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Two-Way Form Metadata */}
        <div className="flex flex-col gap-4">
          <GlassCard elevation={1} className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-on-surface border-b border-outline-variant/30 pb-2">
              <Icon name="tune" size={18} className="text-primary" />
              <span>Metadata & Frontmatter</span>
            </div>

            <GlassInput
              label="Skill Name (kebab-case)"
              value={draft.name}
              onChange={(e) => updateDraftField('name', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-on-surface-variant block mb-1">Category</label>
                <select
                  value={draft.category}
                  onChange={(e) => updateDraftField('category', e.target.value)}
                  className="w-full bg-surface-container/60 border border-outline-variant/40 rounded-md p-2 text-xs text-on-surface font-mono"
                >
                  <option value="python">Python</option>
                  <option value="database">Database</option>
                  <option value="devops">DevOps</option>
                  <option value="frontend">Frontend</option>
                  <option value="security">Security</option>
                </select>
              </div>

              <GlassInput
                label="Version"
                value={draft.version}
                onChange={(e) => updateDraftField('version', e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-on-surface-variant block mb-1">HITL Security Tier</label>
              <select
                value={draft.hitlTier}
                onChange={(e) => updateDraftField('hitlTier', e.target.value as HitlTier)}
                className="w-full bg-surface-container/60 border border-outline-variant/40 rounded-md p-2 text-xs text-on-surface font-mono"
              >
                <option value="TIER_1_AUTO_READ">Tier 1: Auto-Read (Low Risk)</option>
                <option value="TIER_2_AUDITED_WRITE">Tier 2: Audited Write (Medium Risk)</option>
                <option value="TIER_3_MANDATORY_APPROVAL">Tier 3: Mandatory Human Approval (High Risk)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-on-surface-variant">Description</label>
              <textarea
                value={draft.description}
                onChange={(e) => updateDraftField('description', e.target.value)}
                rows={3}
                className="w-full bg-surface-container-lowest/60 border border-outline-variant/40 rounded-md p-2.5 text-xs text-on-surface placeholder-outline focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <GlassInput
                label="License (SPDX)"
                value={draft.license}
                onChange={(e) => updateDraftField('license', e.target.value)}
              />
              <GlassInput
                label="Author"
                value={draft.author}
                onChange={(e) => updateDraftField('author', e.target.value)}
              />
            </div>
          </GlassCard>

          {/* Staged L3 Assets Widget */}
          <GlassCard elevation={1} className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-on-surface">
                <Icon name="folder_open" size={16} className="text-primary" />
                <span>Staged L3 Assets ({draft.assets.length})</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAssetModal(true)}
                className="text-[11px] font-mono text-primary hover:underline flex items-center gap-1"
              >
                <Icon name="add" size={14} />
                <span>Add File</span>
              </button>
            </div>

            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
              {draft.assets.map((asset) => (
                <div
                  key={asset.path}
                  className="flex items-center justify-between p-2 rounded-md bg-surface-container-lowest/70 border border-outline-variant/20 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Icon name={asset.category === 'reference' ? 'menu_book' : 'code'} size={15} className="text-outline" />
                    <span className="font-mono text-[11px] text-on-surface truncate">{asset.path}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAsset(asset.path)}
                    className="text-outline hover:text-error transition-colors"
                  >
                    <Icon name="close" size={14} />
                  </button>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Split Monaco Markdown Editor & Tabs */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <GlassCard elevation={2} className="flex flex-col flex-1 p-0 overflow-hidden">
            {/* View Switcher Tabs */}
            <div className="flex items-center justify-between px-4 py-2 bg-surface-container-high/60 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('editor')}
                  className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeTab === 'editor' ? 'bg-primary-container/30 text-primary border border-primary/30' : 'text-outline hover:text-on-surface'
                  }`}
                >
                  <Icon name="code" size={15} />
                  <span>Instructions Editor (SKILL.md)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeTab === 'preview' ? 'bg-primary-container/30 text-primary border border-primary/30' : 'text-outline hover:text-on-surface'
                  }`}
                >
                  <Icon name="visibility" size={15} />
                  <span>Preview</span>
                </button>
              </div>

              <span className="text-[11px] font-mono text-outline">
                {draft.instructions.length} chars
              </span>
            </div>

            {/* Editor Area */}
            {activeTab === 'editor' ? (
              <textarea
                value={draft.instructions}
                onChange={(e) => syncFromYamlInstructions(e.target.value)}
                className="w-full h-[520px] p-4 bg-surface-container-lowest/90 font-mono text-xs text-on-surface leading-relaxed border-none focus:outline-none resize-none"
                placeholder="Enter markdown instructions..."
                spellCheck={false}
              />
            ) : (
              <div className="p-6 h-[520px] overflow-y-auto bg-surface-container-lowest/50 text-xs text-on-surface">
                <pre className="whitespace-pre-wrap font-sans leading-relaxed">{draft.instructions}</pre>
              </div>
            )}
          </GlassCard>

          {/* 5-Point SDLC Quality Invariant Linter Bar */}
          <div className="glass-panel p-3.5 rounded-xl border border-outline-variant/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Icon name="verified_user" size={18} className={sdlcAudit.passed ? 'text-emerald-400' : 'text-amber-400'} />
              <span className="font-semibold text-on-surface">5-Point SDLC Invariant Audit:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border ${
                  sdlcAudit.frontmatterCheck ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                }`}
              >
                <Icon name={sdlcAudit.frontmatterCheck ? 'check' : 'cancel'} size={12} />
                <span>Frontmatter</span>
              </span>

              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border ${
                  sdlcAudit.l3TreeCheck ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                }`}
              >
                <Icon name={sdlcAudit.l3TreeCheck ? 'check' : 'cancel'} size={12} />
                <span>L3 Tree</span>
              </span>

              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border ${
                  sdlcAudit.cweSecurityCheck ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                }`}
              >
                <Icon name={sdlcAudit.cweSecurityCheck ? 'check' : 'cancel'} size={12} />
                <span>CWE Guards</span>
              </span>

              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border ${
                  sdlcAudit.rateLimit429Check ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                }`}
              >
                <Icon name={sdlcAudit.rateLimit429Check ? 'check' : 'cancel'} size={12} />
                <span>429 Backoff</span>
              </span>

              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border ${
                  sdlcAudit.clickableLinksCheck ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                }`}
              >
                <Icon name={sdlcAudit.clickableLinksCheck ? 'check' : 'cancel'} size={12} />
                <span>Links</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Asset Modal */}
      {showAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-dim/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel-overlay rounded-xl p-5 border border-outline-variant/50 flex flex-col gap-4">
            <h3 className="text-sm font-heading font-bold text-on-surface">Stage New L3 Asset</h3>
            <form onSubmit={handleAddAsset} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-outline block mb-1">Asset Category</label>
                <select
                  value={newAssetCategory}
                  onChange={(e) => setNewAssetCategory(e.target.value as 'reference' | 'example')}
                  className="w-full bg-surface-container/60 border border-outline-variant/40 rounded p-2 text-xs text-on-surface font-mono"
                >
                  <option value="reference">Reference Documentation (references/*.md)</option>
                  <option value="example">Executable Code Sample (examples/*)</option>
                </select>
              </div>

              <GlassInput
                label="File Name / Relative Path"
                required
                value={newAssetPath}
                onChange={(e) => setNewAssetPath(e.target.value)}
                placeholder={newAssetCategory === 'reference' ? 'api_reference.md' : 'sample_runner.py'}
              />

              <div className="flex flex-col gap-1">
                <label className="text-xs text-outline">Content Buffer</label>
                <textarea
                  value={newAssetContent}
                  onChange={(e) => setNewAssetContent(e.target.value)}
                  rows={4}
                  className="w-full bg-surface-container-lowest/60 border border-outline-variant/40 rounded p-2 text-xs font-mono text-on-surface"
                  placeholder="// Enter code or markdown..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <GlassButton type="button" variant="outlined" size="sm" onClick={() => setShowAssetModal(false)}>
                  Cancel
                </GlassButton>
                <GlassButton type="submit" variant="primary" size="sm">
                  Stage Asset
                </GlassButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
