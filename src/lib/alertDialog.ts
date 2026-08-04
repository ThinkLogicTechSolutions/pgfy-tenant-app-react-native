/**
 * Drop-in replacement for React Native's `Alert.alert`, rendered with the app's own design
 * system instead of the OS-native dialog. Any screen calls `alert(title, message, buttons)`;
 * `AlertDialogHost` (mounted once in the root layout) subscribes and renders it.
 */
export type AlertButtonStyle = 'default' | 'cancel' | 'destructive';

export interface AlertButton {
  text: string;
  style?: AlertButtonStyle;
  onPress?: () => void;
}

export interface AlertState {
  id: number;
  title: string;
  message?: string;
  buttons: AlertButton[];
}

type Listener = (state: AlertState | null) => void;

let listener: Listener | null = null;
let nextId = 1;

/** `AlertDialogHost` calls this once on mount; do not call from screens. */
export function subscribeAlert(fn: Listener): () => void {
  listener = fn;
  return () => {
    if (listener === fn) listener = null;
  };
}

/** Same signature as RN's `Alert.alert` — title, optional message, optional buttons (defaults to a single "OK"). */
export function alert(title: string, message?: string, buttons?: AlertButton[]): void {
  const state: AlertState = {
    id: nextId++,
    title,
    message,
    buttons: buttons && buttons.length ? buttons : [{ text: 'OK' }],
  };
  listener?.(state);
}

/** Dismiss without invoking any button's `onPress` — used for backdrop taps. */
export function dismissAlert(): void {
  listener?.(null);
}
