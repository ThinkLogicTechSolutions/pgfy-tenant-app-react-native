/** Passes a picked location back to the screen that opened `/location`. */
export interface PickedLocationIds {
  stateId?: number;
  cityId?: number;
  localityId?: number | null;
}

type Listener = (value: string, ids?: PickedLocationIds, operational?: boolean) => void;

let listener: Listener | null = null;

export const locationPicker = {
  open(onPick: Listener) {
    listener = onPick;
  },
  pick(value: string, ids?: PickedLocationIds, operational = true) {
    listener?.(value, ids, operational);
    listener = null;
  },
  cancel() {
    listener = null;
  },
};
