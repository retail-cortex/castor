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

package com.retailcortex.castor.loader;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Represents an automated verification scenario definition for an enterprise skill.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ScenarioDefinition {

    private String name = "";
    private String prompt = "";
    private boolean executes = false;

    @JsonProperty("expected_skills")
    @JsonAlias({"skills_applied"})
    private List<String> expectedSkills = new ArrayList<>();

    private double threshold = 0.70;
    private String outcome = "";
    private Map<String, String> metadata = new HashMap<>();

    public ScenarioDefinition() {
    }

    public ScenarioDefinition(String name, String prompt, boolean executes, List<String> expectedSkills,
                              double threshold, String outcome, Map<String, String> metadata) {
        this.name = name != null ? name : "";
        this.prompt = prompt != null ? prompt : "";
        this.executes = executes;
        this.expectedSkills = expectedSkills != null ? new ArrayList<>(expectedSkills) : new ArrayList<>();
        this.threshold = threshold;
        this.outcome = outcome != null ? outcome : "";
        this.metadata = metadata != null ? new HashMap<>(metadata) : new HashMap<>();
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPrompt() {
        return prompt;
    }

    public void setPrompt(String prompt) {
        this.prompt = prompt;
    }

    public boolean isExecutes() {
        return executes;
    }

    public void setExecutes(boolean executes) {
        this.executes = executes;
    }

    public List<String> getExpectedSkills() {
        return expectedSkills;
    }

    public void setExpectedSkills(List<String> expectedSkills) {
        this.expectedSkills = expectedSkills != null ? new ArrayList<>(expectedSkills) : new ArrayList<>();
    }

    /**
     * Alias for expectedSkills for backward compatibility.
     */
    public List<String> getSkillsApplied() {
        return expectedSkills;
    }

    public void setSkillsApplied(List<String> skillsApplied) {
        setExpectedSkills(skillsApplied);
    }

    public double getThreshold() {
        return threshold;
    }

    public void setThreshold(double threshold) {
        this.threshold = threshold;
    }

    public String getOutcome() {
        return outcome;
    }

    public void setOutcome(String outcome) {
        this.outcome = outcome;
    }

    public Map<String, String> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, String> metadata) {
        this.metadata = metadata != null ? new HashMap<>(metadata) : new HashMap<>();
    }

    public Map<String, Object> toMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("name", name);
        map.put("prompt", prompt);
        map.put("executes", executes);
        map.put("expected_skills", expectedSkills);
        map.put("skills_applied", expectedSkills);
        map.put("threshold", threshold);
        map.put("outcome", outcome);
        map.put("metadata", metadata);
        return map;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ScenarioDefinition that = (ScenarioDefinition) o;
        return executes == that.executes &&
                Double.compare(that.threshold, threshold) == 0 &&
                Objects.equals(name, that.name) &&
                Objects.equals(prompt, that.prompt) &&
                Objects.equals(expectedSkills, that.expectedSkills) &&
                Objects.equals(outcome, that.outcome);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name, prompt, executes, expectedSkills, threshold, outcome);
    }
}
