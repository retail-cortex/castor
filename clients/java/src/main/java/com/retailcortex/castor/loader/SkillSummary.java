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

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * High-level summary of a registered skill.
 */
public class SkillSummary {

    private String name;
    private String description;
    @JsonProperty("reference_count")
    private int referenceCount;
    @JsonProperty("example_count")
    private int exampleCount;
    @JsonProperty("scenario_count")
    private int scenarioCount;
    private String path;

    public SkillSummary() {
    }

    public SkillSummary(String name, String description, int referenceCount, int exampleCount, String path) {
        this(name, description, referenceCount, exampleCount, 0, path);
    }

    public SkillSummary(String name, String description, int referenceCount, int exampleCount, int scenarioCount, String path) {
        this.name = name;
        this.description = description;
        this.referenceCount = referenceCount;
        this.exampleCount = exampleCount;
        this.scenarioCount = scenarioCount;
        this.path = path;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public int getReferenceCount() {
        return referenceCount;
    }

    public void setReferenceCount(int referenceCount) {
        this.referenceCount = referenceCount;
    }

    public int getExampleCount() {
        return exampleCount;
    }

    public void setExampleCount(int exampleCount) {
        this.exampleCount = exampleCount;
    }

    public int getScenarioCount() {
        return scenarioCount;
    }

    public void setScenarioCount(int scenarioCount) {
        this.scenarioCount = scenarioCount;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }
}
