import { SkillDraft, SkillBehavioralScenario } from './skill';

export type AgentRole = 'user' | 'assistant' | 'system' | 'tool';

export interface McpToolCall {
  id: string;
  name: string; // 'search_skills' | 'get_skill' | 'register_skill' | 'validate_sdlc'
  arguments: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: AgentRole;
  content: string;
  timestamp: string;
  toolCalls?: McpToolCall[];
  isStreaming?: boolean;
}

export interface ScenarioSimulationResult {
  scenarioName: string;
  passed: boolean;
  similarityScore: number;
  threshold: number;
  expectedSkillsInvoked: boolean;
  actualSkillsInvoked: string[];
  missingSkills: string[];
  simulatedOutput: string;
}

export interface AgentStudioSession {
  sessionId: string;
  messages: ChatMessage[];
  currentDraft: SkillDraft | null;
  generatedScenario: SkillBehavioralScenario | null;
  simulationResult: ScenarioSimulationResult | null;
  isStreaming: boolean;
}
