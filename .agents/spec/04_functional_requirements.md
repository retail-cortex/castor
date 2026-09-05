# System Specification: 04. Functional Requirements

## 1. Central Registry REST API (FR-1)

The Castor central registry MUST provide a high-performance REST interface powered by Gin:

### 1.1 Skills Endpoints
* **`POST /api/v1/skills`**:
  - Registers a new skill or creates a new version of an existing skill.
  - Requires `X-API-Key` authentication header.
  - Automatically parses `SKILL.md` frontmatter, extracts instructions, validates tools, decomposes content into multi-chunk text and asset slices, and triggers vector embedding computation.
  - Emits HTTP `201 Created` with canonical URI `castor://skills/{domain}/{category}/{name}/{version}`.
* **`GET /api/v1/skills`**:
  - Searches and lists registered skills.
  - Supports query parameters:
    - `q`: Text query for semantic vector search or substring fallback.
    - `category`: Filter by domain category.
    - `tags`: Comma-separated list of keywords.
    - `page`: 1-based page index ($\ge 1$, default $1$).
    - `page_size` / `max`: Page size bound to $1 \le \text{page\_size} \le 25$ (default $5$).
    - `envelope`: Boolean flag. If `true`, returns payload enclosed in standard JSON envelope.
  - **Mandatory Response Headers**:
    - `X-Total-Count`: Total matched entity count.
    - `X-Page`: Current page index.
    - `X-Page-Size`: Effective page size.
    - `X-Total-Pages`: Total pages ($\lceil \text{Total} / \text{PageSize} \rceil$).
* **`GET /api/v1/skills/:id`**:
  - Retrieves detailed skill record, including versions, metadata, and resources.

### 1.2 Application Registration & Domain Management Endpoints
* **`POST /api/v1/apps`**:
  - Registers an application bound to a domain authority.
  - Enforces domain ownership validation (SSO email match vs. DNS challenge token).
  - Explicitly rejects freemail domains (`gmail.com`, `yahoo.com`, etc.).
* **`GET /api/v1/apps/:id`**:
  - Returns application profile, verification status, and domain configuration.
* **`GET /api/v1/apps/verify-dns`**:
  - Triggers on-demand verification of `_castor-challenge.<domain>` DNS TXT record.

### 1.3 Collaborator & RBAC Endpoints
* **`GET /api/v1/apps/members`**: List team members (Requires `VIEWER`+).
* **`POST /api/v1/apps/members/invite`**: Invite collaborator with specified role (`OWNER`, `EDITOR`, `VIEWER`) (Requires `OWNER`).
* **`GET /api/v1/apps/members/accept`**: Public endpoint accepting pending invitation token.
* **`PATCH /api/v1/apps/members/:id`**: Update collaborator role (Requires `OWNER`).
* **`DELETE /api/v1/apps/members/:id`**: Revoke collaborator membership (Requires `OWNER`).

### 1.4 API Key Management Endpoints
* **`GET /api/v1/apps/keys`**: List active and revoked API keys (Requires `OWNER`).
* **`POST /api/v1/apps/keys`**: Provision scoped API key with expiration (Requires `EDITOR`+).
* **`DELETE /api/v1/apps/keys/:id`**: Revoke API key (Requires `OWNER`).

---

## 2. Model Context Protocol (MCP) Server (FR-2)

The server MUST expose an MCP SSE endpoint at `/mcp/sse` using `github.com/mark3labs/mcp-go`:
* Implements the official Model Context Protocol over Server-Sent Events.
* Exposes standard tools:
  - `search_skills`: Semantic search over Castor skills registry.
  - `list_skills`: Bounded listing of available skills with pagination.
  - `get_skill`: Retrieval of complete instructions and references for a specific skill.
* Enables external AI agents and IDEs (e.g., Antigravity, Claude Desktop) to connect directly as an MCP client.

---

## 3. CLI Package Manager (`cstr`) (FR-3)

The `cstr` CLI tool MUST provide the following command suite:

| Command | Subcommands / Syntax | Functional Requirements |
| :--- | :--- | :--- |
| **`search`** | `cstr search <query> [-r] [-p <page>] [-n <max>] [--json]` | Searches local directory or remote registry using semantic vector similarity ($1 \le \text{max} \le 25$). |
| **`list`** | `cstr list [-r] [-p <page>] [-n <max>] [--json]` | Lists skills with bounded pagination headers. |
| **`add`** | `cstr add <uri> [-d <dir>] [--force] [--manifest-only]` | Resolves URI, installs skill directory, computes SHA-256 hash, and updates `.manifest.lock`. |
| **`register`** | `cstr register <source_uri>` | Publishes local or remote source skill to central Castor registry. |
| **`login`** | `cstr login <email> [app_name]` | Requests application registration, prompts for verification token, and stores API key in `~/.castor/.env.toml`. |
| **`config`** | `cstr config set <key> <val>` / `cstr config show` | Manages local CLI settings; `config show` MUST mask API keys (`sk-***`). |
| **`validate`** | `cstr validate <path> [-r] [--json]` | Executes the 5-point SDLC compliance audit and outputs pass/fail status. |
| **`verify`** | `cstr verify [-d <dir>] [--json]` | Verifies local skill files against SHA-256 entries in `.manifest.lock`. |
| **`compile`** | `cstr compile [-d <dir>] [-o <manifest.json>]` | Scans directory, compiles all skills into static `skills_manifest.json` for zero-I/O startup. |
| **`init`** | `cstr init <name> [-d <dir>]` | Generates a valid skill folder with `SKILL.md`, `references/`, and `examples/`. |

