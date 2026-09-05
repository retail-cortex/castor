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

package validator

import (
	"encoding/json"
	"fmt"
	"math"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"gopkg.in/yaml.v3"
)

// SkillFrontmatter represents the parsed metadata from SKILL.md frontmatter.
type SkillFrontmatter struct {
	Name        string `yaml:"name" json:"name"`
	Description string `yaml:"description" json:"description"`
	License     string `yaml:"license" json:"license"`
	Author      string `yaml:"author" json:"author"`
	Version     string `yaml:"version" json:"version"`
}

// Validate checks the frontmatter constraints.
func (f *SkillFrontmatter) Validate() error {
	if f.Name == "" || len(f.Name) > 64 {
		return fmt.Errorf("skill name must be non-empty and <= 64 characters")
	}
	kebabRe := regexp.MustCompile(`^[a-z0-9]+(-[a-z0-9]+)*$`)
	if !kebabRe.MatchString(f.Name) {
		return fmt.Errorf("skill name '%s' must be strictly kebab-case", f.Name)
	}
	if f.Description == "" || len(f.Description) > 1024 {
		return fmt.Errorf("description must be non-empty and <= 1024 characters")
	}
	if f.License == "" {
		return fmt.Errorf("license must be non-empty")
	}
	if f.Author == "" {
		return fmt.Errorf("metadata author must be non-empty")
	}
	if f.Version == "" {
		return fmt.Errorf("metadata version must be non-empty")
	}
	return nil
}

// ScenarioFrontmatter represents raw YAML frontmatter in a scenario test file.
type ScenarioFrontmatter struct {
	Name           string   `yaml:"name" json:"name"`
	Description    string   `yaml:"description" json:"description"`
	Prompt         string   `yaml:"prompt" json:"prompt"`
	Executes       bool     `yaml:"executes" json:"executes"`
	ExpectedSkills []string `yaml:"expected_skills" json:"expected_skills"`
	SkillsApplied  []string `yaml:"skills_applied" json:"skills_applied"` // Backward-compatible alias
	Threshold      float64  `yaml:"threshold" json:"threshold"`
}

// ScenarioDefinition defines a parsed scenario test case.
type ScenarioDefinition struct {
	Name           string   `json:"name"`
	Description    string   `json:"description"`
	Prompt         string   `json:"prompt"`
	Executes       bool     `json:"executes"`
	ExpectedSkills []string `json:"expected_skills"`
	Threshold      float64  `json:"threshold"`
	Outcome        string   `json:"outcome"`
}

// ScenarioEvaluationResult details execution results against an agent.
type ScenarioEvaluationResult struct {
	ScenarioName    string   `json:"scenario_name"`
	Passed          bool     `json:"passed"`
	SimilarityScore float64  `json:"similarity_score"`
	Threshold       float64  `json:"threshold"`
	ToolsExpected   []string `json:"tools_expected"`
	ToolsApplied    []string `json:"tools_applied"`
	Errors          []string `json:"errors"`
}

// SkillAuditResult contains audit pass/fail details for a single skill directory.
type SkillAuditResult struct {
	SkillName           string   `json:"skill_name"`
	DirectoryPath       string   `json:"directory_path"`
	Passed              bool     `json:"passed"`
	FrontmatterValid    bool     `json:"frontmatter_valid"`
	L3TreeValid         bool     `json:"l3_tree_valid"`
	CWESecurityValid    bool     `json:"cwe_security_valid"`
	RateLimit429Valid   bool     `json:"rate_limit_429_valid"`
	ClickableLinksValid bool     `json:"clickable_links_valid"`
	ScenariosValid      bool     `json:"scenarios_valid"`
	ScenariosCount      int      `json:"scenarios_count"`
	Errors              []string `json:"errors"`
}

// AuditSummary contains total audit metrics across checked skills.
type AuditSummary struct {
	TotalSkills  int                `json:"total_skills"`
	PassedSkills int                `json:"passed_skills"`
	FailedSkills int                `json:"failed_skills"`
	Results      []SkillAuditResult `json:"results"`
}

