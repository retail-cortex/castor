// Copyright 2026 Ryan McGuinness
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package validator_test

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/retail-cortex/castor/pkg/validator"
	"github.com/stretchr/testify/assert"
)

func TestParseFrontmatter(t *testing.T) {
	content := `---
name: test-skill
description: A test skill definition
license: Apache-2.0
author: Ryan McGuinness
version: 1.0.0
---
# Test Skill
This is instructions.
`
	fm, body := validator.ParseFrontmatter(content)
	assert.Equal(t, "test-skill", fm["name"])
	assert.Equal(t, "A test skill definition", fm["description"])
	assert.Equal(t, "Apache-2.0", fm["license"])
	assert.Contains(t, body, "# Test Skill")
}

func TestSkillFrontmatter_Validate(t *testing.T) {
	validFM := validator.SkillFrontmatter{
		Name:        "my-awesome-skill",
		Description: "Detailed description",
		License:     "Apache-2.0",
		Author:      "Tester",
		Version:     "1.0",
	}
	assert.NoError(t, validFM.Validate())

	invalidNameFM := validFM
	invalidNameFM.Name = "Invalid_Name"
	assert.Error(t, invalidNameFM.Validate())

	emptyDescFM := validFM
	emptyDescFM.Description = ""
	assert.Error(t, emptyDescFM.Validate())
}

func TestAuditSkillDirectory_ValidSkill(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "skill-test-*")
	assert.NoError(t, err)
	defer os.RemoveAll(tmpDir)

	skillDir := filepath.Join(tmpDir, "valid-skill")
	err = os.MkdirAll(filepath.Join(skillDir, "references"), 0755)
	assert.NoError(t, err)
	err = os.MkdirAll(filepath.Join(skillDir, "examples"), 0755)
	assert.NoError(t, err)

	skillMDContent := `---
name: valid-skill
description: Valid skill for unit test
license: Apache-2.0
author: Ryan McGuinness
version: 1.0.0
---
# Valid Skill

Security Checkpoint: Ensures CWE-20 validation.
HTTP 429 Rate Limit exponential backoff is implemented.
See [docs](file:///path/to/doc.md) for details.
`
	err = os.WriteFile(filepath.Join(skillDir, "SKILL.md"), []byte(skillMDContent), 0644)
	assert.NoError(t, err)

	err = os.WriteFile(filepath.Join(skillDir, "references", "ref.md"), []byte("[reference](file:///ref.md)"), 0644)
	assert.NoError(t, err)

	err = os.WriteFile(filepath.Join(skillDir, "examples", "ex.md"), []byte("Example code"), 0644)
	assert.NoError(t, err)

	result := validator.AuditSkillDirectory(skillDir)
	assert.True(t, result.Passed, "Audit result errors: %v", result.Errors)
	assert.True(t, result.FrontmatterValid)
	assert.True(t, result.L3TreeValid)
	assert.True(t, result.CWESecurityValid)
	assert.True(t, result.RateLimit429Valid)
	assert.True(t, result.ClickableLinksValid)
	assert.Empty(t, result.Errors)
}

func TestAuditSkillDirectory_MissingSKILLMD(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "skill-test-*")
	assert.NoError(t, err)
	defer os.RemoveAll(tmpDir)

	result := validator.AuditSkillDirectory(tmpDir)
	assert.False(t, result.Passed)
	assert.Contains(t, result.Errors[0], "Missing SKILL.md file")
}

func TestAuditAllSkills_Recursive(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "skills-root-*")
	assert.NoError(t, err)
	defer os.RemoveAll(tmpDir)

	skillDir1 := filepath.Join(tmpDir, "skill-one")
	skillDir2 := filepath.Join(tmpDir, "sub", "skill-two")

	for _, sDir := range []string{skillDir1, skillDir2} {
		_ = os.MkdirAll(filepath.Join(sDir, "references"), 0755)
		_ = os.MkdirAll(filepath.Join(sDir, "examples"), 0755)
		_ = os.WriteFile(filepath.Join(sDir, "references", "ref.md"), []byte("ref"), 0644)
		_ = os.WriteFile(filepath.Join(sDir, "examples", "ex.md"), []byte("ex"), 0644)

		sName := filepath.Base(sDir)
		content := `---
name: ` + sName + `
description: Skill description
license: Apache-2.0
author: Tester
version: 1.0
---
Security Checkpoint CWE-79.
HTTP 429 Retryablehttp.
Link: [doc](file:///doc.md)
`
		_ = os.WriteFile(filepath.Join(sDir, "SKILL.md"), []byte(content), 0644)
	}

	summary := validator.AuditAllSkills(tmpDir, true)
	assert.GreaterOrEqual(t, summary.TotalSkills, 2)
	assert.Equal(t, summary.TotalSkills, summary.PassedSkills)
	assert.Equal(t, 0, summary.FailedSkills)
}

