/**
 * Google Geocoding / Places wrappers used by the home location-gate and the location-search
 * autocomplete (auth_api.md — location permission + search flows).
 */
import { config } from './config';

export interface GeocodedAddress {
  state?: string;
  city?: string;
  locality?: string;
  formattedAddress: string;
}

interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

function pickComponent(components: AddressComponent[], type: string): string | undefined {
  return components.find((c) => c.types.includes(type))?.long_name;
}

function fromComponents(components: AddressComponent[], formattedAddress: string): GeocodedAddress {
  return {
    state: pickComponent(components, 'administrative_area_level_1'),
    city:
      pickComponent(components, 'locality') ??
      pickComponent(components, 'administrative_area_level_2'),
    locality:
      pickComponent(components, 'sublocality_level_1') ??
      pickComponent(components, 'sublocality') ??
      pickComponent(components, 'neighborhood'),
    formattedAddress,
  };
}

/** Reverse-geocode device coordinates into state/city/locality name components. */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodedAddress | null> {
  if (!config.googleMapsApiKey) return null;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${config.googleMapsApiKey}`;
  const res = await fetch(url);
  const json = await res.json();
  const result = json?.results?.[0];
  if (!result) return null;
  return fromComponents(result.address_components, result.formatted_address);
}

/** Forward-geocode a resolved place id into state/city/locality name components. */
export async function geocodePlaceId(placeId: string): Promise<GeocodedAddress | null> {
  if (!config.googleMapsApiKey) return null;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${placeId}&key=${config.googleMapsApiKey}`;
  const res = await fetch(url);
  const json = await res.json();
  const result = json?.results?.[0];
  if (!result) return null;
  return fromComponents(result.address_components, result.formatted_address);
}

export interface PlaceAutocompletePrediction {
  placeId: string;
  description: string;
}

/** Places Autocomplete — India-scoped suggestions for the location search box. */
export async function autocompletePlaces(input: string, sessionToken: string): Promise<PlaceAutocompletePrediction[]> {
  if (!config.googleMapsApiKey || !input.trim()) return [];
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
    input,
  )}&components=country:in&sessiontoken=${sessionToken}&key=${config.googleMapsApiKey}`;
  const res = await fetch(url);
  const json = await res.json();
  if (json?.status !== 'OK' && json?.status !== 'ZERO_RESULTS') return [];
  return (json?.predictions ?? []).map((p: { place_id: string; description: string }) => ({
    placeId: p.place_id,
    description: p.description,
  }));
}

/** A fresh-ish session token for Places Autocomplete billing grouping. */
export function newPlacesSessionToken(): string {
  let out = '';
  for (let i = 0; i < 32; i += 1) out += Math.floor(Math.random() * 16).toString(16);
  return out;
}
