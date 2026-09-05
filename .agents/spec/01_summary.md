# System Specification: 01. Executive Summary

## 1. Project Mission & Objectives

**Castor** is an enterprise-grade AI Agent Skills registry, package manager, and lifecycle distribution platform engineered for the **Google Agent Development Kit (ADK)** and autonomous multi-agent systems.

Castor extends and supersedes the baseline [agentskills.io](https://agentskills.io/specification) standard. It addresses the critical challenges faced by enterprise AI deployments:
1. **Tool Bleed & Context Window Exhaustion**: Static injection of hundreds of tools degrades LLM performance, triggers context exhaustion, and increases reasoning costs.
2. **Supply Chain & Integrity Risks**: Unverified third-party agent tools introduce vulnerabilities, untracked dependencies, and arbitrary code execution vectors.
3. **Polyglot Ecosystem Fragmentation**: Multi-agent environments deploy across Go, Python, and Java, requiring unified contracts and tool discovery.
4. **Lack of Enterprise Governance**: Mission-critical agents require cryptographic lockfiles, domain namespace verification, Role-Based Access Control (RBAC), and Human-in-the-Loop (HITL) safety guardrails.

---

## 2. Core Value Propositions

* **Central Registry Service (`castor-server`)**: Centralized catalog serving dual REST API and Model Context Protocol (MCP) Server-Sent Events (SSE).
* **Multi-Modal Vector Search (`pgvector`)**: Multi-column HNSW vector indexing (`embedding_768`, `embedding_1408`, `embedding_3072`) indexing textual instructions, markdown guides, and binary assets (images, PDFs, WASM, Protobuf).
* **JIT Dynamic Pre-Call Retrieval**: Real-time semantic tool injection bounding agent tool context to top $\le 3$ relevant skills.
* **Hermetic Developer CLI (`cstr`)**: Complete local and remote skill lifecycle management (`search`, `list`, `add`, `register`, `login`, `config`, `validate`, `verify`, `compile`, `init`).
* **Cryptographic Supply Chain Security**: SHA-256 lockfile tracking (`.manifest.lock`) and 5-point SDLC compliance auditing.
* **Repeatable Skill Scenario Verification**: Automated scenario validation (`scenarios/*.md`) asserting required tool application and semantic outcome similarity thresholds.
* **Unified Polyglot SDKs**: First-class client libraries for Go, Python 3.13, and Java 21 with native build toolchain hooks (PEP 517, Maven Mojo, `//go:generate`).

---

## 3. System Scope & Boundaries

```
+-----------------------------------------------------------------------------------+
|                                  CASTOR PLATFORM                                  |
|                                                                                   |
|  +------------------------+  +------------------------+  +---------------------+  |
|  |     Castor Server      |  |       Castor CLI       |  |  Polyglot SDKs      |  |
|  |  - Gin REST API        |  |  - Package Manager     |  |  - Go SDK           |  |
|  |  - MCP SSE Server      |  |  - SDLC Validator      |  |  - Python SDK (ADK) |  |
|  |  - pgvector HNSW Index |  |  - Lockfile Verifier   |  |  - Java 21 Client   |  |
|  +------------------------+  +------------------------+  +---------------------+  |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |             Hermetic Bazel 8 Build & Toolchain Infrastructure               |  |
|  |             (rules_go, rules_python, rules_jvm_external, rules_proto)       |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

### In-Scope:
- Central registry storage, semantic search, and retrieval of agent skills.
- Model Context Protocol (MCP) transport over Server-Sent Events (SSE).
- Cryptographic hashing, lockfile generation, and integrity verification.
- JIT semantic discovery and dynamic tool filtering for AI agents.
- 5-point SDLC quality and compliance auditing.
- Repeatable behavioral scenario testing and similarity scoring against thresholds.
- Multi-tenant application registration, domain verification, and RBAC collaborator management.
- Polyglot client libraries and build system integrations.

### Out-of-Scope:
- Direct hosting or execution of arbitrary cloud sandboxes (execution is delegated to client agents and host runtimes).
- General-purpose LLM gateway or model routing (focused strictly on agent skill management and tool discovery).
