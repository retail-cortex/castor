import { HitlTier } from './security';

export interface ToolParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

export interface SkillTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
}

export interface SkillAsset {
  path: string; // e.g., 'references/api.md', 'examples/server.py'
  name: string;
  category: 'reference' | 'example' | 'script' | 'media';
  content?: string;
  sizeBytes?: number;
  mimeType?: string;
}

export interface SkillVersionRecord {
  id: string;
  skillId: string;
  version: string;
  uri: string;
  sha256Hash: string;
  createdAt: string;
}

export interface SkillBehavioralScenario {
  name: string;
  path: string;
  prompt: string;
  executes: boolean;
  expectedSkills: string[];
  threshold: number; // 0.0 to 1.0
  referenceOutcome: string;
}

export interface SdlcAuditResult {
  passed: boolean;
  frontmatterCheck: boolean;
  l3TreeCheck: boolean;
  cweSecurityCheck: boolean;
  rateLimit429Check: boolean;
  clickableLinksCheck: boolean;
  errors: string[];
}

export interface SkillItem {
  id: string;
  appId: string;
  name: string;
  category: string;
  uri: string; // castor://skills/{domain}/{category}/{name}/{version}
  latestVersion: string;
  description: string;
  instructions: string;
  license?: string;
  author?: string;
  sha256Hash: string;
  hitlTier: HitlTier;
  tags: string[];
  triggerPhrases: string[];
  tools?: SkillTool[];
  assets?: SkillAsset[];
  scenarios?: SkillBehavioralScenario[];
  versions?: SkillVersionRecord[];
  sdlcStatus?: SdlcAuditResult;
  updatedAt: string;
  createdAt: string;
}

export interface SkillDraft {
  name: string;
  category: string;
  version: string;
  description: string;
  instructions: string;
  license: string;
  author: string;
  hitlTier: HitlTier;
  tags: string[];
  triggerPhrases: string[];
  tools: SkillTool[];
  assets: SkillAsset[];
  scenarios: SkillBehavioralScenario[];
  isDirty: boolean;
  lastSavedAt?: string;
}

export interface SkillPagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
