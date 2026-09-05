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

package auth

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/retail-cortex/castor/pkg/model"
)

var (
	ErrMissingToken      = errors.New("missing oauth authorization token")
	ErrInvalidToken      = errors.New("invalid oauth token")
	ErrExpiredToken      = errors.New("oauth token has expired")
	ErrInvalidIssuer     = errors.New("oauth token issuer mismatch")
	ErrInvalidAudience   = errors.New("oauth token audience mismatch")
	ErrUserInfoFailed    = errors.New("failed to retrieve profile from userinfo endpoint")
	ErrMissingEmailClaim = errors.New("oauth token does not contain an email claim")
)

// TokenValidator defines the contract for validating OAuth / OIDC tokens and extracting profile claims.
type TokenValidator interface {
	ValidateToken(ctx context.Context, tokenString string) (*model.UserProfile, error)
}

// ValidatorConfig configures OAuth / OIDC validation parameters.
type ValidatorConfig struct {
	RequireOAuth     bool
	ExpectedIssuer   string
	ExpectedAudience string
	UserInfoURL      string
	SkipExpiryCheck  bool
	HTTPClient       *http.Client
}

// OIDCTokenValidator validates OIDC JWTs and queries userinfo endpoints if configured.
type OIDCTokenValidator struct {
	cfg        ValidatorConfig
	httpClient *http.Client
}

func NewOIDCTokenValidator(cfg ValidatorConfig) *OIDCTokenValidator {
	client := cfg.HTTPClient
	if client == nil {
		client = &http.Client{Timeout: 10 * time.Second}
	}
	return &OIDCTokenValidator{
		cfg:        cfg,
		httpClient: client,
	}
}

// rawClaims captures standard OIDC profile and token claims.
type rawClaims struct {
	Sub               string      `json:"sub"`
	Email             string      `json:"email"`
	EmailVerified     interface{} `json:"email_verified"`
	Name              string      `json:"name"`
	FamilyName        string      `json:"family_name"`
	GivenName         string      `json:"given_name"`
	PreferredUsername string      `json:"preferred_username"`
	Picture           string      `json:"picture"`
	UpdatedAt         interface{} `json:"updated_at"`
	Exp               int64       `json:"exp"`
	Iss               string      `json:"iss"`
	Aud               interface{} `json:"aud"`
}

func parseUpdatedAt(raw interface{}) *time.Time {
	if raw == nil {
		return nil
	}
	switch v := raw.(type) {
	case float64:
		t := time.Unix(int64(v), 0).UTC()
		return &t
	case int64:
		t := time.Unix(v, 0).UTC()
		return &t
	case json.Number:
		if i, err := v.Int64(); err == nil {
			t := time.Unix(i, 0).UTC()
			return &t
		}
	case string:
		if t, err := time.Parse(time.RFC3339, v); err == nil {
			utc := t.UTC()
			return &utc
		}
		if t, err := time.Parse("2006-01-02T15:04:05Z07:00", v); err == nil {
			utc := t.UTC()
			return &utc
		}
	}
	return nil
}

func parseEmailVerified(raw interface{}) bool {
	switch v := raw.(type) {
	case bool:
		return v
	case string:
		return strings.EqualFold(v, "true")
	default:
		return false
	}
}

