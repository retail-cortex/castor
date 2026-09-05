# Castor System Specifications & Architecture Standard

Welcome to the **Castor System Specifications**. This directory contains the authoritative, comprehensive technical specifications for the Castor platform, designed for autonomous agents, engineers, and architects.

---

## Specification Document Index

| Document | Topic | Description |
| :--- | :--- | :--- |
| **[01. Executive Summary](01_summary.md)** | Mission, Scope & Value Propositions | Core platform objectives, problem statement, key capabilities, and system boundaries. |
| **[02. Architecture & Subsystems](02_architecture.md)** | C4 Architecture & Component Design | Central registry, MCP SSE server, `cstr` CLI, polyglot SDKs, Protobuf contracts, and Bazel 8 Bzlmod. |
| **[03. User Stories](03_user_stories.md)** | Personas & Operational Scenarios | User stories for Agent Developers, Security Auditors, Platform Engineers, SDK Developers, and CI/CD. |
| **[04. Functional Requirements](04_functional_requirements.md)** | Core Behaviors & Protocols | Specifications for REST API, MCP SSE, CLI package manager, polyglot URI resolution, JIT retrieval, and SDLC audits. |
| **[05. Non-Functional Requirements](05_non_functional_requirements.md)** | Quality Attributes & Constraints | Latency budgets, strict Bazel hermeticity, cryptographic lockfiles, CWE prevention, HITL safety tiering, and polyglot runtimes. |
| **[06. Persistence & Data Models](06_persistence_data_models.md)** | Schemas, ERD & Storage Engine | PostgreSQL / AlloyDB `pgvector` poly-column schema, HNSW indexes, GORM entities, SQLite fallback, and `.manifest.lock`. |
| **[07. Acceptance Criteria & Tests](07_acceptance_criteria.md)** | BDD Criteria & Traceability Matrix | Given/When/Then acceptance criteria mapped to automated Bazel test targets. |
| **[08. Scenario Verification](08_scenario_verification.md)** | Repeatable Behavioral Testing | Frontmatter schema (`prompt`, `executes`, `expected_skills`, `threshold`), tool validation, and outcome similarity. |

---

## Guiding Principles for Autonomous Agents Working on Castor

When implementing features, fixing bugs, or refactoring code in this repository, all agents MUST observe the following invariants:

1. **Strict Hermeticity (Bazel 8 Bzlmod)**:
   - **NEVER** run host ambient tools (`make`, `uv`, `pip`, `mvn`, `maven`, host `go`, or `gofmt`).
   - Route all builds, tests, and tool commands through Bazel (e.g. `bazel run go -- fmt ./...`, `bazel test //...`).
2. **Model-Driven Development (MDD)**:
   - Schema contracts in `proto/castor/` are the single source of truth across Go, Python, and Java.
   - Message fields MUST prefer `snake_case` and explicitly annotate `[json_name = "field_name"]`.
3. **5-Point SDLC Quality Invariant**:
   - Skills must pass all 5 checks: YAML Frontmatter, L3 Directory Tree (`references/`, `examples/`), CWE security checkpoints, HTTP 429 backoff resilience, and valid markdown file links.
4. **Context Window Optimization via JIT Retrieval**:
   - Dynamic prompt queries must bound injected tools to top $\le 3$ relevant skills to eliminate tool bleed.
5. **Specialized Domain Skills**:
   - For language-specific standards, consult the specialized skills in `../skills/`:
     - [Bazel Skill](../skills/bazel/SKILL.md)
     - [Go Skill](../skills/go/SKILL.md)
     - [Java Skill](../skills/java/SKILL.md)
     - [Python Skill](../skills/python/SKILL.md)
     - [Protobuf Skill](../skills/protobuf/SKILL.md)
