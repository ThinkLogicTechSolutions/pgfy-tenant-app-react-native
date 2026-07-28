/**
 * Session owner: holds the signed-in tenant profile, keeps the access token in sync between
 * AsyncStorage and the API client, and centralises sign-out.
 *
 * Boot sequence: restore the persisted token → hand it to the API client (so the very first
 * request is authenticated) → refresh it against the server. A 401 on refresh means the token
 * is dead, so we sign out; a *network* failure keeps the cached session so the app still opens
 * offline.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  ApiError,
  authApi,
  profileApi,
  setAccessToken,
  setUnauthorizedHandler,
  type ApiProfile,
  type UpdateTenantProfileInput,
} from '@/lib/api';
import { session } from '@/lib/session';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: ApiProfile | null;
  /** True once a guest session (Skip on login) is active — no tenant profile, browse-only. */
  isGuest: boolean;
  sendOtp: (phone: string) => Promise<void>;
  /** Resolves to the verified profile so the caller can route on `newLogin`. */
  verifyOtp: (phone: string, otp: string) => Promise<{ user: ApiProfile; newLogin: boolean }>;
  /** Open a guest session so the tenant can browse without signing in. */
  continueAsGuest: () => Promise<void>;
  updateProfile: (patch: UpdateTenantProfileInput) => Promise<ApiProfile>;
  /** Refresh the session and return the freshest profile. */
  refresh: () => Promise<ApiProfile>;
  /**
   * Apply a verified phone/email change: adopt the fresh access token the verify endpoint
   * returns and patch the changed field straight into the cached profile.
   */
  applyContactUpdate: (token: string, patch: Partial<Pick<ApiProfile, 'phone' | 'email'>>) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<ApiProfile | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  /** Guards against a 401 landing mid-sign-out and re-entering `signOut`. */
  const signingOut = useRef(false);

  const applySession = useCallback(async (token: string, profile: ApiProfile) => {
    setAccessToken(token);
    await session.saveAuth(token, profile);
    setUser(profile);
    setIsGuest(false);
    setStatus('authenticated');
  }, []);

  const clearSession = useCallback(async () => {
    setAccessToken(null);
    await session.logout();
    setUser(null);
    setIsGuest(false);
    setStatus('unauthenticated');
  }, []);

  const continueAsGuest = useCallback(async () => {
    const { access_token } = await authApi.guestLogin();
    setAccessToken(access_token);
    await session.saveGuestAuth(access_token);
    setUser(null);
    setIsGuest(true);
    setStatus('authenticated');
  }, []);

  const signOut = useCallback(async () => {
    if (signingOut.current) return;
    signingOut.current = true;
    try {
      // Best-effort server-side invalidation; a dead token shouldn't block a local sign-out.
      await authApi.logout().catch(() => {});
      await clearSession();
    } finally {
      signingOut.current = false;
    }
  }, [clearSession]);

  const refresh = useCallback(async () => {
    const { access_token, user: profile } = await authApi.refreshSession();
    await applySession(access_token, profile);
    return profile;
  }, [applySession]);

  // Any 401 from any request means the token died — drop the session app-wide.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void signOut();
    });
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  // Boot: restore the cached session, then validate/refresh it.
  useEffect(() => {
    let active = true;

    (async () => {
      const stored = await session.getAuth();
      if (!active) return;

      if (!stored) {
        setStatus('unauthenticated');
        return;
      }

      // Optimistically adopt the cached session so the first request carries the token.
      setAccessToken(stored.token);
      setUser(stored.user);
      setIsGuest(stored.isGuest);
      setStatus('authenticated');

      // Guest tokens have no tenant profile to refresh — trust the cached token until a
      // request 401s, which routes through the same unauthorized handler as a real session.
      if (stored.isGuest) return;

      try {
        const { access_token, user: profile } = await authApi.refreshSession();
        if (!active) return;
        await applySession(access_token, profile);
      } catch (e) {
        if (!active) return;
        // Offline? Keep the cached session. Rejected token? Sign out.
        // (A 401 also fires the unauthorized handler, which is idempotent.)
        if (e instanceof ApiError && e.isNetworkError) return;
        await clearSession();
      }
    })();

    return () => {
      active = false;
    };
  }, [applySession, clearSession]);

  const sendOtp = useCallback(async (phone: string) => {
    await authApi.sendPhoneOtp({ phone });
  }, []);

  const verifyOtp = useCallback(
    async (phone: string, otp: string) => {
      const { access_token, user: profile, newLogin } = await authApi.verifyPhoneOtp({ phone, otp });
      await applySession(access_token, profile);
      return { user: profile, newLogin };
    },
    [applySession],
  );

  const updateProfile = useCallback(
    async (patch: UpdateTenantProfileInput) => {
      if (!user) throw new Error('Not signed in.');
      const updated = await profileApi.updateTenantProfile(user.id, patch);
      setUser(updated);
      await session.saveUser(updated);
      return updated;
    },
    [user],
  );

  const applyContactUpdate = useCallback(
    async (token: string, patch: Partial<Pick<ApiProfile, 'phone' | 'email'>>) => {
      if (!user) return;
      const updated: ApiProfile = { ...user, ...patch };
      setAccessToken(token);
      await session.saveAuth(token, updated);
      setUser(updated);
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      isGuest,
      sendOtp,
      verifyOtp,
      continueAsGuest,
      updateProfile,
      refresh,
      applyContactUpdate,
      signOut,
    }),
    [status, user, isGuest, sendOtp, verifyOtp, continueAsGuest, updateProfile, refresh, applyContactUpdate, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth requires AuthProvider');
  return ctx;
}