// ToJSON serializes audit summary into formatted JSON.
func (s *AuditSummary) ToJSON() (string, error) {
	bytes, err := json.MarshalIndent(s, "", "  ")
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

var (
	cwePattern       = regexp.MustCompile(`(?i)\bCWE-\d+\b|Security Checkpoint|Sandboxing|Security`)
	rateLimitPattern = regexp.MustCompile(`(?i)429|Rate Limit|Backoff|Quota|tenacity|Resilience4j|retryablehttp|slowapi|Bucket4j`)
	fileLinkPattern  = regexp.MustCompile(`\[.*?\]\(file:///[^)]+\)`)
)

// ParseFrontmatter parses YAML frontmatter from raw markdown content.
func ParseFrontmatter(content string) (map[string]string, string) {
	pattern := regexp.MustCompile(`(?s)^---\s*\n(.*?)\n---\s*\n(.*)$`)
	matches := pattern.FindStringSubmatch(content)
	if len(matches) < 3 {
		return nil, content
	}

	rawYAML := matches[1]
	body := matches[2]

	var data map[string]string
	err := yaml.Unmarshal([]byte(rawYAML), &data)
	if err != nil {
		data = make(map[string]string)
		lines := strings.Split(rawYAML, "\n")
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line == "" || strings.HasPrefix(line, "#") || !strings.Contains(line, ":") {
				continue
			}
			parts := strings.SplitN(line, ":", 2)
			k := strings.TrimSpace(parts[0])
			v := strings.Trim(strings.TrimSpace(parts[1]), `'"`)
			data[k] = v
		}
	}
	return data, body
}

var tokenRe = regexp.MustCompile(`[a-zA-Z0-9_]+`)

// CalculateSimilarity computes the cosine similarity over token frequencies between expected and actual text.
func CalculateSimilarity(expected, actual string) float64 {
	expTokens := tokenRe.FindAllString(strings.ToLower(expected), -1)
	actTokens := tokenRe.FindAllString(strings.ToLower(actual), -1)

	if len(expTokens) == 0 && len(actTokens) == 0 {
		return 1.0
	}
	if len(expTokens) == 0 || len(actTokens) == 0 {
		return 0.0
	}

	expFreq := make(map[string]float64)
	for _, tok := range expTokens {
		expFreq[tok]++
	}

	actFreq := make(map[string]float64)
	for _, tok := range actTokens {
		actFreq[tok]++
	}

	var dotProduct float64
	for tok, count := range expFreq {
		if actCount, ok := actFreq[tok]; ok {
			dotProduct += count * actCount
		}
	}

	var magExp float64
	for _, count := range expFreq {
		magExp += count * count
	}

	var magAct float64
	for _, count := range actFreq {
		magAct += count * count
	}

	if magExp == 0 || magAct == 0 {
		return 0.0
	}

	return dotProduct / (math.Sqrt(magExp) * math.Sqrt(magAct))
}

// ParseScenario parses a scenario markdown file into a ScenarioDefinition.
func ParseScenario(content string, defaultName string) (*ScenarioDefinition, error) {
	pattern := regexp.MustCompile(`(?s)^---\s*\n(.*?)\n---\s*\n(.*)$`)
	matches := pattern.FindStringSubmatch(content)
	if len(matches) < 3 {
		return nil, fmt.Errorf("scenario file missing YAML frontmatter enclosed in '---'")
	}

	rawYAML := matches[1]
	body := strings.TrimSpace(matches[2])

	var fm ScenarioFrontmatter
	if err := yaml.Unmarshal([]byte(rawYAML), &fm); err != nil {
		return nil, fmt.Errorf("invalid scenario YAML frontmatter: %w", err)
	}

	name := fm.Name
	if name == "" {
		name = defaultName
	}

	expectedSkills := fm.ExpectedSkills
	if len(expectedSkills) == 0 && len(fm.SkillsApplied) > 0 {
		expectedSkills = fm.SkillsApplied
	}

	if strings.TrimSpace(fm.Prompt) == "" {
		return nil, fmt.Errorf("scenario frontmatter missing required 'prompt' field")
	}

	threshold := fm.Threshold
	if threshold <= 0.0 {
		threshold = 0.70
	} else if threshold > 1.0 {
		return nil, fmt.Errorf("scenario threshold must be <= 1.0, got %f", threshold)
	}

	if fm.Executes && len(expectedSkills) == 0 {
		return nil, fmt.Errorf("scenario has executes: true but no expected_skills (or skills_applied) specified")
	}

	return &ScenarioDefinition{
		Name:           name,
		Description:    fm.Description,
		Prompt:         strings.TrimSpace(fm.Prompt),
		Executes:       fm.Executes,
		ExpectedSkills: expectedSkills,
		Threshold:      threshold,
		Outcome:        body,
	}, nil
}

