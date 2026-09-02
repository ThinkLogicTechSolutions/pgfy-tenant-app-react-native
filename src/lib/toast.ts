/**
 * Transient toast notifications — brief, non-blocking confirmation after an action
 * (e.g. "Review submitted"). Any screen calls `toast.show(...)`; `ToastHost` (mounted once
 * in the root layout) subscribes and renders/auto-dismisses it. Mirrors `alertDialog.ts`'s
 * subscribe/publish pattern.
 */
export type ToastTone = 'success' | 'error' | 'info';

export interface ToastState {
  id: number;
  message: string;
  tone: ToastTone;
  durationMs: number;
}

type Listener = (state: ToastState | null) => void;

let listener: Listener | null = null;
let nextId = 1;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

/** `ToastHost` calls this once on mount; do not call from screens. */
export function subscribeToast(fn: Listener): () => void {
  listener = fn;
  return () => {
    if (listener === fn) listener = null;
  };
}

export function showToast(message: string, tone: ToastTone = 'success', durationMs = 2500): void {
  if (hideTimer) clearTimeout(hideTimer);
  const state: ToastState = { id: nextId++, message, tone, durationMs };
  listener?.(state);
  hideTimer = setTimeout(() => listener?.(null), durationMs);
}

export const toast = {
  show: (message: string, durationMs?: number) => showToast(message, 'success', durationMs),
  success: (message: string, durationMs?: number) => showToast(message, 'success', durationMs),
  error: (message: string, durationMs?: number) => showToast(message, 'error', durationMs),
  info: (message: string, durationMs?: number) => showToast(message, 'info', durationMs),
};
