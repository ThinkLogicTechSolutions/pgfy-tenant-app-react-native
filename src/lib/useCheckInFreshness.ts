/**
 * Keeps a `{ checkIn, checkOut }`-holding state's check-in date from ever silently drifting
 * into the past. A `useState` initializer only runs once, at mount — a screen that stays
 * mounted (tabs/stacks don't unmount just because they're not visible) across a midnight
 * rollover, or that the tenant simply leaves open overnight, would otherwise keep showing
 * that frozen date forever.
 *
 * Re-clamps on two distinct triggers, since neither alone covers both real scenarios:
 *  - navigation focus (`useFocusEffect`) — switching back to this screen from another one
 *    in-app, after time has passed.
 *  - the app returning to the foreground (`AppState`) — the device was locked/backgrounded
 *    (or the app simply left running) overnight while this exact screen stayed the active
 *    one the whole time, which never fires a navigation focus event at all.
 */
import { useCallback, useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { clampCheckInToFuture, defaultCheckOut } from './dates';

interface HasCheckInOut {
  checkIn: string;
  checkOut: string;
}

export function useCheckInFreshness<T extends HasCheckInOut>(setValues: (updater: (prev: T) => T) => void) {
  const reclamp = useCallback(() => {
    setValues((prev) => {
      const clamped = clampCheckInToFuture(prev.checkIn);
      if (clamped === prev.checkIn) return prev;
      return { ...prev, checkIn: clamped, checkOut: prev.checkOut && clamped <= prev.checkOut ? prev.checkOut : defaultCheckOut(clamped) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setValues]);

  useFocusEffect(reclamp);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') reclamp();
    });
    return () => sub.remove();
  }, [reclamp]);
}
