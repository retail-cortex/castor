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

package main

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/retail-cortex/castor/pkg/data"
	"github.com/retail-cortex/castor/pkg/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupTestRouter() (*gin.Engine, *Config) {
	gin.SetMode(gin.TestMode)
	data.ResetEngine()

	cfg := &Config{
		Host:        "localhost",
		Port:        8000,
		DatabaseURL: filepath.Join(os.TempDir(), fmt.Sprintf("skills_srv_test_%d.db", time.Now().UnixNano())),
	}

	router := SetupAppEngine(cfg)
	return router, cfg
}

func TestLoadConfig(t *testing.T) {
	t.Setenv("HOST", "127.0.0.1")
	t.Setenv("PORT", "9090")
	t.Setenv("DATABASE_URL", "test.db")
	t.Setenv("ENABLE_OPENTELEMETRY", "true")
	t.Setenv("OTEL_SERVICE_NAME", "custom-service")
	t.Setenv("GCP_PROJECT_ID", "my-gcp-project")

	cfg := LoadConfig()
	assert.Equal(t, "127.0.0.1", cfg.Host)
	assert.Equal(t, 9090, cfg.Port)
	assert.Equal(t, "test.db", cfg.DatabaseURL)
	assert.True(t, cfg.EnableOpenTelemetry)
	assert.Equal(t, "custom-service", cfg.OTELServiceName)
	assert.Equal(t, "my-gcp-project", cfg.GCPProjectID)
}

func TestHealthEndpoint(t *testing.T) {
	router, _ := setupTestRouter()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/health", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var body map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &body)
	require.NoError(t, err)
	assert.Equal(t, "ok", body["status"])
	assert.Equal(t, "castor-registry", body["service"])
}

func TestInvalidAPIKeySkillOps(t *testing.T) {
	router, _ := setupTestRouter()

	endpoints := []struct {
		method string
		url    string
	}{
		{"POST", "/api/v1/skills"},
		{"PUT", "/api/v1/skills/123"},
		{"PATCH", "/api/v1/skills/123"},
		{"DELETE", "/api/v1/skills/123"},
	}

	for _, ep := range endpoints {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest(ep.method, ep.url, bytes.NewBuffer([]byte("{}")))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-API-Key", "skm_live_invalidkey")
		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusUnauthorized, w.Code)
	}
}

func TestStartServer(t *testing.T) {
	cfg := &Config{
		Host:        "127.0.0.1",
		Port:        0,
		DatabaseURL: filepath.Join(t.TempDir(), "test_main.db"),
	}
	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()

	err := StartServer(ctx, cfg)
	assert.NoError(t, err)
}

