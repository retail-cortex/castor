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

package auth_test

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/retail-cortex/castor/pkg/auth"
	"github.com/retail-cortex/castor/pkg/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func createTestJWT(claims map[string]interface{}) string {
	headerJSON, _ := json.Marshal(map[string]string{"alg": "none", "typ": "JWT"})
	payloadJSON, _ := json.Marshal(claims)

	headerB64 := base64.RawURLEncoding.EncodeToString(headerJSON)
	payloadB64 := base64.RawURLEncoding.EncodeToString(payloadJSON)

	return headerB64 + "." + payloadB64 + ".sig"
}

func TestOIDCTokenValidator_ValidJWT(t *testing.T) {
	updatedAtEpoch := int64(1700000000)
	claims := map[string]interface{}{
		"sub":                "auth0|123456789",
		"email":              "developer@company.com",
		"email_verified":     true,
		"name":               "Jane Doe",
		"given_name":         "Jane",
		"family_name":        "Doe",
		"preferred_username": "jdoe",
		"picture":            "https://cdn.example.com/avatars/jdoe.png",
		"updated_at":         updatedAtEpoch,
		"iss":                "https://issuer.example.com/",
		"aud":                "castor-client",
		"exp":                time.Now().Add(1 * time.Hour).Unix(),
	}

	token := createTestJWT(claims)
	validator := auth.NewOIDCTokenValidator(auth.ValidatorConfig{
		ExpectedIssuer:   "https://issuer.example.com/",
		ExpectedAudience: "castor-client",
	})

	profile, err := validator.ValidateToken(context.Background(), token)
	require.NoError(t, err)
	require.NotNil(t, profile)

	assert.Equal(t, "auth0|123456789", profile.Sub)
	assert.Equal(t, "developer@company.com", profile.Email)
	assert.True(t, profile.EmailVerified)
	assert.Equal(t, "Jane Doe", profile.Name)
	assert.Equal(t, "Jane", profile.GivenName)
	assert.Equal(t, "Doe", profile.FamilyName)
	assert.Equal(t, "jdoe", profile.PreferredUsername)
	assert.Equal(t, "https://cdn.example.com/avatars/jdoe.png", profile.Picture)
	require.NotNil(t, profile.UpdatedAt)
	assert.Equal(t, time.Unix(updatedAtEpoch, 0).UTC(), *profile.UpdatedAt)
}

func TestOIDCTokenValidator_BearerPrefix(t *testing.T) {
	claims := map[string]interface{}{
		"sub":   "sub123",
		"email": "user@example.com",
		"name":  "Test User",
		"exp":   time.Now().Add(1 * time.Hour).Unix(),
	}
	token := "Bearer " + createTestJWT(claims)

	validator := auth.NewOIDCTokenValidator(auth.ValidatorConfig{})
	profile, err := validator.ValidateToken(context.Background(), token)
	require.NoError(t, err)
	assert.Equal(t, "user@example.com", profile.Email)
	assert.Equal(t, "Test User", profile.Name)
}

func TestOIDCTokenValidator_ExpiredToken(t *testing.T) {
	claims := map[string]interface{}{
		"sub":   "sub123",
		"email": "user@example.com",
		"exp":   time.Now().Add(-1 * time.Hour).Unix(),
	}
	token := createTestJWT(claims)

	validator := auth.NewOIDCTokenValidator(auth.ValidatorConfig{})
	_, err := validator.ValidateToken(context.Background(), token)
	assert.ErrorIs(t, err, auth.ErrExpiredToken)
}

func TestOIDCTokenValidator_IssuerMismatch(t *testing.T) {
	claims := map[string]interface{}{
		"sub":   "sub123",
		"email": "user@example.com",
		"iss":   "https://wrong-issuer.com",
		"exp":   time.Now().Add(1 * time.Hour).Unix(),
	}
	token := createTestJWT(claims)

	validator := auth.NewOIDCTokenValidator(auth.ValidatorConfig{
		ExpectedIssuer: "https://expected-issuer.com",
	})
	_, err := validator.ValidateToken(context.Background(), token)
	assert.ErrorIs(t, err, auth.ErrInvalidIssuer)
}

func TestOIDCTokenValidator_AudienceMismatch(t *testing.T) {
	claims := map[string]interface{}{
		"sub":   "sub123",
		"email": "user@example.com",
		"aud":   "wrong-audience",
		"exp":   time.Now().Add(1 * time.Hour).Unix(),
	}
	token := createTestJWT(claims)

	validator := auth.NewOIDCTokenValidator(auth.ValidatorConfig{
		ExpectedAudience: "expected-audience",
	})
	_, err := validator.ValidateToken(context.Background(), token)
	assert.ErrorIs(t, err, auth.ErrInvalidAudience)
}

func TestOIDCTokenValidator_UserInfoFallback(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "Bearer opaque-token-xyz", r.Header.Get("Authorization"))
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"sub":                "oauth2|999",
			"email":              "alex@company.com",
			"name":               "Alex Smith",
			"family_name":        "Smith",
			"given_name":         "Alex",
			"preferred_username": "alexs",
			"picture":            "https://cdn.example.com/alex.jpg",
			"updated_at":         "2026-08-01T12:00:00Z",
		})
	}))
	defer server.Close()

	validator := auth.NewOIDCTokenValidator(auth.ValidatorConfig{
		UserInfoURL: server.URL,
	})

	profile, err := validator.ValidateToken(context.Background(), "opaque-token-xyz")
	require.NoError(t, err)
	assert.Equal(t, "alex@company.com", profile.Email)
	assert.Equal(t, "Alex Smith", profile.Name)
	assert.Equal(t, "Smith", profile.FamilyName)
	assert.Equal(t, "Alex", profile.GivenName)
	assert.Equal(t, "alexs", profile.PreferredUsername)
	assert.Equal(t, "https://cdn.example.com/alex.jpg", profile.Picture)
	require.NotNil(t, profile.UpdatedAt)
}

func TestMockTokenValidator(t *testing.T) {
	mock := &auth.MockTokenValidator{
		ProfileToReturn: &model.UserProfile{
			Email: "mock@example.com",
			Name:  "Mock User",
		},
	}
	profile, err := mock.ValidateToken(context.Background(), "any-token")
	require.NoError(t, err)
	assert.Equal(t, "mock@example.com", profile.Email)
	assert.Equal(t, "Mock User", profile.Name)
}
