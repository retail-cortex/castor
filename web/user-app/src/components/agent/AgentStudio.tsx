import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '../common/Icon';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { StatusBadge } from '../common/StatusBadge';
import { useAgentArchitect } from '../../contexts/AgentContext';
import { useSkillEdit } from '../../contexts/SkillEditContext';
import { useSecurity } from '../../contexts/SecurityContext';

interface AgentStudioProps {
  onBackToCatalog: () => void;
  onSkillPublished: (skillId: string) => void;
}

export const AgentStudio: React.FC<AgentStudioProps> = ({ onBackToCatalog, onSkillPublished }) => {
  const {
    messages,
    isStreaming,
    currentToolCall,
    streamingContent,
    sendMessage,
    clearChat,
    simulationResult,
    isSimulating,
    runScenarioSimulation,
  } = useAgentArchitect();

  const { draft, sdlcAudit, isPublishing, publishSkill } = useSkillEdit();
  const { permissions } = useSecurity();

  const [promptInput, setPromptInput] = useState<string>('');
  const [activeArtifactTab, setActiveArtifactTab] = useState<'instructions' | 'tools' | 'assets' | 'scenarios' | 'diff'>('instructions');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent, currentToolCall]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim() || isStreaming) return;
    const prompt = promptInput.trim();
    setPromptInput('');
    await sendMessage(prompt);
  };

  const handlePublish = async () => {
    try {
      const skill = await publishSkill();
      onSkillPublished(skill.id);
    } catch {
      // Error handled by ToastContext
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto w-full h-[calc(100vh-100px)] pb-2">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-outline-variant/30 pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToCatalog}
            className="p-1.5 rounded-lg border border-outline-variant/40 hover:bg-white/[0.05] text-outline hover:text-on-surface transition-colors"
          >
            <Icon name="arrow_back" size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase px-2 py-0.2 rounded bg-gradient-to-r from-primary/20 to-tertiary/20 border border-primary/30 text-primary font-bold">
                AI Skill Architect
              </span>
              <StatusBadge type="sdlc" value={sdlcAudit.passed} />
            </div>
            <h1 className="text-lg font-heading font-bold text-on-surface mt-0.5">
              Draft: {draft.name} (v{draft.version})
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GlassButton variant="outlined" size="sm" onClick={clearChat}>
            Reset Chat
          </GlassButton>
          <GlassButton
            variant="primary"
            size="sm"
            icon="cloud_upload"
            isLoading={isPublishing}
            disabled={!sdlcAudit.passed || !permissions.canPublishSkill}
            onClick={handlePublish}
          >
            Accept & Publish
          </GlassButton>
        </div>
      </div>

      {/* Two-Column Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0 overflow-hidden">
        {/* Left Column: Conversational Chat (5/12) */}
        <GlassCard elevation={2} className="lg:col-span-5 flex flex-col p-0 overflow-hidden h-full">
          {/* Chat Header */}
          <div className="px-4 py-2.5 bg-surface-container-high/60 border-b border-outline-variant/30 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-on-surface">
              <Icon name="auto_awesome" size={16} className="text-primary" />
              <span>Skill Architect Copilot (MCP SSE Active)</span>
            </div>
            {isStreaming && (
              <span className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-300 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span>Synthesizing...</span>
              </span>
            )}
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3.5 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col gap-1.5 ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-outline">
                  <Icon name={msg.role === 'user' ? 'account_circle' : 'smart_toy'} size={14} />
                  <span>{msg.role === 'user' ? 'You' : 'Castor Agent'}</span>
                  <span>•</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div
                  className={`p-3.5 rounded-2xl max-w-[90%] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary-container/30 text-cyan-100 border border-primary/40 rounded-br-none'
                      : 'bg-surface-container/70 text-on-surface border border-outline-variant/30 rounded-bl-none shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap font-sans">{msg.content}</p>
                </div>

                {/* Display tool calls if any */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="flex flex-col gap-1 w-full max-w-[90%] mt-1">
                    {msg.toolCalls.map((tc) => (
                      <div
                        key={tc.id}
                        className="p-2 rounded-lg bg-black/40 border border-primary/20 text-[11px] font-mono flex items-center justify-between text-primary"
                      >
                        <div className="flex items-center gap-1.5">
                          <Icon name="play_arrow" size={13} />
                          <span>Tool: {tc.name}</span>
                        </div>
                        <span className="text-emerald-400 text-[10px]">COMPLETED</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Live Streaming Token Bubble */}
            {isStreaming && streamingContent && (
              <div className="flex flex-col items-start gap-1.5 animate-in fade-in">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-outline">
                  <Icon name="smart_toy" size={14} className="text-primary animate-pulse" />
                  <span>Castor Agent (Streaming)</span>
                </div>
                <div className="p-3.5 rounded-2xl max-w-[90%] bg-surface-container/80 text-on-surface border border-primary/30 rounded-bl-none">
                  <p className="whitespace-pre-wrap font-sans leading-relaxed">{streamingContent}</p>
                </div>
              </div>
            )}

            {/* Tool Call Pending Banner */}
            {currentToolCall && (
              <div className="p-2.5 rounded-xl bg-primary-container/20 border border-primary/40 text-xs font-mono text-primary flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-2">
                  <Icon name="sync" size={16} className="animate-spin" />
                  <span>Invoking MCP tool: {currentToolCall.name}...</span>
                </div>
                <span className="text-[10px] uppercase text-outline">Registry query</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Input Form */}
          <form onSubmit={handleSend} className="p-3 bg-surface-container-high/40 border-t border-outline-variant/30 flex gap-2 shrink-0">
            <input
              type="text"
              value={promptInput}
              disabled={isStreaming}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="e.g. 'Build a BigQuery daily sales forecaster with Tier 2 write clearance'..."
              className="flex-1 bg-surface-container-lowest/80 border border-outline-variant/40 rounded-xl px-3.5 py-2 text-xs text-on-surface placeholder-outline focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
            <button
              type="submit"
              disabled={!promptInput.trim() || isStreaming}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-semibold text-xs flex items-center justify-center shadow-md disabled:opacity-40 transition-all active:scale-95"
            >
              <Icon name="send" size={16} />
            </button>
          </form>
        </GlassCard>

        {/* Right Column: Live Synthesized Artifact & Diffs (7/12) */}
        <GlassCard elevation={2} className="lg:col-span-7 flex flex-col p-0 overflow-hidden h-full">
          {/* Artifact Tabs Header */}
          <div className="px-4 py-2 bg-surface-container-high/60 border-b border-outline-variant/30 flex items-center justify-between shrink-0 overflow-x-auto">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveArtifactTab('instructions')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeArtifactTab === 'instructions'
                    ? 'bg-primary-container/30 text-primary border border-primary/30'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                <Icon name="description" size={15} />
                <span>SKILL.md</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveArtifactTab('tools')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeArtifactTab === 'tools'
                    ? 'bg-primary-container/30 text-primary border border-primary/30'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                <Icon name="data_object" size={15} />
                <span>Tools ({draft.tools.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveArtifactTab('assets')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeArtifactTab === 'assets'
                    ? 'bg-primary-container/30 text-primary border border-primary/30'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                <Icon name="folder_open" size={15} />
                <span>Assets ({draft.assets.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveArtifactTab('scenarios')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeArtifactTab === 'scenarios'
                    ? 'bg-primary-container/30 text-primary border border-primary/30'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                <Icon name="science" size={15} />
                <span>Scenarios</span>
              </button>
            </div>

            <StatusBadge type="hitl" value={draft.hitlTier} />
          </div>

          {/* Tab Content Container */}
          <div className="flex-1 p-4 overflow-y-auto text-xs font-mono">
            {/* 1. SKILL.md */}
            {activeArtifactTab === 'instructions' && (
              <pre className="p-4 rounded-xl bg-surface-container-lowest/80 text-on-surface overflow-x-auto whitespace-pre-wrap leading-relaxed border border-outline-variant/30 h-full">
                {draft.instructions}
              </pre>
            )}

            {/* 2. Tools & JSON Schemas */}
            {activeArtifactTab === 'tools' && (
              <div className="flex flex-col gap-4">
                {draft.tools.map((tool) => (
                  <div key={tool.name} className="p-3.5 rounded-xl bg-surface-container-lowest/70 border border-outline-variant/30 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-bold text-primary text-sm">{tool.name}</span>
                      <span className="text-[10px] text-outline font-mono">JSON Schema</span>
                    </div>
                    <p className="text-xs text-on-surface-variant font-sans">{tool.description}</p>
                    <pre className="p-2.5 rounded bg-black/50 text-[11px] text-cyan-200 overflow-x-auto">
                      {JSON.stringify(tool.parameters, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}

            {/* 3. Assets */}
            {activeArtifactTab === 'assets' && (
              <div className="flex flex-col gap-3">
                {draft.assets.map((asset) => (
                  <div key={asset.path} className="p-3 rounded-xl bg-surface-container-lowest/70 border border-outline-variant/30 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary">{asset.path}</span>
                      <span className="text-[10px] text-outline">{asset.sizeBytes} bytes</span>
                    </div>
                    <pre className="p-2 rounded bg-black/50 text-[11px] text-on-surface-variant overflow-x-auto">
                      {asset.content}
                    </pre>
                  </div>
                ))}
              </div>
            )}

            {/* 4. Behavioral Scenarios & Simulation */}
            {activeArtifactTab === 'scenarios' && (
              <div className="flex flex-col gap-4">
                {draft.scenarios.map((sc) => (
                  <div key={sc.name} className="p-4 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/40 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon name="science" size={18} className="text-primary" />
                        <span className="font-heading font-bold text-on-surface">{sc.name}</span>
                      </div>
                      <GlassButton
                        variant="primary"
                        size="sm"
                        icon="play_arrow"
                        isLoading={isSimulating}
                        onClick={() => runScenarioSimulation(sc)}
                      >
                        Simulate Scenario
                      </GlassButton>
                    </div>

                    <div className="text-xs flex flex-col gap-1 font-sans">
                      <span className="text-outline font-mono text-[10px]">Scenario Prompt:</span>
                      <div className="p-2 rounded bg-surface-container/50 border border-outline-variant/30 text-on-surface">
                        "{sc.prompt}"
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div>
                        <span className="text-outline">Required Tools: </span>
                        <span className="text-primary">{sc.expectedSkills.join(', ')}</span>
                      </div>
                      <div>
                        <span className="text-outline">Pass Threshold: </span>
                        <span className="text-amber-300">{(sc.threshold * 100).toFixed(0)}%</span>
                      </div>
                    </div>

                    {simulationResult && (
                      <div className="p-3 rounded-xl bg-primary-container/20 border border-primary/40 text-xs flex flex-col gap-1.5 font-sans animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-primary flex items-center gap-1">
                            <Icon name={simulationResult.passed ? 'check_circle' : 'cancel'} size={15} />
                            <span>Simulation Outcome: {simulationResult.passed ? 'PASSED' : 'FAILED'}</span>
                          </span>
                          <span className="font-mono text-[11px] text-cyan-300 font-bold">
                            Cosine Similarity: {(simulationResult.similarityScore * 100).toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface font-mono">{simulationResult.simulatedOutput}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Live SDLC Quality Bar */}
          <div className="p-3 bg-surface-container-high/60 border-t border-outline-variant/30 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2">
              <Icon name="verified_user" size={16} className={sdlcAudit.passed ? 'text-emerald-400' : 'text-amber-400'} />
              <span className="font-semibold text-on-surface text-[11px]">5-Point SDLC Audit:</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${sdlcAudit.frontmatterCheck ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/15 border-rose-500/30 text-rose-300'}`}>
                Frontmatter
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${sdlcAudit.l3TreeCheck ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/15 border-rose-500/30 text-rose-300'}`}>
                L3 Tree
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${sdlcAudit.cweSecurityCheck ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/15 border-rose-500/30 text-rose-300'}`}>
                CWE Guards
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${sdlcAudit.rateLimit429Check ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/15 border-rose-500/30 text-rose-300'}`}>
                429 Backoff
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${sdlcAudit.clickableLinksCheck ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/15 border-rose-500/30 text-rose-300'}`}>
                Links
              </span>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