---

## 4. Polyglot URI Resolution Protocol (FR-4)

The platform MUST resolve skills across six distinct URI schemes:
1. **`castor://` / `cstr://`**: `castor://skills/{domain}/{category}/{name}/{version}` queries central HTTP registry.
2. **`github://`**: `github://{owner}/{repo}[@{ref}][/{path}]` clones or downloads zipball from GitHub.
3. **`mod://`**: `mod://{module}[@{version}][/{path}]` resolves from Go module cache or proxies.
4. **`maven://`**: `maven://{groupId}:{artifactId}:{version}` resolves from Maven local (`~/.m2`) or remote repos.
5. **`pkg://`**: `pkg://{package_name}` resolves from local Bazel runfiles.
6. **`file://`**: `file:///{absolute/path}` resolves directly from the local filesystem.

---

## 5. JIT Dynamic Pre-Call Retrieval (FR-5)

Client SDKs (Go, Python, Java) MUST support Just-in-Time (JIT) skill suggestions:
* Accepts user prompt string and optional `max_skills` parameter (default $3$, maximum $5$).
* Calls `/api/v1/skills?q=<prompt>&max=<max_skills>`.
* Ranks skills by cosine similarity against the query vector.
* Automatically falls back to local lexical keyword matching if the remote registry is unreachable.
* Restricts tools injected into the agent prompt strictly to the top ranked results to eliminate tool bleed.

---

## 6. 5-Point SDLC Quality Invariant Audit (FR-6)

Every skill MUST satisfy all 5 validation invariants:
1. **YAML Frontmatter**: Valid YAML block containing required fields (`name`, `description`, `license`, `author`, `version`).
2. **L3 Progressive Disclosure Tree**: Must contain non-empty `references/` and `examples/` subdirectories.
3. **CWE Security Checkpoints**: Scanned for unconstrained system execution, dangerous shell invocations, and input sanitization guards.
4. **HTTP 429 Rate Limit Resilience**: Must contain explicit backoff and retry guidance for API/LLM rate limiting.
5. **Markdown Clickable File Links**: Links must use valid markdown syntax with `file:///` scheme (or relative workspace links) with no broken references.

---

## 7. Domain Scoping & Application Registration (FR-7)

* **URN Standard**: Applications are assigned canonical RFC 8141 URNs:
  `urn:castor:app:<domain>:<app_name>`
* **Freemail Blacklist**: Domains matching common freemail services (`gmail.com`, `yahoo.com`, `hotmail.com`, `outlook.com`, `icloud.com`, `aol.com`) MUST be rejected with `ErrFreemailDomainProhibited`.
* **Domain Ownership Validation**:
  - If developer email domain matches the target domain $\to$ automatically marked `VERIFIED_SSO`.
  - Otherwise $\to$ marked `PENDING_DNS` with a generated DNS TXT challenge token (`castor-domain-verify-<uuid>`).

---

## 8. Repeatable Skill Scenario Verification Framework (FR-8)

Skill packages MAY include a `scenarios/` directory defining automated behavioral tests:
* **Scenario File Structure**: Markdown documents (`scenarios/*.md`) containing YAML frontmatter and a reference outcome body.
* **Frontmatter Contract**:
  - `prompt`: String containing test prompt given to the agent.
  - `executes`: Boolean indicating whether tool/skill invocation is expected.
  - `expected_skills`: List of tools/skills required to be applied when `executes` is true (also accepts `skills_applied` as an alias).
  - `threshold`: Float ($0.0 \le \text{threshold} \le 1.0$) defining the minimum similarity score required to pass.
* **Body**: Ground-truth expected outcome text.
* **Execution & Verification Protocol**:
  - Agent receives `prompt`.
  - If `executes: true`, engine verifies all `expected_skills` were invoked.
  - Agent output text is evaluated against reference `outcome` body for semantic similarity ($S \in [0.0, 1.0]$).
  - If $S < \text{threshold}$, the scenario test fails.
* **CLI Integration**: Supported via `cstr test <path> [--json]`.
