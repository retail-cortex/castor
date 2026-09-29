import { OAuthTokens, OIDCClaims, IdentityProviderType } from '../types/auth';

const FREEMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'aol.com',
  'protonmail.com',
  'mail.com',
]);

export class AuthService {
  private static TOKEN_KEY = 'castor_auth_tokens';
  private static CLAIMS_KEY = 'castor_user_claims';

  // Cryptographically secure PKCE challenge generator (RFC 7636)
  public static async generatePKCE(): Promise<{ codeVerifier: string; codeChallenge: string }> {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const codeVerifier = this.base64UrlEncode(array);

    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const codeChallenge = this.base64UrlEncode(new Uint8Array(digest));

    return { codeVerifier, codeChallenge };
  }

  private static base64UrlEncode(buffer: Uint8Array): string {
    let str = '';
    for (let i = 0; i < buffer.byteLength; i++) {
      str += String.fromCharCode(buffer[i]);
    }
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  public static isFreemailDomain(email: string): boolean {
    const parts = email.split('@');
    if (parts.length !== 2) return false;
    const domain = parts[1].toLowerCase().trim();
    return FREEMAIL_DOMAINS.has(domain);
  }

  public static extractDomain(email: string): string {
    const parts = email.split('@');
    return parts.length === 2 ? parts[1].toLowerCase().trim() : '';
  }

  public static saveSession(tokens: OAuthTokens, claims: OIDCClaims): void {
    // In-memory or session storage (never plain localStorage for unencrypted access tokens in prod)
    sessionStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokens));
    sessionStorage.setItem(this.CLAIMS_KEY, JSON.stringify(claims));
  }

  public static loadSession(): { tokens: OAuthTokens | null; claims: OIDCClaims | null } {
    try {
      const tokensStr = sessionStorage.getItem(this.TOKEN_KEY);
      const claimsStr = sessionStorage.getItem(this.CLAIMS_KEY);
      const tokens = tokensStr ? JSON.parse(tokensStr) : null;
      const claims = claimsStr ? JSON.parse(claimsStr) : null;
      return { tokens, claims };
    } catch {
      return { tokens: null, claims: null };
    }
  }

  public static clearSession(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.CLAIMS_KEY);
  }

  // Simulated Enterprise OIDC exchange for local development & demonstration
  public static async simulateEnterpriseSSO(
    provider: IdentityProviderType,
    email: string = 'ryan@retailcortex.com',
    name: string = 'Ryan McGuinness'
  ): Promise<{ tokens: OAuthTokens; claims: OIDCClaims }> {
    if (this.isFreemailDomain(email)) {
      throw new Error(`Enterprise corporate domain required. Public freemail addresses (${email}) are strictly prohibited.`);
    }

    const domain = this.extractDomain(email);

    // Mock realistic OIDC token payload
    const mockClaims: OIDCClaims = {
      sub: `oidc_${provider}_${Math.random().toString(36).substring(2, 12)}`,
      email,
      email_verified: true,
      name,
      given_name: name.split(' ')[0],
      family_name: name.split(' ').slice(1).join(' '),
      picture: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      hd: domain,
      preferred_username: `@${name.toLowerCase().replace(/\s+/g, '')}`,
    };

    const mockTokens: OAuthTokens = {
      accessToken: `castor_oauth_token_${Math.random().toString(36).substring(2)}`,
      idToken: `castor_id_jwt_${Math.random().toString(36).substring(2)}`,
      refreshToken: `castor_refresh_${Math.random().toString(36).substring(2)}`,
      expiresAt: Date.now() + 3600 * 1000 * 8, // 8 hours
      tokenType: 'Bearer',
    };

    this.saveSession(mockTokens, mockClaims);
    return { tokens: mockTokens, claims: mockClaims };
  }
}
