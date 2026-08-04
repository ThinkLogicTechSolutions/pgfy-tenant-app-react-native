/** Imperative custom alert — drop-in replacement for `Alert.alert`, styled to app design. */
export interface AlertButton {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
}

export interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

type Listener = (options: AlertOptions | null) => void;

let listener: Listener | null = null;

export const alertStore = {
  subscribe(l: Listener) {
    listener = l;
    return () => {
      if (listener === l) listener = null;
    };
  },
};

/** Shows the custom alert dialog. Mirrors `Alert.alert(title, message)` for easy swap-in. */
export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  listener?.({ title, message, buttons });
}

export function hideAlert() {
  listener?.(null);
}
