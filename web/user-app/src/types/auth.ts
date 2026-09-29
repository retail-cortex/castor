export type IdentityProviderType = 'google' | 'okta' | 'microsoft' | 'keycloak';

export interface OAuthProviderConfig {
  id: IdentityProviderType;
  name: string;
  clientId: string;
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string[];
}

export interface OAuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresAt: number; // Unix timestamp in ms
  tokenType: string;
}

export interface OIDCClaims {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  hd?: string; // Hosted Domain (e.g. retailcortex.com)
  preferred_username?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  userClaims: OIDCClaims | null;
  tokens: OAuthTokens | null;
  corporateDomain: string | null;
  isDomainVerified: boolean;
  authError: string | null;
}
