/** Tiny persisted session flags for the mockup (onboarding seen / logged in). */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  onboarded: 'pgfy.onboarded',
  loggedIn: 'pgfy.loggedIn',
} as const;

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
  async isLoggedIn() {
    return (await AsyncStorage.getItem(KEYS.loggedIn)) === '1';
  },
  async login() {
    await AsyncStorage.setItem(KEYS.loggedIn, '1');
  },
  async logout() {
    await AsyncStorage.removeItem(KEYS.loggedIn);
  },
};