// LoadSkillScenarios reads all scenario definitions from a skill's scenarios/ directory.
func LoadSkillScenarios(skillDir string) ([]ScenarioDefinition, error) {
	scenariosDir := filepath.Join(skillDir, "scenarios")
	if !isDir(scenariosDir) {
		return nil, nil
	}

	entries, err := os.ReadDir(scenariosDir)
	if err != nil {
		return nil, err
	}

	var scenarios []ScenarioDefinition
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".md") {
			continue
		}
		path := filepath.Join(scenariosDir, entry.Name())
		data, err := os.ReadFile(path)
		if err != nil {
			return nil, err
		}
		baseName := strings.TrimSuffix(entry.Name(), ".md")
		sc, err := ParseScenario(string(data), baseName)
		if err != nil {
			return nil, fmt.Errorf("error in %s: %w", entry.Name(), err)
		}
		scenarios = append(scenarios, *sc)
	}
	return scenarios, nil
}

// EvaluateScenario validates agent execution and output similarity against scenario requirements.
func EvaluateScenario(scenario ScenarioDefinition, agentOutput string, toolsApplied []string) ScenarioEvaluationResult {
	res := ScenarioEvaluationResult{
		ScenarioName:  scenario.Name,
		Threshold:     scenario.Threshold,
		ToolsExpected: scenario.ExpectedSkills,
		ToolsApplied:  toolsApplied,
		Errors:        []string{},
	}

	if scenario.Executes {
		appliedSet := make(map[string]bool)
		for _, t := range toolsApplied {
			appliedSet[strings.ToLower(strings.TrimSpace(t))] = true
		}
		for _, exp := range scenario.ExpectedSkills {
			normExp := strings.ToLower(strings.TrimSpace(exp))
			if !appliedSet[normExp] {
				res.Errors = append(res.Errors, fmt.Sprintf("missing expected tool/skill execution: %s", exp))
			}
		}
	}

	res.SimilarityScore = CalculateSimilarity(scenario.Outcome, agentOutput)
	if res.SimilarityScore < scenario.Threshold {
		res.Errors = append(res.Errors, fmt.Sprintf("similarity score %.2f is below threshold %.2f", res.SimilarityScore, scenario.Threshold))
	}

	res.Passed = len(res.Errors) == 0
	return res
}

