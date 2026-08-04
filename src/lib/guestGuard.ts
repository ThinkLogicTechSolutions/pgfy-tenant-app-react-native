/**
 * Guest-session gate: shared by any screen/action that a guest (Skip-on-login) tenant must
 * not reach — booking, and anything else that needs a real tenant profile. Navigates to
 * login with the Skip button disabled (`guestBlocked=1`) so the guest can't loop back out.
 */
import type { Router } from 'expo-router';
import { alert } from './alertDialog';

export const LOGIN_ROUTE = {
  pathname: '/(auth)/login',
  params: { guestBlocked: '1' },
} as const;

/** Redirect a guest to login with a "please log in to continue" notice. */
export function requireLogin(router: Router, message = 'Please login to continue.') {
  alert('Login required', message);
  router.push(LOGIN_ROUTE);
}
