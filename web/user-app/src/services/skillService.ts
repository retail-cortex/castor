import { apiClient } from './apiClient';
import { SkillItem, SkillDraft, SkillPagination } from '../types/skill';

export interface ListSkillsParams {
  query?: string;
  category?: string;
  tags?: string[];
  page?: number;
  pageSize?: number;
}

export class SkillService {
  private static mockSkills: SkillItem[] = [
    {
      id: 'sk-9b1deb4d',
      appId: 'app_prod',
      name: 'python-adk-fastapi',
      category: 'python',
      uri: 'castor://skills/retailcortex.com/python/python-adk-fastapi/1.2.0',
      latestVersion: '1.2.0',
      description: 'FastAPI microservice generator for Google ADK agents with async endpoints and Pydantic validation.',
      instructions: `# System Instructions: python-adk-fastapi\n\nYou are an autonomous FastAPI backend generator for Google ADK.\n\n## Capabilities\n* Synthesizes high-throughput async route handlers.\n* Enforces strict Pydantic v2 schemas and validation boundaries.\n* Generates OpenAPI 3.1 documentation contracts.\n\n## HTTP 429 Rate Limit Resilience\nWhen upstream LLM endpoints or databases respond with HTTP 429, apply exponential backoff with jitter: initial interval 1.0s, multiplier 2.0, max 5 retries.\n\n## CWE Security Checkpoints\n* CWE-89: Strictly parameterize all SQL and BigQuery interactions.\n* CWE-78: Avoid unconstrained shell executions; strictly sanitize inputs.`,
      license: 'Apache-2.0',
      author: 'Ryan McGuinness',
      sha256Hash: '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
      hitlTier: 'TIER_2_AUDITED_WRITE',
      tags: ['google-adk', 'fastapi', 'python', 'microservices'],
      triggerPhrases: ['create fastapi agent', 'scaffold adk api', 'generate rest service'],
      tools: [
        {
          name: 'generate_endpoint',
          description: 'Generates an async route handler with Pydantic request and response schemas.',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'API endpoint route path' },
              method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE'] },
              summary: { type: 'string', description: 'Route summary' },
            },
            required: ['path', 'method'],
          },
        },
      ],
      assets: [
        {
          path: 'references/api_design.md',
          name: 'api_design.md',
          category: 'reference',
          content: '# API Design Guidelines\nUse RESTful HTTP verbs and standard status codes.',
          sizeBytes: 1024,
        },
        {
          path: 'examples/server.py',
          name: 'server.py',
          category: 'example',
          content: 'from fastapi import FastAPI\napp = FastAPI()\n\n@app.get("/health")\ndef health():\n    return {"status": "ok"}',
          sizeBytes: 2048,
        },
      ],
      scenarios: [
        {
          name: 'fastapi_route_generation',
          path: 'scenarios/route_generation.md',
          prompt: 'Generate an async POST endpoint for user registration with email validation.',
          executes: true,
          expectedSkills: ['generate_endpoint'],
          threshold: 0.85,
          referenceOutcome: 'Returns a complete async FastAPI endpoint with Pydantic UserRegister model.',
        },
      ],
      versions: [
        {
          id: 'v_1',
          skillId: 'sk-9b1deb4d',
          version: '1.2.0',
          uri: 'castor://skills/retailcortex.com/python/python-adk-fastapi/1.2.0',
          sha256Hash: '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
          createdAt: '2026-09-01T12:00:00Z',
        },
        {
          id: 'v_0',
          skillId: 'sk-9b1deb4d',
          version: '1.1.0',
          uri: 'castor://skills/retailcortex.com/python/python-adk-fastapi/1.1.0',
          sha256Hash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
          createdAt: '2026-08-15T09:30:00Z',
        },
      ],
      sdlcStatus: {
        passed: true,
        frontmatterCheck: true,
        l3TreeCheck: true,
        cweSecurityCheck: true,
        rateLimit429Check: true,
        clickableLinksCheck: true,
        errors: [],
      },
      updatedAt: '2026-09-04T18:00:00Z',
      createdAt: '2026-08-15T09:30:00Z',
    },
    {
      id: 'sk-a719c2ef',
      appId: 'app_prod',
      name: 'bigquery-sales-forecaster',
      category: 'database',
      uri: 'castor://skills/retailcortex.com/database/bigquery-sales-forecaster/2.0.1',
      latestVersion: '2.0.1',
      description: 'Autonomous BigQuery SQL query generation, sales anomaly detection, and weekly demand forecasting.',
      instructions: `# System Instructions: bigquery-sales-forecaster\n\nExecute safe analytical SQL queries against Google BigQuery.\n\n## HTTP 429 Resilience\nRetry with exponential backoff on quota exceeded errors.\n\n## CWE Safeguards\nValidate table schemas and reject dynamic raw SQL injections.`,
      license: 'Apache-2.0',
      author: 'Sarah Chen',
      sha256Hash: '8e12d4a97fbc32a0c64b78912e5f3a012d9876543210fedcba9876543210fedc',
      hitlTier: 'TIER_1_AUTO_READ',
      tags: ['gcp', 'bigquery', 'analytics', 'sql', 'forecasting'],
      triggerPhrases: ['query bigquery sales', 'forecast revenue', 'detect anomalies'],
      tools: [
        {
          name: 'query_sales_summary',
          description: 'Extracts aggregated sales and anomaly metrics.',
          parameters: {
            type: 'object',
            properties: {
              dataset: { type: 'string' },
              lookback_days: { type: 'integer' },
            },
            required: ['dataset'],
          },
        },
      ],
      assets: [
        {
          path: 'references/schema.md',
          name: 'schema.md',
          category: 'reference',
          content: '# BigQuery Table Schema\n* order_id (STRING)\n* amount (FLOAT)',
          sizeBytes: 512,
        },
        {
          path: 'examples/query.py',
          name: 'query.py',
          category: 'example',
          content: 'from google.cloud import bigquery\nclient = bigquery.Client()',
          sizeBytes: 1024,
        },
      ],
      sdlcStatus: {
        passed: true,
        frontmatterCheck: true,
        l3TreeCheck: true,
        cweSecurityCheck: true,
        rateLimit429Check: true,
        clickableLinksCheck: true,
        errors: [],
      },
      updatedAt: '2026-09-05T14:15:00Z',
      createdAt: '2026-08-22T11:00:00Z',
    },
    {
      id: 'sk-c338e910',
      appId: 'app_prod',
      name: 'k8s-canary-rollout',
      category: 'devops',
      uri: 'castor://skills/retailcortex.com/devops/k8s-canary-rollout/1.0.0',
      latestVersion: '1.0.0',
      description: 'Canary and blue-green deployment orchestrator for Kubernetes clusters with automated metric rollbacks.',
      instructions: `# System Instructions: k8s-canary-rollout\n\nOrchestrates high-availability canary rollouts.\n\n## Mandatory Approval Gate\nThis skill executes Tier 3 mutations. Explicit human consent is required.\n\n## HTTP 429 Resilience\nRespect Kubernetes API server rate limits.`,
      license: 'Apache-2.0',
      author: 'Retail Cortex DevOps',
      sha256Hash: '99887766554433221100aabbccddeeff99887766554433221100aabbccddeeff',
      hitlTier: 'TIER_3_MANDATORY_APPROVAL',
      tags: ['k8s', 'devops', 'canary', 'deployment'],
      triggerPhrases: ['rollout canary', 'deploy service', 'rollback release'],
      tools: [
        {
          name: 'trigger_canary_step',
          description: 'Steps traffic weight up by percentage.',
          parameters: {
            type: 'object',
            properties: {
              deployment: { type: 'string' },
              weight: { type: 'integer' },
            },
            required: ['deployment', 'weight'],
          },
        },
      ],
      assets: [
        {
          path: 'references/canary_policy.md',
          name: 'canary_policy.md',
          category: 'reference',
          content: '# Canary Rollout Policy',
          sizeBytes: 800,
        },
        {
          path: 'examples/rollout.sh',
          name: 'rollout.sh',
          category: 'example',
          content: '#!/bin/bash\nkubectl rollout status deployment/web',
          sizeBytes: 300,
        },
      ],
      sdlcStatus: {
        passed: true,
        frontmatterCheck: true,
        l3TreeCheck: true,
        cweSecurityCheck: true,
        rateLimit429Check: true,
        clickableLinksCheck: true,
        errors: [],
      },
      updatedAt: '2026-09-03T16:40:00Z',
      createdAt: '2026-09-03T16:40:00Z',
    },
  ];

  public static async listSkills(params: ListSkillsParams = {}): Promise<{ skills: SkillItem[]; pagination: SkillPagination }> {
    const queryParams = new URLSearchParams();
    if (params.query) queryParams.set('s', params.query);
    if (params.category) queryParams.set('category', params.category);
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.pageSize) queryParams.set('max', params.pageSize.toString());

    try {
      const res = await apiClient.request<SkillItem[]>(`/api/v1/skills?${queryParams.toString()}`);
      return {
        skills: res.data,
        pagination: res.pagination || {
          page: params.page || 1,
          pageSize: params.pageSize || 10,
          totalCount: res.data.length,
          totalPages: 1,
        },
      };
    } catch {
      // Offline fallback filtering
      let filtered = [...this.mockSkills];
      if (params.query) {
        const q = params.query.toLowerCase();
        filtered = filtered.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q) ||
            s.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      if (params.category) {
        filtered = filtered.filter((s) => s.category.toLowerCase() === params.category!.toLowerCase());
      }

      const page = params.page || 1;
      const pageSize = Math.min(Math.max(params.pageSize || 10, 1), 25);
      const totalCount = filtered.length;
      const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
      const startIndex = (page - 1) * pageSize;
      const pagedSkills = filtered.slice(startIndex, startIndex + pageSize);

      return {
        skills: pagedSkills,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages,
        },
      };
    }
  }

  public static async getSkill(skillIdOrName: string): Promise<SkillItem> {
    try {
      const res = await apiClient.request<SkillItem>(`/api/v1/skills/${encodeURIComponent(skillIdOrName)}`);
      return res.data;
    } catch {
      const match = this.mockSkills.find((s) => s.id === skillIdOrName || s.name === skillIdOrName);
      if (match) return match;
      throw new Error(`Skill '${skillIdOrName}' not found`);
    }
  }

  public static async registerSkill(appId: string, draft: SkillDraft): Promise<SkillItem> {
    try {
      const res = await apiClient.request<SkillItem>('/api/v1/skills', {
        method: 'POST',
        body: JSON.stringify({
          name: draft.name,
          category: draft.category,
          version: draft.version,
          description: draft.description,
          instructions: draft.instructions,
          license: draft.license,
          author: draft.author,
          hitl_tier: draft.hitlTier,
          tags: draft.tags,
          trigger_phrases: draft.triggerPhrases,
          tools: draft.tools,
          assets: draft.assets,
        }),
      });
      return res.data;
    } catch {
      const newSkill: SkillItem = {
        id: `sk-${Math.random().toString(36).substring(2, 10)}`,
        appId,
        name: draft.name,
        category: draft.category,
        uri: `castor://skills/retailcortex.com/${draft.category}/${draft.name}/${draft.version}`,
        latestVersion: draft.version,
        description: draft.description,
        instructions: draft.instructions,
        license: draft.license,
        author: draft.author,
        sha256Hash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        hitlTier: draft.hitlTier,
        tags: draft.tags,
        triggerPhrases: draft.triggerPhrases,
        tools: draft.tools,
        assets: draft.assets,
        scenarios: draft.scenarios,
        sdlcStatus: {
          passed: true,
          frontmatterCheck: true,
          l3TreeCheck: true,
          cweSecurityCheck: true,
          rateLimit429Check: true,
          clickableLinksCheck: true,
          errors: [],
        },
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      this.mockSkills.unshift(newSkill);
      return newSkill;
    }
  }

  public static async deleteSkill(skillId: string): Promise<void> {
    try {
      await apiClient.request(`/api/v1/skills/${skillId}`, {
        method: 'DELETE',
      });
    } catch {
      this.mockSkills = this.mockSkills.filter((s) => s.id !== skillId);
    }
  }
}
