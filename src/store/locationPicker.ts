/** Passes a picked location back to the screen that opened `/location`. */
type Listener = (value: string) => void;

let listener: Listener | null = null;

export const locationPicker = {
  open(onPick: Listener) {
    listener = onPick;
  },
  pick(value: string) {
    listener?.(value);
    listener = null;
  },
  cancel() {
    listener = null;
  },
};
