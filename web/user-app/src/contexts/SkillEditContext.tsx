import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { SkillDraft, SkillAsset, SkillTool, SdlcAuditResult, SkillItem } from '../types/skill';
import { SkillService } from '../services/skillService';
import { useWorkspace } from './WorkspaceContext';
import { useSecurity } from './SecurityContext';
import { useToast } from './ToastContext';

interface SkillEditContextValue {
  draft: SkillDraft;
  updateDraftField: <K extends keyof SkillDraft>(field: K, value: SkillDraft[K]) => void;
  syncFromYamlInstructions: (instructions: string) => void;
  addAsset: (asset: SkillAsset) => void;
  removeAsset: (path: string) => void;
  addTool: (tool: SkillTool) => void;
  removeTool: (name: string) => void;
  sdlcAudit: SdlcAuditResult;
  isPublishing: boolean;
  publishSkill: () => Promise<SkillItem>;
  resetDraft: () => void;
  loadDraftFromSkill: (skill: SkillItem) => void;
}

const INITIAL_DRAFT: SkillDraft = {
  name: 'new-adk-skill',
  category: 'python',
  version: '1.0.0',
  description: 'Enterprise skill definition engineered for autonomous agents',
  instructions: `---
name: new-adk-skill
category: python
version: 1.0.0
description: Enterprise skill definition engineered for autonomous agents
hitl_tier: TIER_2_AUDITED_WRITE
license: Apache-2.0
author: Retail Cortex
tags: [agent, adk]
trigger_phrases: ["execute task"]
---

# System Instructions: new-adk-skill

You are an autonomous agent capable of executing specialized enterprise actions.

## Capabilities
* Generates validated payloads.
* Employs deterministic reasoning gates.

## HTTP 429 Rate Limit Resilience
When encountering HTTP 429 responses from upstream APIs, apply exponential backoff with randomized jitter (initial interval 1.0s, multiplier 2.0, max 5 retries).

## CWE Security Safeguards
* CWE-78: Sanitize all shell arguments; do not invoke unconstrained system calls.
* CWE-89: Parameterize all query statements.

## Reference Documentation
Consult the architecture specification at [references/architecture.md](file:///references/architecture.md).`,
  license: 'Apache-2.0',
  author: 'Retail Cortex',
  hitlTier: 'TIER_2_AUDITED_WRITE',
  tags: ['agent', 'adk'],
  triggerPhrases: ['execute task'],
  tools: [
    {
      name: 'execute_action',
      description: 'Executes the primary task handler.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string' },
        },
        required: ['action'],
      },
    },
  ],
  assets: [
    {
      path: 'references/architecture.md',
      name: 'architecture.md',
      category: 'reference',
      content: '# Architecture Specification\nStandard operational guidelines.',
      sizeBytes: 512,
    },
    {
      path: 'examples/run.py',
      name: 'run.py',
      category: 'example',
      content: 'print("Running example")',
      sizeBytes: 128,
    },
  ],
  scenarios: [
    {
      name: 'default_verification',
      path: 'scenarios/verify.md',
      prompt: 'Execute verification check',
      executes: true,
      expectedSkills: ['execute_action'],
      threshold: 0.85,
      referenceOutcome: 'Completed successfully.',
    },
  ],
  isDirty: false,
};

const SkillEditContext = createContext<SkillEditContextValue | null>(null);

