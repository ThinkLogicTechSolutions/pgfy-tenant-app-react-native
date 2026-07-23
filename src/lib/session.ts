/**
 * Persisted session: onboarding-seen flag plus the API access token + cached tenant profile.
 * `AuthContext` owns validating/refreshing the token; this module only persists it.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ApiProfile } from './api/types';

const KEYS = {
  onboarded: 'pgfy.onboarded',
  accessToken: 'pgfy.accessToken',
  user: 'pgfy.user',
  isGuest: 'pgfy.isGuest',
} as const;

export interface StoredAuth {
  token: string;
  /** Null for a guest session — guests have no tenant profile. */
  user: ApiProfile | null;
  isGuest: boolean;
}

export const session = {
  async isOnboarded() {
    return (await AsyncStorage.getItem(KEYS.onboarded)) === '1';
  },
  async setOnboarded() {
    await AsyncStorage.setItem(KEYS.onboarded, '1');
  },
  async resetOnboarded() {
    await AsyncStorage.removeItem(KEYS.onboarded);
  },

  /** Persist the token + user from an auth response. */
  async saveAuth(token: string, user: ApiProfile) {
    await AsyncStorage.multiSet([
      [KEYS.accessToken, token],
      [KEYS.user, JSON.stringify(user)],
    ]);
    await AsyncStorage.removeItem(KEYS.isGuest);
  },

  /** Persist a guest session's token — guests have no tenant profile to store. */
  async saveGuestAuth(token: string) {
    await AsyncStorage.multiSet([
      [KEYS.accessToken, token],
      [KEYS.isGuest, '1'],
    ]);
    await AsyncStorage.removeItem(KEYS.user);
  },

  /** Refresh the cached user without touching the token. */
  async saveUser(user: ApiProfile) {
    await AsyncStorage.setItem(KEYS.user, JSON.stringify(user));
  },

  /** Restore the session written by `saveAuth`/`saveGuestAuth`, or null when absent/corrupt. */
  async getAuth(): Promise<StoredAuth | null> {
    const [[, token], [, rawUser], [, guestFlag]] = await AsyncStorage.multiGet([
      KEYS.accessToken,
      KEYS.user,
      KEYS.isGuest,
    ]);
    if (!token) return null;
    if (guestFlag === '1') return { token, user: null, isGuest: true };
    if (!rawUser) return null;
    try {
      return { token, user: JSON.parse(rawUser) as ApiProfile, isGuest: false };
    } catch {
      await AsyncStorage.multiRemove([KEYS.accessToken, KEYS.user]);
      return null;
    }
  },

  async logout() {
    await AsyncStorage.multiRemove([KEYS.accessToken, KEYS.user, KEYS.isGuest]);
  },
};
