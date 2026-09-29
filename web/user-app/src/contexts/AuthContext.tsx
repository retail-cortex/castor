import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthState, IdentityProviderType, OIDCClaims } from '../types/auth';
import { AuthService } from '../services/authService';
import { apiClient } from '../services/apiClient';
import { useToast } from './ToastContext';

interface AuthContextValue extends AuthState {
  loginWithProvider: (provider: IdentityProviderType, email?: string, name?: string) => Promise<void>;
  logout: () => void;
  updateUserClaims: (claims: Partial<OIDCClaims>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast, show429Toast } = useToast();
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    userClaims: null,
    tokens: null,
    corporateDomain: null,
    isDomainVerified: false,
    authError: null,
  });

  // Setup apiClient 429 rate limit callback
  useEffect(() => {
    apiClient.setRateLimitHandler((retrySeconds) => {
      show429Toast(retrySeconds);
    });
  }, [show429Toast]);

  // Restore session from storage on app mount
  useEffect(() => {
    const { tokens, claims } = AuthService.loadSession();
    if (tokens && claims) {
      if (tokens.expiresAt > Date.now()) {
        const domain = AuthService.extractDomain(claims.email);
        const isDomainVerified = !AuthService.isFreemailDomain(claims.email);
        apiClient.setToken(tokens.accessToken);

        setState({
          isAuthenticated: true,
          isLoading: false,
          userClaims: claims,
          tokens,
          corporateDomain: domain,
          isDomainVerified,
          authError: null,
        });
        return;
      }
      // Expired token
      AuthService.clearSession();
      apiClient.setToken(null);
    }
    setState((prev) => ({ ...prev, isLoading: false, isAuthenticated: false }));
  }, []);

  const loginWithProvider = useCallback(
    async (provider: IdentityProviderType, email: string = 'ryan@retailcortex.com', name: string = 'Ryan McGuinness') => {
      setState((prev) => ({ ...prev, isLoading: true, authError: null }));
      try {
        if (AuthService.isFreemailDomain(email)) {
          throw new Error(`Enterprise corporate domain required. Public freemail addresses (${email}) are strictly prohibited.`);
        }

        const { tokens, claims } = await AuthService.simulateEnterpriseSSO(provider, email, name);
        const domain = AuthService.extractDomain(claims.email);
        apiClient.setToken(tokens.accessToken);

        setState({
          isAuthenticated: true,
          isLoading: false,
          userClaims: claims,
          tokens,
          corporateDomain: domain,
          isDomainVerified: true,
          authError: null,
        });

        showToast({
          type: 'success',
          title: 'Authenticated Successfully',
          message: `Welcome back, ${claims.name} (${domain})`,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          authError: msg,
        }));
        showToast({
          type: 'error',
          title: 'Authentication Failed',
          message: msg,
        });
        throw err;
      }
    },
    [showToast]
  );

  const logout = useCallback(() => {
    AuthService.clearSession();
    apiClient.setToken(null);
    setState({
      isAuthenticated: false,
      isLoading: false,
      userClaims: null,
      tokens: null,
      corporateDomain: null,
      isDomainVerified: false,
      authError: null,
    });
    showToast({
      type: 'info',
      title: 'Signed Out',
      message: 'Your session has been terminated safely.',
    });
  }, [showToast]);

  const updateUserClaims = useCallback((updatedClaims: Partial<OIDCClaims>) => {
    setState((prev) => {
      if (!prev.userClaims) return prev;
      const merged = { ...prev.userClaims, ...updatedClaims };
      if (prev.tokens) {
        AuthService.saveSession(prev.tokens, merged);
      }
      return { ...prev, userClaims: merged };
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        loginWithProvider,
        logout,
        updateUserClaims,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
