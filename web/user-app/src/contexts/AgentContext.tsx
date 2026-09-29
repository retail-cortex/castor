import React, { createContext, useContext, useState, useCallback } from 'react';
import { ChatMessage, McpToolCall, ScenarioSimulationResult } from '../types/agent';
import { SkillBehavioralScenario } from '../types/skill';
import { McpAgentService } from '../services/mcpAgentService';
import { useSkillEdit } from './SkillEditContext';
import { useToast } from './ToastContext';

interface AgentContextValue {
  messages: ChatMessage[];
  isStreaming: boolean;
  currentToolCall: McpToolCall | null;
  streamingContent: string;
  sendMessage: (prompt: string) => Promise<void>;
  clearChat: () => void;
  simulationResult: ScenarioSimulationResult | null;
  isSimulating: boolean;
  runScenarioSimulation: (scenario: SkillBehavioralScenario) => Promise<void>;
}

const AgentContext = createContext<AgentContextValue | null>(null);

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_welcome',
    role: 'assistant',
    content: `Hello! I am your **Castor Skill Architect Copilot**.\n\nDescribe the autonomous skill or tool you want to create (e.g. *"Create a BigQuery daily sales forecaster"*, *"Build a Kubernetes canary rollout agent"*, or *"Generate a Stripe webhook validator"*). I will query existing catalog tools via MCP, assemble compliant instructions, parameters, L3 assets, and behavioral scenarios for you to review and publish.`,
    timestamp: '2026-09-05T20:00:00Z',
  },
];

export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { updateDraftField } = useSkillEdit();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [currentToolCall, setCurrentToolCall] = useState<McpToolCall | null>(null);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [simulationResult, setSimulationResult] = useState<ScenarioSimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const sendMessage = useCallback(
    async (prompt: string) => {
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'user',
        content: prompt,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);
      setStreamingContent('');
      setCurrentToolCall(null);

      try {
        const { message, draft: synthesizedDraft } = await McpAgentService.sendPrompt(
          prompt,
          messages,
          (chunk) => {
            setStreamingContent(chunk);
          },
          (toolCall) => {
            setCurrentToolCall(toolCall);
          }
        );

        setMessages((prev) => [...prev, message]);
        setStreamingContent('');
        setCurrentToolCall(null);

        // Update the active draft in SkillEditContext
        updateDraftField('name', synthesizedDraft.name);
        updateDraftField('category', synthesizedDraft.category);
        updateDraftField('version', synthesizedDraft.version);
        updateDraftField('description', synthesizedDraft.description);
        updateDraftField('instructions', synthesizedDraft.instructions);
        updateDraftField('hitlTier', synthesizedDraft.hitlTier);
        updateDraftField('tags', synthesizedDraft.tags);
        updateDraftField('triggerPhrases', synthesizedDraft.triggerPhrases);
        updateDraftField('tools', synthesizedDraft.tools);
        updateDraftField('assets', synthesizedDraft.assets);
        updateDraftField('scenarios', synthesizedDraft.scenarios);

        showToast({
          type: 'success',
          title: 'Skill Synthesized',
          message: `Generated '${synthesizedDraft.name}' with tools & scenarios ready for review.`,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        showToast({
          type: 'error',
          title: 'Agent Error',
          message: msg,
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, updateDraftField, showToast]
  );

  const runScenarioSimulation = useCallback(
    async (scenario: SkillBehavioralScenario) => {
      setIsSimulating(true);
      try {
        const result = await McpAgentService.simulateScenario(scenario);
        setSimulationResult(result);
        showToast({
          type: result.passed ? 'success' : 'warning',
          title: result.passed ? 'Scenario Passed (92%)' : 'Scenario Failed',
          message: `Cosine similarity score: ${(result.similarityScore * 100).toFixed(0)}% (Threshold: ${(result.threshold * 100).toFixed(0)}%)`,
        });
      } finally {
        setIsSimulating(false);
      }
    },
    [showToast]
  );

  const clearChat = useCallback(() => {
    setMessages(INITIAL_MESSAGES);
    setStreamingContent('');
    setCurrentToolCall(null);
    setSimulationResult(null);
  }, []);

  return (
    <AgentContext.Provider
      value={{
        messages,
        isStreaming,
        currentToolCall,
        streamingContent,
        sendMessage,
        clearChat,
        simulationResult,
        isSimulating,
        runScenarioSimulation,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
};

export const useAgentArchitect = (): AgentContextValue => {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error('useAgentArchitect must be used within an AgentProvider');
  return ctx;
};