func TestAppsAndSkillsRESTWorkflow(t *testing.T) {
	router, _ := setupTestRouter()

	// 1. Register App with X-Forwarded-Proto header
	regPayload := model.AppRegisterRequest{
		AppName: "rest-app",
		Email:   "rest@example.com",
	}
	bodyBytes, _ := json.Marshal(regPayload)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/apps/register", bytes.NewBuffer(bodyBytes))
	req.Host = "localhost:8000"
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Forwarded-Proto", "https")
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
	var appResp model.AppRegisterResponse
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &appResp))
	assert.NotEmpty(t, appResp.APIKey)
	assert.Contains(t, appResp.VerificationURL, "https://")

	// Register with TLS request connection
	regTLS := model.AppRegisterRequest{
		AppName: "tls-app",
		Email:   "tls@example.com",
	}
	tlsBytes, _ := json.Marshal(regTLS)
	w = httptest.NewRecorder()
	reqTLS, _ := http.NewRequest("POST", "/api/v1/apps/register", bytes.NewBuffer(tlsBytes))
	reqTLS.Host = "localhost:8000"
	reqTLS.TLS = &tls.ConnectionState{}
	router.ServeHTTP(w, reqTLS)
	assert.Equal(t, http.StatusCreated, w.Code)

	// Register second app
	regPayload2 := model.AppRegisterRequest{
		AppName: "rest-app-2",
		Email:   "rest2@example.com",
	}
	bBytes2, _ := json.Marshal(regPayload2)
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("POST", "/api/v1/apps/register", bytes.NewBuffer(bBytes2))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusCreated, w.Code)
	var appResp2 model.AppRegisterResponse
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &appResp2))
	wVerify2 := httptest.NewRecorder()
	reqVerify2, _ := http.NewRequest("GET", "/api/v1/apps/verify?token="+appResp2.VerificationToken, nil)
	router.ServeHTTP(wVerify2, reqVerify2)
	assert.Equal(t, http.StatusOK, wVerify2.Code)

	// Register duplicate app -> 400 Bad Request
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("POST", "/api/v1/apps/register", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)

	// Register app with invalid payload -> 400 Bad Request
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("POST", "/api/v1/apps/register", bytes.NewBuffer([]byte("invalid json")))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)

	// 2. Register skill unverified -> 403 Forbidden
	skillPayload := model.SkillCreateRequest{
		Name:         "rest-skill",
		Description:  "REST test skill",
		Instructions: "Follow instructions",
	}
	sBytes, _ := json.Marshal(skillPayload)

	w = httptest.NewRecorder()
	req, _ = http.NewRequest("POST", "/api/v1/skills", bytes.NewBuffer(sBytes))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", appResp.APIKey)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code)

	// Unverified app on PUT -> 403 Forbidden
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("PUT", "/api/v1/skills/some-id", bytes.NewBuffer(sBytes))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", appResp.APIKey)
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusForbidden, w.Code)

	// Unverified app on PATCH -> 403 Forbidden
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("PATCH", "/api/v1/skills/some-id", bytes.NewBuffer(sBytes))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", appResp.APIKey)
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusForbidden, w.Code)

	// Unverified app on DELETE -> 403 Forbidden
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("DELETE", "/api/v1/skills/some-id", nil)
	req.Header.Set("X-API-Key", appResp.APIKey)
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusForbidden, w.Code)

	// Missing API Key -> 401 Unauthorized
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("POST", "/api/v1/skills", bytes.NewBuffer(sBytes))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)

	// Verify App missing token -> 400 Bad Request
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/api/v1/apps/verify", nil)
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)

	// Verify App invalid token -> 404 Not Found
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/api/v1/apps/verify?token=invalid", nil)
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusNotFound, w.Code)

	// 3. Verify App 1
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/api/v1/apps/verify?token="+appResp.VerificationToken, nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	// Register skill with invalid body -> 400 Bad Request
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("POST", "/api/v1/skills", bytes.NewBuffer([]byte("{bad}")))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", appResp.APIKey)
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)

	// 4. Register skill verified -> 201 Created
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("POST", "/api/v1/skills", bytes.NewBuffer(sBytes))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", appResp.APIKey)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
	var skillResp model.SkillResponse
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &skillResp))
	assert.Equal(t, "rest-skill", skillResp.Name)

	// 5. List Skills
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/api/v1/skills?s=rest&page=1&page_size=5", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "1", w.Header().Get("X-Total-Count"))
	assert.Equal(t, "1", w.Header().Get("X-Page"))
	assert.Equal(t, "5", w.Header().Get("X-Page-Size"))
	assert.Equal(t, "1", w.Header().Get("X-Total-Pages"))
	var listResp []model.SkillResponse
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &listResp))
	assert.Len(t, listResp, 1)

	// List Skills with envelope format
	wEnv := httptest.NewRecorder()
	reqEnv, _ := http.NewRequest("GET", "/api/v1/skills?s=rest&envelope=true", nil)
	router.ServeHTTP(wEnv, reqEnv)
	assert.Equal(t, http.StatusOK, wEnv.Code)
	var envResp model.PaginatedSkillResponse
	require.NoError(t, json.Unmarshal(wEnv.Body.Bytes(), &envResp))
	assert.Equal(t, int64(1), envResp.TotalCount)
	assert.Len(t, envResp.Items, 1)

	// 6. Get Skill by ID
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/api/v1/skills/"+skillResp.ID, nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	// Get non-existent skill -> 404 Not Found
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/api/v1/skills/non-existent", nil)
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusNotFound, w.Code)

	// 7. PUT Replace Skill (unauthorized app 2 -> 403 Forbidden)
	newDesc := "Replaced description"
	updBytes, _ := json.Marshal(model.SkillUpdateRequest{Description: &newDesc})

	w = httptest.NewRecorder()
	req, _ = http.NewRequest("PUT", "/api/v1/skills/"+skillResp.ID, bytes.NewBuffer(updBytes))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", appResp2.APIKey)
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusForbidden, w.Code)

	// PUT Replace Skill (authorized app 1 -> 200 OK)
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("PUT", "/api/v1/skills/"+skillResp.ID, bytes.NewBuffer(updBytes))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", appResp.APIKey)
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	// Replace non-existent skill -> 404 Not Found
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("PUT", "/api/v1/skills/non-existent", bytes.NewBuffer(updBytes))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", appResp.APIKey)
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusNotFound, w.Code)

	// Replace skill invalid payload -> 400 Bad Request
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("PUT", "/api/v1/skills/"+skillResp.ID, bytes.NewBuffer([]byte("{invalid}")))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", appResp.APIKey)
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)

	// 8. PATCH Update Skill (unauthorized app 2 -> 403 Forbidden)
	patchDesc := "Patched description"
	patchBytes, _ := json.Marshal(model.SkillUpdateRequest{Description: &patchDesc})

	w = httptest.NewRecorder()
	req, _ = http.NewRequest("PATCH", "/api/v1/skills/"+skillResp.ID, bytes.NewBuffer(patchBytes))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", appResp2.APIKey)
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusForbidden, w.Code)

	// PATCH Update Skill (authorized app 1 -> 200 OK)
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("PATCH", "/api/v1/skills/"+skillResp.ID, bytes.NewBuffer(patchBytes))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", appResp.APIKey)
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	// Patch non-existent skill -> 404 Not Found
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("PATCH", "/api/v1/skills/non-existent", bytes.NewBuffer(patchBytes))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", appResp.APIKey)
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusNotFound, w.Code)

	// Patch skill invalid payload -> 400 Bad Request
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("PATCH", "/api/v1/skills/"+skillResp.ID, bytes.NewBuffer([]byte("{invalid}")))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", appResp.APIKey)
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)

	// 9. Delete Skill (unauthorized app 2 -> 403 Forbidden)
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("DELETE", "/api/v1/skills/"+skillResp.ID, nil)
	req.Header.Set("X-API-Key", appResp2.APIKey)
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusForbidden, w.Code)

	// Delete non-existent skill -> 404 Not Found
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("DELETE", "/api/v1/skills/non-existent", nil)
	req.Header.Set("X-API-Key", appResp.APIKey)
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusNotFound, w.Code)

	// 10. Delete Skill
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("DELETE", "/api/v1/skills/"+skillResp.ID, nil)
	req.Header.Set("X-API-Key", appResp.APIKey)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestRBACCollaboratorsAndScopedKeysREST(t *testing.T) {
	router, _ := setupTestRouter()

	// 1. Register App
	regPayload := model.AppRegisterRequest{
		AppName: "rbac-app",
		Domain:  "enterprise.com",
		Email:   "owner@enterprise.com",
	}
	body, _ := json.Marshal(regPayload)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/apps/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)
	require.Equal(t, http.StatusCreated, w.Code)

	var appResp model.AppRegisterResponse
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &appResp))

	// Verify App
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/api/v1/apps/verify?token="+appResp.VerificationToken, nil)
	router.ServeHTTP(w, req)
	require.Equal(t, http.StatusOK, w.Code)

	// 2. List Members (Owner only)
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/api/v1/apps/members", nil)
	req.Header.Set("X-API-Key", appResp.APIKey)
	router.ServeHTTP(w, req)
	require.Equal(t, http.StatusOK, w.Code)

	var members []model.AppMember
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &members))
	require.Len(t, members, 1)
	assert.Equal(t, "owner@enterprise.com", members[0].Email)
	assert.Equal(t, model.RoleOwner, members[0].Role)

	// 3. Invite Editor & Viewer
	inviteEditorReq := model.MemberInviteRequest{
		Email: "editor@enterprise.com",
		Role:  model.RoleEditor,
	}
	invBody, _ := json.Marshal(inviteEditorReq)
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("POST", "/api/v1/apps/members/invite", bytes.NewBuffer(invBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", appResp.APIKey)
	router.ServeHTTP(w, req)
	require.Equal(t, http.StatusCreated, w.Code)

	var editorInvite model.MemberInviteResponse
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &editorInvite))
	assert.Equal(t, "editor@enterprise.com", editorInvite.Email)
	assert.Equal(t, model.RoleEditor, editorInvite.Role)

	// Accept Editor Invitation
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/api/v1/apps/members/accept?token="+editorInvite.InvitationToken, nil)
	router.ServeHTTP(w, req)
	require.Equal(t, http.StatusOK, w.Code)

	// 4. Create Scoped API Keys
	// Create Editor API Key
	createKeyReq := model.CreateAPIKeyRequest{
		Name:          "Editor Deployment Key",
		Role:          model.RoleEditor,
		ExpiresInDays: 30,
	}
	keyBody, _ := json.Marshal(createKeyReq)
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("POST", "/api/v1/apps/keys", bytes.NewBuffer(keyBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", appResp.APIKey)
	router.ServeHTTP(w, req)
	require.Equal(t, http.StatusCreated, w.Code)

	var editorKeyResp model.CreateAPIKeyResponse
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &editorKeyResp))
	assert.NotEmpty(t, editorKeyResp.APIKey)
	assert.Equal(t, model.RoleEditor, editorKeyResp.Role)

	// Create Viewer API Key
	createViewerKeyReq := model.CreateAPIKeyRequest{
		Name:          "Viewer Analytics Key",
		Role:          model.RoleViewer,
		ExpiresInDays: 30,
	}
	vKeyBody, _ := json.Marshal(createViewerKeyReq)
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("POST", "/api/v1/apps/keys", bytes.NewBuffer(vKeyBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", appResp.APIKey)
	router.ServeHTTP(w, req)
	require.Equal(t, http.StatusCreated, w.Code)

	var viewerKeyResp model.CreateAPIKeyResponse
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &viewerKeyResp))

	// 5. Test RBAC Permissions on Skill Operations
	// Editor creates skill -> 201 Created
	skillCreateReq := model.SkillCreateRequest{
		Name:         "rbac-skill",
		Description:  "Skill testing RBAC",
		Instructions: "Ensure permission gates work",
	}
	skillBody, _ := json.Marshal(skillCreateReq)
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("POST", "/api/v1/skills", bytes.NewBuffer(skillBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", editorKeyResp.APIKey)
	router.ServeHTTP(w, req)
	require.Equal(t, http.StatusCreated, w.Code)

	var createdSkill model.SkillResponse
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &createdSkill))

	// Viewer can read skill -> 200 OK
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/api/v1/skills/"+createdSkill.ID, nil)
	router.ServeHTTP(w, req)
	require.Equal(t, http.StatusOK, w.Code)

	// Viewer tries to mutate skill -> 403 Forbidden
	newDesc := "Viewer modification"
	updBody, _ := json.Marshal(model.SkillUpdateRequest{Description: &newDesc})
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("PATCH", "/api/v1/skills/"+createdSkill.ID, bytes.NewBuffer(updBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", viewerKeyResp.APIKey)
	router.ServeHTTP(w, req)
	require.Equal(t, http.StatusForbidden, w.Code)

	// Viewer tries to delete skill -> 403 Forbidden
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("DELETE", "/api/v1/skills/"+createdSkill.ID, nil)
	req.Header.Set("X-API-Key", viewerKeyResp.APIKey)
	router.ServeHTTP(w, req)
	require.Equal(t, http.StatusForbidden, w.Code)

	// 6. Revoke Viewer Key
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("DELETE", "/api/v1/apps/keys/"+viewerKeyResp.ID, nil)
	req.Header.Set("X-API-Key", appResp.APIKey)
	router.ServeHTTP(w, req)
	require.Equal(t, http.StatusOK, w.Code)

	// Revoked key fails authentication -> 401 Unauthorized
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("PATCH", "/api/v1/skills/"+createdSkill.ID, bytes.NewBuffer(updBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", viewerKeyResp.APIKey)
	router.ServeHTTP(w, req)
	require.Equal(t, http.StatusUnauthorized, w.Code)
}

func makeOAuthTestJWT(claims map[string]interface{}) string {
	headerJSON, _ := json.Marshal(map[string]string{"alg": "none", "typ": "JWT"})
	payloadJSON, _ := json.Marshal(claims)

	headerB64 := base64.RawURLEncoding.EncodeToString(headerJSON)
	payloadB64 := base64.RawURLEncoding.EncodeToString(payloadJSON)

	return headerB64 + "." + payloadB64 + ".sig"
}

func TestOAuthRegistration_ValidToken_ImmediateKeyUsability(t *testing.T) {
	router, _ := setupTestRouter()

	updatedAtEpoch := int64(1710000000)
	claims := map[string]interface{}{
		"sub":                "google-oauth2|1092837465",
		"email":              "alex.developer@enterprise.com",
		"email_verified":     true,
		"name":               "Alex Developer",
		"given_name":         "Alex",
		"family_name":        "Developer",
		"preferred_username": "alexdev",
		"picture":            "https://enterprise.com/photos/alex.jpg",
		"updated_at":         updatedAtEpoch,
		"exp":                time.Now().Add(1 * time.Hour).Unix(),
	}
	token := makeOAuthTestJWT(claims)

	regReq := model.AppRegisterRequest{
		AppName: "oauth-service-app",
		Domain:  "enterprise.com",
	}
	bodyBytes, _ := json.Marshal(regReq)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/apps/register", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	require.Equal(t, http.StatusCreated, w.Code)

	var appResp model.AppRegisterResponse
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &appResp))
	assert.NotEmpty(t, appResp.AppID)
	assert.Equal(t, "alex.developer@enterprise.com", appResp.Email)
	assert.True(t, appResp.IsActive, "App should be immediately active upon OAuth registration")
	assert.NotEmpty(t, appResp.APIKey)

	// Verify profile attributes in response
	require.NotNil(t, appResp.MemberProfile)
	assert.Equal(t, "Alex Developer", appResp.MemberProfile.Name)
	assert.Equal(t, "Alex", appResp.MemberProfile.GivenName)
	assert.Equal(t, "Developer", appResp.MemberProfile.FamilyName)
	assert.Equal(t, "alexdev", appResp.MemberProfile.PreferredUsername)
	assert.Equal(t, "https://enterprise.com/photos/alex.jpg", appResp.MemberProfile.Picture)
	require.NotNil(t, appResp.MemberProfile.UpdatedAt)
	assert.Equal(t, time.Unix(updatedAtEpoch, 0).UTC(), *appResp.MemberProfile.UpdatedAt)

	// Verify database record in app_members captures all profile attributes
	db := data.GetDB()
	var member model.AppMember
	err := db.Where("app_id = ? AND email = ?", appResp.AppID, "alex.developer@enterprise.com").First(&member).Error
	require.NoError(t, err)
	assert.Equal(t, "Alex Developer", member.Name)
	assert.Equal(t, "Developer", member.FamilyName)
	assert.Equal(t, "Alex", member.GivenName)
	assert.Equal(t, "alexdev", member.PreferredUsername)
	assert.Equal(t, "https://enterprise.com/photos/alex.jpg", member.Picture)
	assert.Equal(t, "google-oauth2|1092837465", member.OAuthSub)
	require.NotNil(t, member.ProfileUpdatedAt)
	assert.Equal(t, updatedAtEpoch, member.ProfileUpdatedAt.Unix())

	// CRITICAL REQUIREMENT: Verify issued API key is immediately active and usable
	// without needing to call /api/v1/apps/verify!
	skillPayload := model.SkillCreateRequest{
		Name:         "oauth-created-skill",
		Description:  "Created immediately using issued API key",
		Instructions: "Follow oauth instructions",
	}
	sBytes, _ := json.Marshal(skillPayload)

	wSkill := httptest.NewRecorder()
	reqSkill, _ := http.NewRequest("POST", "/api/v1/skills", bytes.NewBuffer(sBytes))
	reqSkill.Header.Set("Content-Type", "application/json")
	reqSkill.Header.Set("X-API-Key", appResp.APIKey)
	router.ServeHTTP(wSkill, reqSkill)

	require.Equal(t, http.StatusCreated, wSkill.Code, "Issued API key must be immediately usable on protected endpoints")
	var skillResp model.SkillResponse
	require.NoError(t, json.Unmarshal(wSkill.Body.Bytes(), &skillResp))
	assert.Equal(t, "oauth-created-skill", skillResp.Name)
}

func TestOAuthRegistration_PayloadToken(t *testing.T) {
	router, _ := setupTestRouter()

	claims := map[string]interface{}{
		"sub":                "sub-payload-888",
		"email":              "payload.user@enterprise.com",
		"name":               "Payload User",
		"given_name":         "Payload",
		"family_name":        "User",
		"preferred_username": "payloadu",
		"picture":            "https://enterprise.com/p.jpg",
		"exp":                time.Now().Add(1 * time.Hour).Unix(),
	}
	token := makeOAuthTestJWT(claims)

	regReq := model.AppRegisterRequest{
		AppName:    "payload-token-app",
		Domain:     "enterprise.com",
		OAuthToken: token,
	}
	bodyBytes, _ := json.Marshal(regReq)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/apps/register", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	require.Equal(t, http.StatusCreated, w.Code)
	var appResp model.AppRegisterResponse
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &appResp))
	assert.True(t, appResp.IsActive)
	assert.Equal(t, "payload.user@enterprise.com", appResp.Email)
	require.NotNil(t, appResp.MemberProfile)
	assert.Equal(t, "Payload User", appResp.MemberProfile.Name)
}

