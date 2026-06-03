import { LISTINGS } from '@/data';

function distSq(lat1: number, lng1: number, lat2: number, lng2: number) {
  return (lat1 - lat2) ** 2 + (lng1 - lng2) ** 2;
}

/** Pick the listing locality closest to coordinates (mock catalog is Bengaluru). */
export function nearestLocality(lat: number, lng: number): string {
  let best = LISTINGS[0];
  let bestD = Infinity;
  for (const l of LISTINGS) {
    const d = distSq(lat, lng, l.lat, l.lng);
    if (d < bestD) {
      bestD = d;
      best = l;
    }
  }
  return best.locality;
}

export type NearMeResult =
  | { ok: true; label: string; lat: number; lng: number }
  | { ok: false; reason: 'denied' | 'unavailable' | 'error'; message: string };

/** Request device location and resolve to nearest known area label. */
export async function resolveNearMeLocation(): Promise<NearMeResult> {
  try {
    const Location = await import('expo-location');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { ok: false, reason: 'denied', message: 'Location permission is required to use Near me.' };
    }
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const { latitude, longitude } = pos.coords;
    const locality = nearestLocality(latitude, longitude);
    return { ok: true, label: locality, lat: latitude, lng: longitude };
  } catch {
    return { ok: false, reason: 'unavailable', message: 'Could not get your location. Try again or type an area.' };
  }
}
