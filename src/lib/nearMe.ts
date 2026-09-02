import { reverseGeocode } from './googleMaps';
import { matchOperationalLocation, type OperationalMatch } from './operationalLocation';
import type { CityMaster, LocalityMaster, StateMaster } from '@/lib/api';

export type NearMeResult =
  | ({ ok: true; label: string; lat: number; lng: number } & OperationalMatch)
  | { ok: false; reason: 'denied' | 'unavailable' | 'error'; message: string }
  | { ok: false; reason: 'not-operational'; message: string; label: string };

interface MasterDataLists {
  states: StateMaster[];
  cities: CityMaster[];
  localities: LocalityMaster[];
}

/** Request device location, reverse-geocode it, and match it against operational master data. */
export async function resolveNearMeLocation(masterData: MasterDataLists): Promise<NearMeResult> {
  try {
    const Location = await import('expo-location');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { ok: false, reason: 'denied', message: 'Location permission is required to use Near me.' };
    }
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const { latitude, longitude } = pos.coords;

    const address = await reverseGeocode(latitude, longitude);
    if (!address) {
      return { ok: false, reason: 'unavailable', message: 'Could not get your location. Try again or type an area.' };
    }

    const match = matchOperationalLocation(address, masterData);
    if (!match) {
      return {
        ok: false,
        reason: 'not-operational',
        message: "We're not operational at your current location yet.",
        label: address.locality ?? address.city ?? address.formattedAddress,
      };
    }

    return {
      ok: true,
      label: match.localityName ?? match.cityName,
      lat: latitude,
      lng: longitude,
      ...match,
    };
  } catch {
    return { ok: false, reason: 'unavailable', message: 'Could not get your location. Try again or type an area.' };
  }
}
