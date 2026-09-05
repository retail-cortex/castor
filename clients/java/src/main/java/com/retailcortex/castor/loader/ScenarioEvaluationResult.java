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

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Result of evaluating a skill scenario against an agent's execution output.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ScenarioEvaluationResult {

    @JsonProperty("scenario_name")
    private String scenarioName = "";

    private boolean passed = false;

    @JsonProperty("similarity_score")
    private double similarityScore = 0.0;

    private double threshold = 0.70;

    private boolean executed = false;

    @JsonProperty("skills_passed")
    private boolean skillsPassed = false;

    @JsonProperty("missing_skills")
    private List<String> missingSkills = new ArrayList<>();

    @JsonProperty("actual_skills")
    private List<String> actualSkills = new ArrayList<>();

    private List<String> errors = new ArrayList<>();

    public ScenarioEvaluationResult() {
    }

    public ScenarioEvaluationResult(String scenarioName, boolean passed, double similarityScore,
                                    double threshold, boolean executed, boolean skillsPassed,
                                    List<String> missingSkills, List<String> actualSkills, List<String> errors) {
        this.scenarioName = scenarioName != null ? scenarioName : "";
        this.passed = passed;
        this.similarityScore = similarityScore;
        this.threshold = threshold;
        this.executed = executed;
        this.skillsPassed = skillsPassed;
        this.missingSkills = missingSkills != null ? new ArrayList<>(missingSkills) : new ArrayList<>();
        this.actualSkills = actualSkills != null ? new ArrayList<>(actualSkills) : new ArrayList<>();
        this.errors = errors != null ? new ArrayList<>(errors) : new ArrayList<>();
    }

    public String getScenarioName() {
        return scenarioName;
    }

    public void setScenarioName(String scenarioName) {
        this.scenarioName = scenarioName;
    }

    public boolean isPassed() {
        return passed;
    }

    public void setPassed(boolean passed) {
        this.passed = passed;
    }

    public double getSimilarityScore() {
        return similarityScore;
    }

    public void setSimilarityScore(double similarityScore) {
        this.similarityScore = similarityScore;
    }

    public double getThreshold() {
        return threshold;
    }

    public void setThreshold(double threshold) {
        this.threshold = threshold;
    }

    public boolean isExecuted() {
        return executed;
    }

    public void setExecuted(boolean executed) {
        this.executed = executed;
    }

    public boolean isSkillsPassed() {
        return skillsPassed;
    }

    public void setSkillsPassed(boolean skillsPassed) {
        this.skillsPassed = skillsPassed;
    }

    public List<String> getMissingSkills() {
        return missingSkills;
    }

    public void setMissingSkills(List<String> missingSkills) {
        this.missingSkills = missingSkills != null ? new ArrayList<>(missingSkills) : new ArrayList<>();
    }

    public List<String> getActualSkills() {
        return actualSkills;
    }

    public void setActualSkills(List<String> actualSkills) {
        this.actualSkills = actualSkills != null ? new ArrayList<>(actualSkills) : new ArrayList<>();
    }

    public List<String> getErrors() {
        return errors;
    }

    public void setErrors(List<String> errors) {
        this.errors = errors != null ? new ArrayList<>(errors) : new ArrayList<>();
    }

    public Map<String, Object> toMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("scenario_name", scenarioName);
        map.put("passed", passed);
        map.put("similarity_score", similarityScore);
        map.put("threshold", threshold);
        map.put("executed", executed);
        map.put("skills_passed", skillsPassed);
        map.put("missing_skills", missingSkills);
        map.put("actual_skills", actualSkills);
        map.put("errors", errors);
        return map;
    }
}
