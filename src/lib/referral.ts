/**
 * A referral code arriving via `https://share.pgfy.in/referral?code=...` lands on `/referral`
 * before the tenant is signed in — this persists it across the login → OTP-verify hop so it
 * can ride along on `verifyPhoneOtp` once the new account is created.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'pgfy.pendingReferralCode';

export async function savePendingReferralCode(code: string): Promise<void> {
  await AsyncStorage.setItem(KEY, code);
}

export async function getPendingReferralCode(): Promise<string | null> {
  return AsyncStorage.getItem(KEY);
}

export async function clearPendingReferralCode(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