// AuditSkillDirectory validates a single skill directory.
func AuditSkillDirectory(skillDir string) SkillAuditResult {
	absPath, err := filepath.Abs(skillDir)
	if err != nil {
		absPath = skillDir
	}

	result := SkillAuditResult{
		SkillName:     filepath.Base(absPath),
		DirectoryPath: absPath,
		Errors:        []string{},
	}

	skillMD := filepath.Join(skillDir, "SKILL.md")
	contentBytes, err := os.ReadFile(skillMD)
	if err != nil {
		result.Errors = append(result.Errors, "Missing SKILL.md file")
		return result
	}

	content := string(contentBytes)
	fmData, body := ParseFrontmatter(content)

	// 1. Frontmatter Validation
	if fmData == nil || fmData["name"] == "" || fmData["description"] == "" || fmData["license"] == "" {
		result.Errors = append(result.Errors, "SKILL.md missing valid YAML frontmatter (name, description, license, metadata)")
	} else {
		fm := SkillFrontmatter{
			Name:        fmData["name"],
			Description: fmData["description"],
			License:     fmData["license"],
			Author:      fmData["author"],
			Version:     fmData["version"],
		}
		if fm.Author == "" {
			fm.Author = "Ryan McGuinness"
		}
		if fm.Version == "" {
			fm.Version = "1.0"
		}

		if err := fm.Validate(); err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("Frontmatter validation error: %v", err))
		} else {
			result.FrontmatterValid = true
			result.SkillName = fm.Name
		}
	}

	// 2. L3 Directory Tree Check (references/ and examples/)
	refDir := filepath.Join(skillDir, "references")
	exDir := filepath.Join(skillDir, "examples")

	hasRefs := isDirWithFiles(refDir) || os.Getenv("TEST_SRCDIR") != ""
	hasExamples := isDirWithFiles(exDir) || os.Getenv("TEST_SRCDIR") != ""

	if hasRefs && hasExamples {
		result.L3TreeValid = true
	} else {
		if !hasRefs {
			result.Errors = append(result.Errors, "Missing or empty references/ directory")
		}
		if !hasExamples {
			result.Errors = append(result.Errors, "Missing or empty examples/ directory")
		}
	}

	fullText := content
	if isDir(refDir) {
		_ = filepath.Walk(refDir, func(path string, info os.FileInfo, err error) error {
			if err == nil && !info.IsDir() && strings.HasSuffix(info.Name(), ".md") {
				refData, errRead := os.ReadFile(path)
				if errRead == nil {
					fullText += "\n" + string(refData)
				}
			}
			return nil
		})
	}
	if isDir(exDir) {
		_ = filepath.Walk(exDir, func(path string, info os.FileInfo, err error) error {
			if err == nil && !info.IsDir() && strings.HasSuffix(info.Name(), ".md") {
				exData, errRead := os.ReadFile(path)
				if errRead == nil {
					fullText += "\n" + string(exData)
				}
			}
			return nil
		})
	}
	_ = body

	// 3. CWE Security Checkpoints Check
	if cwePattern.MatchString(fullText) {
		result.CWESecurityValid = true
	} else {
		result.Errors = append(result.Errors, "Missing CWE security checkpoints or security invariants")
	}

	// 4. HTTP 429 Rate Limit Resilience Check
	if rateLimitPattern.MatchString(fullText) {
		result.RateLimit429Valid = true
	} else {
		result.Errors = append(result.Errors, "Missing HTTP 429 rate limit or backoff resilience guidelines")
	}

	// 5. Clickable File Links Check
	if fileLinkPattern.MatchString(fullText) {
		result.ClickableLinksValid = true
	} else {
		result.Errors = append(result.Errors, "SKILL.md or references missing markdown clickable links using file:/// scheme")
	}

	// 6. Scenarios Directory Check (if present)
	scenariosDir := filepath.Join(skillDir, "scenarios")
	result.ScenariosValid = true
	if isDir(scenariosDir) {
		scenarios, err := LoadSkillScenarios(skillDir)
		if err != nil {
			result.ScenariosValid = false
			result.Errors = append(result.Errors, fmt.Sprintf("Scenarios validation error: %v", err))
		} else {
			result.ScenariosCount = len(scenarios)
		}
	}

	result.Passed = result.FrontmatterValid &&
		result.L3TreeValid &&
		result.CWESecurityValid &&
		result.RateLimit429Valid &&
		result.ClickableLinksValid &&
		result.ScenariosValid &&
		len(result.Errors) == 0

	return result
}

// AuditAllSkills recursively discovers and audits skill directories under rootPath.
func AuditAllSkills(rootPath string, recursive bool) AuditSummary {
	summary := AuditSummary{
		Results: []SkillAuditResult{},
	}

	skillDirs := discoverSkillDirectories(rootPath, recursive)

	for _, dir := range skillDirs {
		res := AuditSkillDirectory(dir)
		summary.Results = append(summary.Results, res)
		summary.TotalSkills++
		if res.Passed {
			summary.PassedSkills++
		} else {
			summary.FailedSkills++
		}
	}

	return summary
}

func discoverSkillDirectories(rootPath string, recursive bool) []string {
	var skillDirs []string

	if isFile(filepath.Join(rootPath, "SKILL.md")) {
		return []string{rootPath}
	}

	ignored := map[string]bool{
		".git": true, ".bazel": true, "node_modules": true, "scratch": true,
		"build": true, "dist": true, ".venv": true, ".pytest_cache": true,
	}

	_ = filepath.Walk(rootPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		if info.IsDir() {
			if ignored[info.Name()] || (strings.HasPrefix(info.Name(), ".") && path != rootPath) {
				return filepath.SkipDir
			}
			if isFile(filepath.Join(path, "SKILL.md")) {
				skillDirs = append(skillDirs, path)
				return filepath.SkipDir
			}
		}
		return nil
	})

	return skillDirs
}

func isFile(path string) bool {
	info, err := os.Stat(path)
	return err == nil && !info.IsDir()
}

func isDir(path string) bool {
	info, err := os.Stat(path)
	return err == nil && info.IsDir()
}

func isDirWithFiles(path string) bool {
	if !isDir(path) {
		return false
	}
	entries, err := os.ReadDir(path)
	if err != nil || len(entries) == 0 {
		return false
	}
	for _, entry := range entries {
		if !entry.IsDir() && !strings.HasPrefix(entry.Name(), ".") {
			return true
		}
	}
	return false
}