func TestOAuthRegistration_RequireOAuth_Enforcement(t *testing.T) {
	gin.SetMode(gin.TestMode)
	data.ResetEngine()

	cfg := &Config{
		Host:         "localhost",
		Port:         8000,
		DatabaseURL:  filepath.Join(os.TempDir(), fmt.Sprintf("oauth_strict_%d.db", time.Now().UnixNano())),
		RequireOAuth: true,
	}
	router := SetupAppEngine(cfg)

	// 1. Unauthenticated registration attempt -> 401 Unauthorized
	unauthReq := model.AppRegisterRequest{
		AppName: "unauth-app",
		Email:   "dev@corp.com",
	}
	uBytes, _ := json.Marshal(unauthReq)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/apps/register", bytes.NewBuffer(uBytes))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)

	// 2. Expired OAuth token -> 401 Unauthorized
	expiredClaims := map[string]interface{}{
		"sub":   "sub-exp",
		"email": "dev@corp.com",
		"exp":   time.Now().Add(-1 * time.Hour).Unix(),
	}
	expToken := makeOAuthTestJWT(expiredClaims)

	w = httptest.NewRecorder()
	req, _ = http.NewRequest("POST", "/api/v1/apps/register", bytes.NewBuffer(uBytes))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+expToken)
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)

	// 3. Valid OAuth token -> 201 Created and immediate key usability
	validClaims := map[string]interface{}{
		"sub":                "sub-valid",
		"email":              "dev@corp.com",
		"name":               "Strict Dev",
		"family_name":        "Dev",
		"given_name":         "Strict",
		"preferred_username": "strictdev",
		"picture":            "https://corp.com/pic.png",
		"exp":                time.Now().Add(1 * time.Hour).Unix(),
	}
	validToken := makeOAuthTestJWT(validClaims)

	w = httptest.NewRecorder()
	req, _ = http.NewRequest("POST", "/api/v1/apps/register", bytes.NewBuffer(uBytes))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+validToken)
	router.ServeHTTP(w, req)
	require.Equal(t, http.StatusCreated, w.Code)

	var appResp model.AppRegisterResponse
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &appResp))
	assert.True(t, appResp.IsActive)
	assert.NotEmpty(t, appResp.APIKey)
}