// ValidateToken decodes and validates an OAuth bearer token (JWT or via userinfo endpoint).
func (v *OIDCTokenValidator) ValidateToken(ctx context.Context, tokenString string) (*model.UserProfile, error) {
	token := strings.TrimSpace(tokenString)
	if token == "" {
		return nil, ErrMissingToken
	}

	// Remove optional "Bearer " prefix if passed directly
	if strings.HasPrefix(strings.ToLower(token), "bearer ") {
		token = strings.TrimSpace(token[7:])
	}

	// 1. Try decoding as JWT
	parts := strings.Split(token, ".")
	if len(parts) >= 2 {
		payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
		if err != nil {
			// Fallback with standard URL encoding with padding
			payloadBytes, err = base64.URLEncoding.DecodeString(parts[1])
		}

		if err == nil {
			var claims rawClaims
			dec := json.NewDecoder(strings.NewReader(string(payloadBytes)))
			dec.UseNumber()
			if err := dec.Decode(&claims); err == nil && (claims.Sub != "" || claims.Email != "") {
				// Validate expiration
				if !v.cfg.SkipExpiryCheck && claims.Exp > 0 {
					if time.Now().UTC().Unix() > claims.Exp {
						return nil, ErrExpiredToken
					}
				}

				// Validate issuer
				if v.cfg.ExpectedIssuer != "" && claims.Iss != "" && !strings.EqualFold(claims.Iss, v.cfg.ExpectedIssuer) {
					return nil, fmt.Errorf("%w: expected %s, got %s", ErrInvalidIssuer, v.cfg.ExpectedIssuer, claims.Iss)
				}

				// Validate audience
				if v.cfg.ExpectedAudience != "" && claims.Aud != nil {
					audMatch := false
					switch aud := claims.Aud.(type) {
					case string:
						audMatch = aud == v.cfg.ExpectedAudience
					case []interface{}:
						for _, item := range aud {
							if s, ok := item.(string); ok && s == v.cfg.ExpectedAudience {
								audMatch = true
								break
							}
						}
					}
					if !audMatch {
						return nil, fmt.Errorf("%w: audience does not match %s", ErrInvalidAudience, v.cfg.ExpectedAudience)
					}
				}

				profile := &model.UserProfile{
					Sub:               claims.Sub,
					Email:             claims.Email,
					EmailVerified:     parseEmailVerified(claims.EmailVerified),
					Name:              claims.Name,
					FamilyName:        claims.FamilyName,
					GivenName:         claims.GivenName,
					PreferredUsername: claims.PreferredUsername,
					Picture:           claims.Picture,
					UpdatedAt:         parseUpdatedAt(claims.UpdatedAt),
				}

				// If claims lack full profile and UserInfoURL is configured, enrich from userinfo
				if v.cfg.UserInfoURL != "" && (profile.Name == "" || profile.Email == "") {
					if enriched, err := v.fetchUserInfo(ctx, token); err == nil {
						v.mergeProfile(profile, enriched)
					}
				}

				return profile, nil
			}
		}
	}

	// 2. If not a valid JWT or opaque token, query userinfo endpoint if configured
	if v.cfg.UserInfoURL != "" {
		return v.fetchUserInfo(ctx, token)
	}

	return nil, ErrInvalidToken
}

func (v *OIDCTokenValidator) fetchUserInfo(ctx context.Context, token string) (*model.UserProfile, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", v.cfg.UserInfoURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := v.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrUserInfoFailed, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("%w: status %d (%s)", ErrUserInfoFailed, resp.StatusCode, string(body))
	}

	var claims rawClaims
	dec := json.NewDecoder(resp.Body)
	dec.UseNumber()
	if err := dec.Decode(&claims); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrUserInfoFailed, err)
	}

	return &model.UserProfile{
		Sub:               claims.Sub,
		Email:             claims.Email,
		EmailVerified:     parseEmailVerified(claims.EmailVerified),
		Name:              claims.Name,
		FamilyName:        claims.FamilyName,
		GivenName:         claims.GivenName,
		PreferredUsername: claims.PreferredUsername,
		Picture:           claims.Picture,
		UpdatedAt:         parseUpdatedAt(claims.UpdatedAt),
	}, nil
}

func (v *OIDCTokenValidator) mergeProfile(target, source *model.UserProfile) {
	if target.Email == "" {
		target.Email = source.Email
	}
	if !target.EmailVerified {
		target.EmailVerified = source.EmailVerified
	}
	if target.Name == "" {
		target.Name = source.Name
	}
	if target.GivenName == "" {
		target.GivenName = source.GivenName
	}
	if target.FamilyName == "" {
		target.FamilyName = source.FamilyName
	}
	if target.PreferredUsername == "" {
		target.PreferredUsername = source.PreferredUsername
	}
	if target.Picture == "" {
		target.Picture = source.Picture
	}
	if target.UpdatedAt == nil {
		target.UpdatedAt = source.UpdatedAt
	}
}

// MockTokenValidator implements TokenValidator for tests.
type MockTokenValidator struct {
	ProfileToReturn *model.UserProfile
	ErrToReturn     error
}

func (m *MockTokenValidator) ValidateToken(ctx context.Context, tokenString string) (*model.UserProfile, error) {
	if m.ErrToReturn != nil {
		return nil, m.ErrToReturn
	}
	if m.ProfileToReturn != nil {
		return m.ProfileToReturn, nil
	}
	return nil, ErrInvalidToken
}
