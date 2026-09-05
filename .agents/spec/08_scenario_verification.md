# System Specification: 08. Repeatable Skill Scenario Verification Framework

## 1. Executive Summary & Objective

The **Repeatable Skill Scenario Verification Framework** establishes an automated, deterministic behavioral test standard for enterprise AI agent skills in Castor. While the 5-point SDLC audit (FR-6) statically validates structural compliance (YAML frontmatter, L3 progressive disclosure, CWE security checkpoints, HTTP 429 backoff resilience, and valid file links), the Scenario Verification Framework validates **runtime behavioral correctness** of agents consuming the skill.

Every skill package MAY include a `scenarios/` directory containing one or more test scenario definitions (`scenarios/*.md`). The verification engine executes these scenarios against any compatible autonomous agent, verifying tool invocation contracts and calculating semantic similarity between the agent's output and expected reference outcomes.

---

## 2. Skill Directory Layout Standard

A fully compliant skill directory package follows this standard layout:

```
<skill-name>/
├── SKILL.md                 # Required: Skill frontmatter, instructions, and metadata
├── references/              # Required: L3 progressive disclosure reference documentation
│   └── *.md
├── examples/                # Required: L3 progressive disclosure concrete code examples
│   └── *
└── scenarios/               # Optional/Verifiable: Automated behavioral test scenarios
    ├── 01_basic_flow.md
    └── 02_edge_case.md
```

---

## 3. Scenario File Specification

Scenario definitions are stored as Markdown files (`scenarios/*.md`) composed of structured YAML frontmatter and a Markdown body.

### 3.1 YAML Frontmatter Attributes

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | string | No | Human-readable name or identifier for the test scenario. Defaults to filename stem. |
| `description` | string | No | Brief explanation of what the scenario tests. |
| `prompt` | string | **Yes** | The exact test prompt or user instruction provided to the target agent. |
| `executes` | boolean | **Yes** | Boolean flag indicating whether the scenario expects the agent to execute tools/skills. |
| `expected_skills` | list[string] | **Yes** (if `executes: true`) | List of tools or skills that the agent MUST apply/invoke during execution. Note: `skills_applied` is supported as a backward-compatible alias. |
| `threshold` | float | **Yes** | Minimum similarity score ($0.0 \le \text{threshold} \le 1.0$) required for the test to pass. |

### 3.2 Scenario Body (Reference Outcome)

The Markdown body following the frontmatter represents the **expected outcome** (ground-truth or reference response). It can contain text, structured output, markdown code blocks, or terminal output that the agent's generated answer must match semantically.

### 3.3 Example Scenario File (`scenarios/hermetic_build.md`)

```markdown
---
name: hermetic-bzlmod-build
description: Verifies agent leverages hermetic Bazel rules instead of ambient package managers
prompt: "How do I build the Go client package hermetically using Bazel 8?"
executes: true
expected_skills:
  - bazel
threshold: 0.75
---
To build the Go client package hermetically using Bazel 8 and Bzlmod:

```bash
bazel build //clients/go/...
```

Do not invoke host `go build` directly. Bazel ensures all Go toolchains and external dependencies are hermetically fetched and isolated.
```

---

## 4. Verification Engine & Evaluation Lifecycle

When a scenario is evaluated with a target agent:

```
+-----------------------------------------------------------------------------------+
|                           SCENARIO EVALUATION PIPELINE                            |
|                                                                                   |
|  +-------------------+       +--------------------+       +--------------------+  |
|  |  Scenario Input   |  -->  |    Target Agent    |  -->  |   Output & Tools   |  |
|  |  - prompt         |       |  - Reasoning loop  |       |  - actual_response |  |
|  |  - expected_skills|       |  - Tool execution  |       |  - applied_tools   |  |
|  +-------------------+       +--------------------+       +--------------------+  |
|                                                                     |             |
|                                                                     v             |
|  +-------------------+       +--------------------+       +--------------------+  |
|  |    Pass / Fail    |  <--  |  Similarity Score  |  <--  |  Tool Assertion    |  |
|  |  score >= thresh  |       |  - Cosine / Tokens |       |  (if executes=true)|  |
|  |  & tools matched  |       |  - Vector embedding|       |  all in applied?   |  |
|  +-------------------+       +--------------------+       +--------------------+  |
+-----------------------------------------------------------------------------------+
```

