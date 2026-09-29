import { McpToolCall, ChatMessage, ScenarioSimulationResult } from '../types/agent';
import { SkillDraft, SkillBehavioralScenario } from '../types/skill';

export class McpAgentService {
  public static async sendPrompt(
    prompt: string,
    _history: ChatMessage[],
    onTokenChunk: (chunk: string) => void,
    onToolCall: (toolCall: McpToolCall) => void
  ): Promise<{ message: ChatMessage; draft: SkillDraft; scenario: SkillBehavioralScenario }> {
    // 1. Tool Call: search_skills
    const searchTool: McpToolCall = {
      id: `call_${Date.now()}_1`,
      name: 'search_skills',
      arguments: { query: prompt },
      status: 'running',
    };
    onToolCall(searchTool);

    await new Promise((r) => setTimeout(r, 450));
    searchTool.status = 'completed';
    searchTool.result = JSON.stringify([
      { name: 'bigquery-sales-forecaster', relevance: 0.76 },
      { name: 'python-adk-fastapi', relevance: 0.42 },
    ]);
    onToolCall({ ...searchTool });

    // 2. Synthesize Skill Structure
    const generatedName = prompt
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30) || 'custom-adk-skill';

    const draft: SkillDraft = {
      name: generatedName,
      category: prompt.toLowerCase().includes('sql') || prompt.toLowerCase().includes('data') ? 'database' : 'python',
      version: '1.0.0',
      description: `Autonomous agent skill engineered for: ${prompt}`,
      instructions: `# System Instructions: ${generatedName}\n\nYou are an autonomous agent specialized for: ${prompt}.\n\n## Capabilities\n* Real-time automated execution with schema validation.\n* Deterministic output guarantees.\n\n## HTTP 429 Rate Limit Resilience\nWhen receiving 429 Too Many Requests, back off exponentially with jitter: initial wait 1.5s, factor 2.0, max retries 5.\n\n## CWE Security Safeguards\nSanitize all inputs before execution to prevent CWE-78 (command injection) and CWE-89 (SQL injection).`,
      license: 'Apache-2.0',
      author: 'Castor AI Skill Architect',
      hitlTier: prompt.toLowerCase().includes('delete') || prompt.toLowerCase().includes('deploy')
        ? 'TIER_3_MANDATORY_APPROVAL'
        : 'TIER_2_AUDITED_WRITE',
      tags: ['autonomous-agent', 'castor-studio', 'adk'],
      triggerPhrases: [prompt.toLowerCase().substring(0, 40), `execute ${generatedName}`],
      tools: [
        {
          name: 'execute_task',
          description: `Performs execution for ${prompt}`,
          parameters: {
            type: 'object',
            properties: {
              target: { type: 'string', description: 'Target parameter' },
              dry_run: { type: 'boolean', description: 'Simulation mode' },
            },
            required: ['target'],
          },
        },
      ],
      assets: [
        {
          path: 'references/architecture.md',
          name: 'architecture.md',
          category: 'reference',
          content: `# Architecture Overview\n* Autonomous execution tree for ${generatedName}.`,
          sizeBytes: 640,
        },
        {
          path: 'examples/run.py',
          name: 'run.py',
          category: 'example',
          content: `from castor_client import SkillRegistry\nprint("Executing skill ${generatedName}")`,
          sizeBytes: 420,
        },
      ],
      scenarios: [
        {
          name: 'standard_execution_verification',
          path: 'scenarios/standard_verification.md',
          prompt: `Verify execution flow for ${prompt}`,
          executes: true,
          expectedSkills: ['execute_task'],
          threshold: 0.85,
          referenceOutcome: `Execution completes successfully with target validated and result payload returned.`,
        },
      ],
      isDirty: false,
    };

    const scenario = draft.scenarios[0];

    // 3. Stream conversational response tokens
    const responseText = `I have analyzed your request ("${prompt}") and synthesized a production-grade Castor skill package.\n\n**Generated Structure:**\n* **Skill Name**: \`${draft.name}\`\n* **HITL Security Tier**: \`${draft.hitlTier}\`\n* **Tools Defined**: \`execute_task\`\n* **Assets Generated**: \`references/architecture.md\`, \`examples/run.py\`\n* **Behavioral Verification**: \`scenarios/standard_verification.md\` (Threshold: 85%)\n\nYou can review the complete generated code, edit parameters, or run a behavioral dry-run simulation in the right-hand panel before publishing to your workspace.`;

    const tokens = responseText.split(' ');
    let accumulated = '';
    for (const token of tokens) {
      accumulated += (accumulated ? ' ' : '') + token;
      onTokenChunk(accumulated);
      await new Promise((r) => setTimeout(r, 20));
    }

    const assistantMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: responseText,
      timestamp: new Date().toISOString(),
      toolCalls: [searchTool],
      isStreaming: false,
    };

    return {
      message: assistantMessage,
      draft,
      scenario,
    };
  }

  public static async simulateScenario(scenario: SkillBehavioralScenario): Promise<ScenarioSimulationResult> {
    await new Promise((r) => setTimeout(r, 600));

    // Simulated semantic outcome comparison
    const simulatedScore = 0.92;
    const passed = simulatedScore >= scenario.threshold;

    return {
      scenarioName: scenario.name,
      passed,
      similarityScore: simulatedScore,
      threshold: scenario.threshold,
      expectedSkillsInvoked: true,
      actualSkillsInvoked: scenario.expectedSkills,
      missingSkills: [],
      simulatedOutput: `[Agent Execution Trace]: Invocations: ${scenario.expectedSkills.join(', ')}. Outcome matches reference criteria with 92% semantic cosine similarity.`,
    };
  }
}