export const SkillEditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeApp } = useWorkspace();
  const { permissions, logAuditEvent } = useSecurity();
  const { showToast } = useToast();

  const [draft, setDraft] = useState<SkillDraft>(INITIAL_DRAFT);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  const updateDraftField = useCallback(<K extends keyof SkillDraft>(field: K, value: SkillDraft[K]) => {
    setDraft((prev) => ({
      ...prev,
      [field]: value,
      isDirty: true,
    }));
  }, []);

  const syncFromYamlInstructions = useCallback((rawInstructions: string) => {
    setDraft((prev) => {
      let updated = { ...prev, instructions: rawInstructions, isDirty: true };
      // Lightweight frontmatter parser
      if (rawInstructions.startsWith('---')) {
        const endIdx = rawInstructions.indexOf('---', 3);
        if (endIdx !== -1) {
          const yamlBlock = rawInstructions.substring(3, endIdx);
          const lines = yamlBlock.split('\n');
          for (const line of lines) {
            const [k, ...v] = line.split(':');
            if (k && v.length) {
              const key = k.trim();
              const val = v.join(':').trim().replace(/^['"]|['"]$/g, '');
              if (key === 'name') updated.name = val;
              if (key === 'category') updated.category = val;
              if (key === 'version') updated.version = val;
              if (key === 'description') updated.description = val;
              if (key === 'license') updated.license = val;
              if (key === 'author') updated.author = val;
              if (key === 'hitl_tier' && (val === 'TIER_1_AUTO_READ' || val === 'TIER_2_AUDITED_WRITE' || val === 'TIER_3_MANDATORY_APPROVAL')) {
                updated.hitlTier = val;
              }
            }
          }
        }
      }
      return updated;
    });
  }, []);

  const addAsset = useCallback((asset: SkillAsset) => {
    setDraft((prev) => ({
      ...prev,
      assets: [...prev.assets.filter((a) => a.path !== asset.path), asset],
      isDirty: true,
    }));
  }, []);

  const removeAsset = useCallback((path: string) => {
    setDraft((prev) => ({
      ...prev,
      assets: prev.assets.filter((a) => a.path !== path),
      isDirty: true,
    }));
  }, []);

  const addTool = useCallback((tool: SkillTool) => {
    setDraft((prev) => ({
      ...prev,
      tools: [...prev.tools.filter((t) => t.name !== tool.name), tool],
      isDirty: true,
    }));
  }, []);

  const removeTool = useCallback((name: string) => {
    setDraft((prev) => ({
      ...prev,
      tools: prev.tools.filter((t) => t.name !== name),
      isDirty: true,
    }));
  }, []);

  // 5-Point SDLC Quality Invariant Evaluation
  const sdlcAudit = useMemo<SdlcAuditResult>(() => {
    const errors: string[] = [];

    // 1. YAML Frontmatter Check
    const hasFrontmatter =
      Boolean(draft.name) &&
      Boolean(draft.version) &&
      Boolean(draft.description) &&
      Boolean(draft.license) &&
      Boolean(draft.author);
    if (!hasFrontmatter) errors.push('Missing required frontmatter fields (name, version, description, license, author)');

    // 2. L3 Directory Tree Check
    const hasReference = draft.assets.some((a) => a.path.startsWith('references/'));
    const hasExample = draft.assets.some((a) => a.path.startsWith('examples/'));
    const l3TreeCheck = hasReference && hasExample;
    if (!l3TreeCheck) errors.push('Missing L3 progressive tree assets (at least 1 reference and 1 example required)');

    // 3. CWE Security Check
    const instructionsLower = draft.instructions.toLowerCase();
    const cweSecurityCheck =
      instructionsLower.includes('cwe') ||
      instructionsLower.includes('sanitize') ||
      instructionsLower.includes('parameterize') ||
      instructionsLower.includes('security');
    if (!cweSecurityCheck) errors.push('Missing CWE security guidelines or input sanitization rules in instructions');

    // 4. HTTP 429 Rate Limit Resilience
    const rateLimit429Check =
      instructionsLower.includes('429') ||
      instructionsLower.includes('rate limit') ||
      instructionsLower.includes('backoff') ||
      instructionsLower.includes('exponential');
    if (!rateLimit429Check) errors.push('Missing HTTP 429 rate limiting resilience & backoff instructions');

    // 5. Clickable Markdown File Links
    const clickableLinksCheck =
      draft.instructions.includes('file:///') ||
      draft.instructions.includes('references/') ||
      draft.instructions.includes('examples/');
    if (!clickableLinksCheck) errors.push('Missing valid clickable references to staged assets');

    const passed = hasFrontmatter && l3TreeCheck && cweSecurityCheck && rateLimit429Check && clickableLinksCheck;

    return {
      passed,
      frontmatterCheck: hasFrontmatter,
      l3TreeCheck,
      cweSecurityCheck,
      rateLimit429Check,
      clickableLinksCheck,
      errors,
    };
  }, [draft]);

  const publishSkill = async (): Promise<SkillItem> => {
    if (!permissions.canPublishSkill) {
      throw new Error('Insufficient permissions. You must have EDITOR or OWNER role to publish skills.');
    }
    if (!sdlcAudit.passed) {
      throw new Error(`SDLC Invariant Audit Failed: ${sdlcAudit.errors.join(', ')}`);
    }

    setIsPublishing(true);
    try {
      const registered = await SkillService.registerSkill(activeApp.appId, draft);
      setDraft((prev) => ({ ...prev, isDirty: false }));
      logAuditEvent('SKILL_PUBLISHED', `Published skill ${registered.name} (${registered.latestVersion})`);
      showToast({
        type: 'success',
        title: 'Skill Published',
        message: `Registered canonical URI: ${registered.uri}`,
      });
      return registered;
    } finally {
      setIsPublishing(false);
    }
  };

  const resetDraft = useCallback(() => {
    setDraft(INITIAL_DRAFT);
  }, []);

  const loadDraftFromSkill = useCallback((skill: SkillItem) => {
    setDraft({
      name: skill.name,
      category: skill.category,
      version: skill.latestVersion,
      description: skill.description,
      instructions: skill.instructions,
      license: skill.license || 'Apache-2.0',
      author: skill.author || 'Retail Cortex',
      hitlTier: skill.hitlTier,
      tags: skill.tags,
      triggerPhrases: skill.triggerPhrases,
      tools: skill.tools || [],
      assets: skill.assets || [],
      scenarios: skill.scenarios || [],
      isDirty: false,
    });
  }, []);

  return (
    <SkillEditContext.Provider
      value={{
        draft,
        updateDraftField,
        syncFromYamlInstructions,
        addAsset,
        removeAsset,
        addTool,
        removeTool,
        sdlcAudit,
        isPublishing,
        publishSkill,
        resetDraft,
        loadDraftFromSkill,
      }}
    >
      {children}
    </SkillEditContext.Provider>
  );
};

export const useSkillEdit = (): SkillEditContextValue => {
  const ctx = useContext(SkillEditContext);
  if (!ctx) throw new Error('useSkillEdit must be used within a SkillEditProvider');
  return ctx;
};
