# System Specification: 07. Acceptance Criteria & Test Verification

## 1. Traceability Matrix

| AC Identifier | System Capability | Requirement | Validating Bazel Target |
| :--- | :--- | :--- | :--- |
| **AC-1** | Bounded Pagination | FR-1, NFR-1 | `//cmd/castor_server:skills-service_test` |
| **AC-2** | Cryptographic Lockfile Verification | FR-3, NFR-3 | `//internal/installer:installer_test` |
| **AC-3** | JIT Dynamic Pre-Call Retrieval | FR-5, NFR-1 | `//clients/python:test_castor_client`, `//clients/go/pkg/castor_client:castor_client_test` |
| **AC-4** | 5-Point SDLC Audit | FR-6, NFR-3 | `//pkg/validator:validator_test`, `//clients/java:castor_client_java_test` |
| **AC-5** | Domain Verification & Freemail Prevention | FR-7, NFR-3 | `//cmd/castor_server:castor-server_test`, `//pkg/data:data_test` |
| **AC-6** | Model Context Protocol SSE Server | FR-2 | `//pkg/mcp:mcp_test` |
| **AC-7** | Multi-Language Hermetic Build | NFR-2 | `//:test-e2e`, `bazel test //...` |
| **AC-8** | Collaborator RBAC Enforcement | FR-1, NFR-3 | `//pkg/service:service_test` |
| **AC-9** | Repeatable Scenario Verification | FR-8, NFR-3 | `//pkg/validator:validator_test`, `//clients/python:test_loader`, `//clients/go/pkg/castor_client:castor_client_test` |

---

## 2. Given / When / Then Acceptance Criteria

### AC-1: Bounded REST Pagination Safeguards
* **Scenario 1.1: Request within allowed bounds**
  - **Given** the Castor server is running with 50 registered skills,
  - **When** a client sends `GET /api/v1/skills?page=1&max=10`,
  - **Then** the server responds with HTTP 200, exactly 10 skill items, `X-Page: 1`, `X-Page-Size: 10`, `X-Total-Count: 50`, and `X-Total-Pages: 5`.
* **Scenario 1.2: Request exceeding maximum page size bound**
  - **Given** the Castor server is running,
  - **When** a client sends `GET /api/v1/skills?page=1&max=100`,
  - **Then** the server clamps or limits the effective page size to 25 items and emits `X-Page-Size: 25`.

### AC-2: Cryptographic Lockfile Integrity (`cstr verify`)
* **Scenario 2.1: Clean directory verification**
  - **Given** a directory `.skills` containing installed skills and a valid `.manifest.lock`,
  - **When** `cstr verify -d .skills` is executed,
  - **Then** the command exits with code 0 and reports all skills verified successfully.
* **Scenario 2.2: Tampered file detection**
  - **Given** an installed skill where `SKILL.md` was modified on disk after installation,
  - **When** `cstr verify -d .skills` is executed,
  - **Then** the command detects the SHA-256 mismatch, reports the tampered file, and exits with a non-zero failure code.

### AC-3: JIT Dynamic Pre-Call Retrieval Top-K Bounding
* **Scenario 3.1: Pre-call prompt ranking**
  - **Given** a client SDK connected to a registry with diverse skills,
  - **When** the agent calls `SuggestSkills("render interactive chart canvas", 3)`,
  - **Then** the registry calculates cosine similarity against multi-modal vector embeddings,
  - **And** returns at most 3 skills strictly relevant to canvas/rendering, discarding unrelated tools.

### AC-4: 5-Point SDLC Quality Invariant Audit (`cstr validate`)
* **Scenario 4.1: Fully compliant skill package**
  - **Given** a skill with valid frontmatter, non-empty `references/` and `examples/`, CWE security safeguards, HTTP 429 retry guidance, and valid file links,
  - **When** `cstr validate <skill-path>` is executed,
  - **Then** the validator reports `[PASS]` across all 5 checks and exits with code 0.
* **Scenario 4.2: Missing mandatory structure**
  - **Given** a skill missing the `references/` directory or lacking 429 retry guidelines,
  - **When** `cstr validate <skill-path>` is executed,
  - **Then** the validator reports `[FAIL]` identifying the missing invariants and exits with code 1.

### AC-5: Domain Verification & Freemail Prevention
* **Scenario 5.1: Freemail address registration attempt**
  - **Given** a developer attempting to register an app with email `user@gmail.com` claiming domain `retailcortex.com`,
  - **When** the registration request is processed,
  - **Then** the server immediately rejects the request with `ErrFreemailDomainProhibited` (HTTP 400).
* **Scenario 5.2: Corporate SSO email match**
  - **Given** a developer with email `engineer@retailcortex.com` registering domain `retailcortex.com`,
  - **When** the registration request is processed,
  - **Then** the domain verification status is automatically assigned `VERIFIED_SSO`.

### AC-6: Model Context Protocol (MCP) SSE Server
* **Scenario 6.1: MCP client connection & tool discovery**
  - **Given** the Castor server running on port 8000,
  - **When** an MCP-compliant agent connects to `GET /mcp/sse`,
  - **Then** an SSE stream is established,
  - **And** the client successfully lists and invokes MCP tools (`search_skills`, `get_skill`, `list_skills`).

### AC-7: Multi-Language Hermetic Build Verification
* **Scenario 7.1: Zero-ambient hermetic execution**
  - **Given** a clean development or CI environment without global `uv`, `mvn`, `make`, or ambient `go` in `$PATH`,
  - **When** `bazel test //...` is invoked,
  - **Then** all 31 hermetic test targets across Go, Python, Java, and Protobuf compile and pass with exit code 0.

### AC-8: Collaborator Role-Based Access Control (RBAC)
* **Scenario 8.1: Unauthorized mutation attempt by VIEWER**
  - **Given** an authenticated collaborator with `VIEWER` role,
  - **When** the collaborator sends `POST /api/v1/apps/keys` or attempts to mutate skills,
  - **Then** the server denies access with HTTP 403 Forbidden.

### AC-9: Repeatable Skill Scenario Verification (`cstr test`)
* **Scenario 9.1: Successful scenario validation and threshold match**
  - **Given** a skill containing a scenario file in `scenarios/*.md` requiring tool `[bazel]` and threshold `0.70`,
  - **When** the scenario is executed with an agent that invokes `bazel` and produces an output with similarity $\ge 0.70$,
  - **Then** the evaluation passes with status `[PASS]`, reporting similarity score and verified tools.
* **Scenario 9.2: Failed scenario due to missing required tool execution**
  - **Given** a scenario with `executes: true` and `expected_skills: ["bazel"]`,
  - **When** the agent executes without invoking the required `bazel` tool,
  - **Then** the evaluation immediately reports `[FAIL]` identifying missing expected skills.
* **Scenario 9.3: Failed scenario due to low similarity score**
  - **Given** a scenario with threshold `0.80`,
  - **When** the agent produces an output with similarity score `0.45`,
  - **Then** the evaluation reports `[FAIL]` with the threshold deficit.
