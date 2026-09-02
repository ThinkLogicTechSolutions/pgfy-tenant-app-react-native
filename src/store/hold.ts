/**
 * BookMyShow-style bed hold. Selecting a bed starts a countdown; the booking
 * must be completed before it expires, otherwise the bed is released.
 */
import { useEffect, useReducer } from 'react';

export const HOLD_SECONDS = 600; // 10 minutes

export interface HoldInfo {
  bedId: string;
  listingId: string;
  roomNumber: string;
  bedLabel: string;
  sharing: string;
  rent: number;
}

interface HoldState extends HoldInfo {
  active: boolean;
  expired: boolean;
  secondsLeft: number;
}

const EMPTY: HoldState = {
  bedId: '', listingId: '', roomNumber: '', bedLabel: '', sharing: '', rent: 0,
  active: false, expired: false, secondsLeft: 0,
};

let state: HoldState = { ...EMPTY };
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function stop() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

export function startHold(info: HoldInfo) {
  state = { ...info, active: true, expired: false, secondsLeft: HOLD_SECONDS };
  stop();
  timer = setInterval(() => {
    if (state.secondsLeft <= 1) {
      state = { ...state, secondsLeft: 0, active: false, expired: true };
      stop();
    } else {
      state = { ...state, secondsLeft: state.secondsLeft - 1 };
    }
    emit();
  }, 1000);
  emit();
}

export function releaseHold() {
  stop();
  state = { ...EMPTY };
  emit();
}

export function getHold() {
  return state;
}

export function formatHold(s: number) {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${String(ss).padStart(2, '0')}`;
}

export function useHold() {
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    listeners.add(force);
    return () => {
      listeners.delete(force);
    };
  }, []);
  return state;
}