### 4.1 Step 1: Prompt Submission
The framework supplies the `prompt` string to the target agent under test.

### 4.2 Step 2: Tool Invocation Assertion
If `executes` is `true`:
- The engine checks whether all entries in `expected_skills` (or `skills_applied`) were invoked by the agent.
- If any required tool/skill was not applied, the scenario test immediately fails with a diagnostic error: `Missing expected skill invocation: <skill>`.

### 4.3 Step 3: Semantic Similarity Scoring
The engine compares the agent's actual textual response against the reference `outcome` body:
- A normalized similarity score $S \in [0.0, 1.0]$ is computed via text vector cosine similarity, normalized token frequency overlap, or semantic embedding comparison.
- When using token frequency similarity:
  $$S = \frac{|\text{Tokens}_{\text{expected}} \cap \text{Tokens}_{\text{actual}}|}{\sqrt{|\text{Tokens}_{\text{expected}}| \cdot |\text{Tokens}_{\text{actual}}|}}$$

### 4.4 Step 4: Threshold Evaluation
- If $S \ge \text{threshold}$ and tool execution assertions pass $\to$ `PASS`.
- If $S < \text{threshold}$ $\to$ `FAIL` (diagnostic reports score achieved vs. threshold required).

---

## 5. Tooling & CLI Integration (`cstr test`)

The Castor CLI package manager exposes the scenario testing capability via:

```bash
cstr test <path-to-skill> [--json]
```

### 5.1 CLI Output Format (Human-Readable)

```text
Evaluating Skill Scenarios: bazel-modules (examples/skills/bazel/bazel-modules)
  [PASS] hermetic-bzlmod-build
         Similarity: 0.84 (Threshold: 0.75) | Tools: [bazel] (Verified)
  [PASS] cross-compile-arm64
         Similarity: 0.79 (Threshold: 0.70) | Tools: [bazel] (Verified)

Summary: 2 scenarios evaluated | 2 PASSED | 0 FAILED
```

### 5.2 CLI Output Format (`--json`)

```json
{
  "skill_name": "bazel-modules",
  "total_scenarios": 2,
  "passed_scenarios": 2,
  "failed_scenarios": 0,
  "results": [
    {
      "scenario_name": "hermetic-bzlmod-build",
      "passed": true,
      "similarity_score": 0.84,
      "threshold": 0.75,
      "tools_expected": ["bazel"],
      "tools_applied": ["bazel"],
      "errors": []
    }
  ]
}
```

---

## 6. Polyglot Client SDK Contracts

All Castor client libraries (Python 3.13, Go, Java 21) implement native bindings for scenario loading and evaluation:

1. **Python (`castor_client`)**:
   - `ScenarioDefinition`: Dataclass containing parsed frontmatter and outcome.
   - `evaluate_scenario(scenario, agent_output, tools_applied) -> ScenarioEvaluationResult`
   - `run_skill_scenarios(skill, agent_runner) -> List[ScenarioEvaluationResult]`
2. **Go (`pkg/castor_client` & `pkg/validator`)**:
   - `ScenarioDefinition`: Struct with YAML/JSON tags.
   - `EvaluateScenario(scenario, agentOutput, toolsApplied) -> ScenarioEvaluationResult`
   - `LoadSkillScenarios(skillDir) -> ([]ScenarioDefinition, error)`
3. **Java (`com.retailcortex.castor.loader`)**:
   - `ScenarioDefinition`: Strongly-typed Java POJO.
   - `ScenarioEvaluationResult`: Evaluation metrics and pass/fail status.
   - `SkillAuditor.auditAllSkills()`: Validates scenario directory structure and frontmatter constraints.
