# System Specification: 05. Non-Functional Requirements

## 1. Performance & Latency Budgets (NFR-1)

* **JIT Pre-Call Retrieval Latency**:
  - P95 response latency for semantic vector search (`GET /api/v1/skills?q=...`) MUST be $\le 250$ms when querying PostgreSQL/AlloyDB with HNSW indexes.
  - P95 response latency for cached, ID, or category lookups MUST be $\le 50$ms.
* **Bounded Pagination Safeguards**:
  - The central registry MUST enforce hard limits: $1 \le \text{page\_size} \le 25$ (default: $5$).
  - Requests exceeding 25 items MUST be clamped or rejected to prevent server memory exhaustion and unbounded database serialization overhead.
* **Agent Startup & Zero-I/O Ingestion**:
  - Pre-compiled manifest loading (`skills_manifest.json`) MUST achieve in-memory cold start initialization in $\le 10$ms, avoiding runtime directory walks or markdown parsing.

---

## 2. Hermetic Build & Toolchain Integrity (NFR-2)

* **Strict Hermeticity (Bazel 8 Bzlmod)**:
  - All builds, test suites, validations, code generations, and executions MUST be driven exclusively through Bazel.
  - **Zero Ambient / Host Tool Execution**:
    - **NO `uv`, `pip`, or host `python`**: Never run ambient Python tools. Use Bazel targets (`rules_python`).
    - **NO `mvn` or host `maven`**: Never run ambient Maven. External artifacts are managed hermetically via `rules_jvm_external`.
    - **NO `make` or `Makefile`**: Never invoke `make`.
    - **NO host `go`**: Never run host `go`, `gofmt`, or `go test`. Use `bazel run go -- ...` (aliased to `@rules_go//go`).
* **Deterministic Artifact Generation**:
  - Build outputs in `bazel-bin/` must be 100% deterministic and reproducible across macOS and Linux host environments.

---

## 3. Security & Supply Chain Integrity (NFR-3)

* **Cryptographic Lockfiles (`.manifest.lock`)**:
  - Every skill installed via `cstr add` MUST record its relative directory structure and individual file SHA-256 digests in `.manifest.lock`.
  - The `cstr verify` command MUST verify that disk contents match `.manifest.lock` with zero tolerance for undetected drift or modification.
* **CWE Vulnerability Prevention**:
  - Skills are statically audited against CWE security risks:
    - CWE-78: OS Command Injection (unconstrained shell exec).
    - CWE-22: Path Traversal (arbitrary file read/write outside designated directory).
    - CWE-798: Hardcoded Credentials (secrets embedded in instructions or scripts).
* **Zero Ambient Secrets**:
  - No credentials, tokens, or private keys may be committed to source code or logged in plain text.
  - CLI commands such as `cstr config show` MUST mask API keys (`sk-***`).
* **Role-Based Access Control (RBAC)**:
  - Permission levels (`OWNER`, `EDITOR`, `VIEWER`) are strictly enforced across REST endpoints and gRPC methods.

---

## 4. Human-in-the-Loop (HITL) Safety & Risk Tiering (NFR-4)

Every skill and tool execution contract MUST define an explicit HITL risk tier:

| Tier | Name | Classification & Behavior |
| :--- | :--- | :--- |
| **Tier 0** | `BYPASS_ALL` | Automated/CI headless execution. Used only in non-interactive test suites. |
| **Tier 1** | `AUTO_READ` | Informative, read-only actions (search, fetch, inspect). Auto-executed with audit trail. |
| **Tier 2** | `AUDITED_WRITE` | Low-risk mutations (scratch file creation, cache refresh). Auto-executed with snapshot rollback. |
| **Tier 3** | `MANDATORY_APPROVAL` | High-risk mutating actions (file deletion, production deployments, credential updates). Requires explicit interactive human approval gate. |

---

## 5. High Availability & Data Resilience (NFR-5)

* **Dual-Tier Storage Architecture**:
  - Production: PostgreSQL/AlloyDB with `pgvector` extension and multi-column HNSW indexes (`m=16`, `ef_construction=64`).
  - Local/Embedded Development: SQLite fallback using pure Go driver (`modernc.org/sqlite`) ensuring zero-infrastructure local setups.
* **Deterministic Semantic Fallback**:
  - When live cloud AI services (Vertex AI, AlloyDB AI) are unconfigured or unreachable, the system MUST seamlessly fall back to deterministic semantic hashing to maintain continuous offline functionality and hermetic test isolation.

---

## 6. Polyglot Compatibility & Standards Compliance (NFR-6)

* **Supported Language Runtimes**:
  - **Go**: Version 1.26.5 managed by `rules_go`.
  - **Python**: Version 3.13 managed by `rules_python`.
  - **Java**: Java 21 runtime compiled with `--release 17` bytecode targeting for maximum enterprise compatibility.
  - **Protobuf**: Version 33.4 managed by `rules_proto`.
* **Licensing**:
  - Every source code file MUST carry the canonical Apache 2.0 copyright and license header.