func TestAuditSummary_ToJSON(t *testing.T) {
	summary := validator.AuditSummary{
		TotalSkills:  2,
		PassedSkills: 1,
		FailedSkills: 1,
		Results: []validator.SkillAuditResult{
			{SkillName: "s1", Passed: true},
			{SkillName: "s2", Passed: false, Errors: []string{"error"}},
		},
	}
	jsonStr, err := summary.ToJSON()
	assert.NoError(t, err)
	assert.Contains(t, jsonStr, "s1")
	assert.Contains(t, jsonStr, "s2")
}

func TestAuditSkillDirectory_Failures(t *testing.T) {
	tmpDir := t.TempDir()

	badFMDir := filepath.Join(tmpDir, "bad-fm")
	_ = os.MkdirAll(filepath.Join(badFMDir, "references"), 0755)
	_ = os.MkdirAll(filepath.Join(badFMDir, "examples"), 0755)
	_ = os.WriteFile(filepath.Join(badFMDir, "references", "ref.md"), []byte("ref"), 0644)
	_ = os.WriteFile(filepath.Join(badFMDir, "examples", "ex.md"), []byte("ex"), 0644)

	badContent := `---
name: BAD_NAME
description: Short
---
Security Checkpoint CWE-10. 429 Retry. [Link](file:///doc.md)
`
	_ = os.WriteFile(filepath.Join(badFMDir, "SKILL.md"), []byte(badContent), 0644)

	res := validator.AuditSkillDirectory(badFMDir)
	assert.False(t, res.Passed)
	assert.False(t, res.FrontmatterValid)

	t.Setenv("TEST_SRCDIR", "")
	noL3Dir := filepath.Join(tmpDir, "no-l3")
	_ = os.MkdirAll(noL3Dir, 0755)
	validContent := `---
name: no-l3
description: Valid description for no l3 skill test
license: Apache-2.0
---
Security Checkpoint CWE-10. 429 Retry. [Link](file:///doc.md)
`
	_ = os.WriteFile(filepath.Join(noL3Dir, "SKILL.md"), []byte(validContent), 0644)

	res2 := validator.AuditSkillDirectory(noL3Dir)
	assert.False(t, res2.Passed)
	assert.False(t, res2.L3TreeValid)
}

func TestParseScenario(t *testing.T) {
	content := `---
name: test-scenario
description: Verifies agent bazel invocation
prompt: "How do I build the target?"
executes: true
expected_skills:
  - bazel
threshold: 0.75
---
Expected outcome body here.
`
	sc, err := validator.ParseScenario(content, "default-sc")
	assert.NoError(t, err)
	assert.Equal(t, "test-scenario", sc.Name)
	assert.Equal(t, "Verifies agent bazel invocation", sc.Description)
	assert.Equal(t, "How do I build the target?", sc.Prompt)
	assert.True(t, sc.Executes)
	assert.Equal(t, []string{"bazel"}, sc.ExpectedSkills)
	assert.Equal(t, 0.75, sc.Threshold)
	assert.Equal(t, "Expected outcome body here.", sc.Outcome)

	// Test alias skills_applied
	aliasContent := `---
prompt: "Run tests"
executes: true
skills_applied:
  - go-test
threshold: 0.80
---
Expected test outcome
`
	sc2, err := validator.ParseScenario(aliasContent, "sc-alias")
	assert.NoError(t, err)
	assert.Equal(t, "sc-alias", sc2.Name)
	assert.Equal(t, []string{"go-test"}, sc2.ExpectedSkills)

	// Test invalid: missing prompt
	badPrompt := `---
executes: false
---
No prompt
`
	_, err = validator.ParseScenario(badPrompt, "bad")
	assert.Error(t, err)

	// Test invalid: executes true with no expected skills
	badExec := `---
prompt: "Do something"
executes: true
---
No tools specified
`
	_, err = validator.ParseScenario(badExec, "bad-exec")
	assert.Error(t, err)
}

