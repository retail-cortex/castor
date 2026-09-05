# System Specification: 03. User Stories

## 1. Persona Definitions

* **Platform Engineer (DevOps/SRE)**: Operates the central Castor registry, configures vector databases, manages domain namespaces, and provisions developer applications.
* **Agent Developer**: Builds LLM agents using Google ADK or custom frameworks, consuming skills dynamically and authoring custom skills.
* **Security & Compliance Auditor**: Ensures all skills conform to enterprise CWE standards, verify cryptographic supply chain lockfiles, and audit HITL safety tiers.
* **Polyglot SDK Developer**: Integrates Castor skills into Go microservices, Python agent runtimes, or enterprise Java applications.
* **CI/CD Build System**: Headless build runner validating commits, compiling hermetic artifacts, and verifying lockfiles.

---

## 2. User Stories by Persona

### 2.1 Agent Developer
* **US-1.1: Just-in-Time Dynamic Skill Retrieval**
  - *As an* Agent Developer,
  - *I want to* query the Castor registry at runtime with the incoming user prompt to receive only the top $\le 3$ relevant skills,
  - *So that* I can prevent tool bleed, conserve context window tokens, and increase agent execution accuracy.
* **US-1.2: Polyglot Skill Installation via CLI**
  - *As an* Agent Developer,
  - *I want to* run `cstr add <uri>` supporting `castor://`, `github://`, `mod://`, `maven://`, and `file://` URIs,
  - *So that* I can seamlessly import skills regardless of where they are hosted.
* **US-1.3: Zero-I/O Cold Start Pre-Compilation**
  - *As an* Agent Developer,
  - *I want to* compile my skills into a static `skills_manifest.json` using `cstr compile`,
  - *So that* my agent starts instantly without scanning disk directories or parsing markdown at runtime.

### 2.2 Security & Compliance Auditor
* **US-2.1: Cryptographic Supply Chain Lockfile Verification**
  - *As a* Security Auditor,
  - *I want* every installed skill to be recorded in a `.manifest.lock` file with SHA-256 digests,
  - *So that* I can verify via `cstr verify` that no tool scripts or instructions have been tampered with.
* **US-2.2: 5-Point SDLC Quality Invariant Enforcement**
  - *As a* Security Auditor,
  - *I want* all skills to be validated against mandatory checks (Frontmatter, Structure, CWE security guards, 429 rate limit retries, and file link integrity),
  - *So that* non-compliant or hazardous tools are rejected before entering production registries.
* **US-2.3: Human-in-the-Loop (HITL) Execution Tiering**
  - *As a* Security Auditor,
  - *I want* high-risk mutating skills to require explicit approval gates (Tier 3),
  - *So that* autonomous agents cannot execute destructive changes without human consent.

### 2.3 Platform Engineer
* **US-3.1: Domain Namespace Verification & Freemail Prevention**
  - *As a* Platform Engineer,
  - *I want* registered applications to prove domain ownership via SSO email matching or DNS TXT challenges,
  - *So that* public freemail providers (`gmail.com`, `yahoo.com`) cannot hijack corporate namespaces.
* **US-3.2: Multi-User Role-Based Access Control (RBAC)**
  - *As a* Platform Engineer,
  - *I want* application owners to invite collaborators with `OWNER`, `EDITOR`, or `VIEWER` roles,
  - *So that* skill mutations and API key issuance are strictly permission-governed.
* **US-3.3: Multi-Modal Semantic Search with Soft-Switch Providers**
  - *As a* Platform Engineer,
  - *I want to* switch embedding providers dynamically via `.env.toml` between Vertex AI and AlloyDB AI,
  - *So that* I can optimize cost and data locality without rearchitecting the application.

### 2.4 Polyglot SDK Developer
* **US-4.1: Native Python PEP 517 Build Integration**
  - *As a* Python Developer,
  - *I want* `castor_client.build_meta` to manage skill dependencies during `pip install` or `uv build`,
  - *So that* skills are treated as first-class packaging artifacts.
* **US-4.2: Enterprise Java 21 Maven Plugin Integration**
  - *As a* Java Developer,
  - *I want* a Maven Mojo plugin to bundle pre-compiled skills into my application JAR,
  - *So that* my enterprise Spring Boot or Quarkus service can embed skills cleanly.
* **US-4.3: Go Generate & Embed Support**
  - *As a* Go Developer,
  - *I want to* compile skills with `//go:generate` and load them via `//go:embed`,
  - *So that* I can distribute a single self-contained binary with zero external dependencies.

### 2.5 Automated CI/CD Pipeline
* **US-5.1: Fully Hermetic Multi-Language Testing**
  - *As a* CI/CD Runner,
  - *I want* all builds, tests, and code generation steps to execute hermetically via Bazel targets,
  - *So that* builds are 100% reproducible and independent of host environment packages.

### 2.6 Skill Author & Evaluation Engineer
* **US-6.1: Repeatable Scenario Verification**
  - *As a* Skill Author or Evaluation Engineer,
  - *I want* to define behavioral test scenarios in `scenarios/*.md` with prompt, expected tool executions, and reference outcomes,
  - *So that* I can deterministically verify agent competence and output similarity against configured thresholds across releases.