func TestCalculateSimilarity(t *testing.T) {
	// Identical text
	sim1 := validator.CalculateSimilarity("Bazel build hermetic target", "Bazel build hermetic target")
	assert.InDelta(t, 1.0, sim1, 0.001)

	// Partial overlap
	sim2 := validator.CalculateSimilarity("Bazel build hermetic target with bzlmod", "Bazel build target")
	assert.Greater(t, sim2, 0.5)
	assert.Less(t, sim2, 1.0)

	// Disjoint
	sim3 := validator.CalculateSimilarity("apple orange banana", "car truck bicycle")
	assert.Equal(t, 0.0, sim3)

	// Empty strings
	assert.Equal(t, 1.0, validator.CalculateSimilarity("", ""))
	assert.Equal(t, 0.0, validator.CalculateSimilarity("hello", ""))
}

func TestEvaluateScenario(t *testing.T) {
	scenario := validator.ScenarioDefinition{
		Name:           "hermetic-build-test",
		Prompt:         "Build target",
		Executes:       true,
		ExpectedSkills: []string{"bazel"},
		Threshold:      0.70,
		Outcome:        "Run bazel build //target to achieve a hermetic build.",
	}

	// 1. Passing evaluation: tools invoked and output matches
	passRes := validator.EvaluateScenario(scenario, "Run bazel build //target to achieve a hermetic build.", []string{"bazel"})
	assert.True(t, passRes.Passed)
	assert.Empty(t, passRes.Errors)
	assert.GreaterOrEqual(t, passRes.SimilarityScore, 0.70)

	// 2. Failing evaluation: missing expected tool execution
	failToolRes := validator.EvaluateScenario(scenario, "Run bazel build //target to achieve a hermetic build.", []string{"python"})
	assert.False(t, failToolRes.Passed)
	assert.Contains(t, failToolRes.Errors[0], "missing expected tool/skill execution: bazel")

	// 3. Failing evaluation: low similarity
	failSimRes := validator.EvaluateScenario(scenario, "Something completely unrelated and different.", []string{"bazel"})
	assert.False(t, failSimRes.Passed)
	assert.Contains(t, failSimRes.Errors[0], "similarity score")
}

func TestAuditSkillDirectory_WithScenarios(t *testing.T) {
	tmpDir := t.TempDir()
	skillDir := filepath.Join(tmpDir, "scenario-skill")
	_ = os.MkdirAll(filepath.Join(skillDir, "references"), 0755)
	_ = os.MkdirAll(filepath.Join(skillDir, "examples"), 0755)
	_ = os.MkdirAll(filepath.Join(skillDir, "scenarios"), 0755)
	_ = os.WriteFile(filepath.Join(skillDir, "references", "ref.md"), []byte("ref"), 0644)
	_ = os.WriteFile(filepath.Join(skillDir, "examples", "ex.md"), []byte("ex"), 0644)

	skillContent := `---
name: scenario-skill
description: Skill with scenarios for testing
license: Apache-2.0
author: Tester
version: 1.0
---
Security Checkpoint CWE-20. 429 Rate Limit backoff.
[Link](file:///path/to/doc.md)
`
	_ = os.WriteFile(filepath.Join(skillDir, "SKILL.md"), []byte(skillContent), 0644)

	scenarioContent := `---
name: basic-scenario
prompt: "Test prompt"
executes: true
expected_skills:
  - test-tool
threshold: 0.75
---
Expected outcome.
`
	_ = os.WriteFile(filepath.Join(skillDir, "scenarios", "test_sc.md"), []byte(scenarioContent), 0644)

	res := validator.AuditSkillDirectory(skillDir)
	assert.True(t, res.Passed, "Errors: %v", res.Errors)
	assert.True(t, res.ScenariosValid)
	assert.Equal(t, 1, res.ScenariosCount)

	// Test invalid scenario file in scenarios/
	badScenarioContent := `---
prompt: ""
---
`
	_ = os.WriteFile(filepath.Join(skillDir, "scenarios", "bad.md"), []byte(badScenarioContent), 0644)
	resBad := validator.AuditSkillDirectory(skillDir)
	assert.False(t, resBad.Passed)
	assert.False(t, resBad.ScenariosValid)
	assert.NotEmpty(t, resBad.Errors)
}
